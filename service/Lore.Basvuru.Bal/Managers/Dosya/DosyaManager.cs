using Lore.Basvuru.Bal.Managers.Dosya.Interfaces;
using Lore.Basvuru.Common.Configuration;
using Lore.Basvuru.Common.DTO.Dosya;
using Lore.Basvuru.Common.Helpers;
using Lore.Basvuru.Common.Logging;
using Lore.Basvuru.Common.Models;
using Lore.Basvuru.Dal.Model;
using Lore.Basvuru.Dal.Repository;
using Microsoft.AspNetCore.Http;
using Minio;
using Minio.DataModel.Args;

namespace Lore.Basvuru.Bal.Managers.Dosya
{
    public class DosyaManager : IDosyaManager
    {
        private readonly IGenericRepository<t_bsv_dosya> _dosyaRepo;
        private readonly IMinioClient _minioClient;

        private static readonly HashSet<string> IzinliUzantilar = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
            ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp",
            ".txt", ".csv", ".zip", ".rar", ".7z"
        };

        private const long MaksimumDosyaBoyutu = 20 * 1024 * 1024; // 20 MB

        public DosyaManager(
            IGenericRepository<t_bsv_dosya> dosyaRepo,
            IMinioClient minioClient)
        {
            _dosyaRepo = dosyaRepo;
            _minioClient = minioClient;
        }

        public async Task<DosyaYuklemeResponseDTO> DosyaYukle(
            IFormFile dosya, long basvuruId, long soruId)
        {
            if (dosya == null || dosya.Length == 0)
                throw new AppException(400, "Dosya boş");

            if (dosya.Length > MaksimumDosyaBoyutu)
                throw new AppException(400, "Dosya boyutu 20 MB'ı geçemez");

            var uzanti = Path.GetExtension(dosya.FileName).ToLowerInvariant();
            if (!IzinliUzantilar.Contains(uzanti))
                throw new AppException(400, $"'{uzanti}' uzantılı dosya yüklenemez");

            var tenantId = HttpContextHelper.GetTenantId();
            var bucketAd = $"{CoreConfig.MinioBucket}-{tenantId}";

            await BucketOlusturGerekiyorsaAsync(bucketAd);

            // Benzersiz nesne anahtarı: bucket/basvurular/{basvuruId}/{soruId}/{guid}{uzanti}
            var dosyaAd = $"{Guid.NewGuid():N}{uzanti}";
            var objectKey = $"basvurular/{basvuruId}/{soruId}/{dosyaAd}";

            using var stream = dosya.OpenReadStream();
            var putArgs = new PutObjectArgs()
                .WithBucket(bucketAd)
                .WithObject(objectKey)
                .WithStreamData(stream)
                .WithObjectSize(dosya.Length)
                .WithContentType(dosya.ContentType);

            await _minioClient.PutObjectAsync(putArgs);

            var entity = new t_bsv_dosya
            {
                TenantId = tenantId,
                UserBasvuruId = basvuruId,
                SoruId = soruId,
                OrijinalAd = Path.GetFileName(dosya.FileName),
                MinioObjectKey = $"{bucketAd}/{objectKey}", // bucket + key birlikte sakla
                DosyaBoyu = dosya.Length,
                MimeType = dosya.ContentType
            };
            _dosyaRepo.Insert(entity);

            AppLog.Info($"[DosyaManager] DosyaYukle: DosyaId={entity.Id}, BasvuruId={basvuruId}, Boyut={dosya.Length}");

            return new DosyaYuklemeResponseDTO
            {
                dosyaId = entity.Id,
                dosyaEid = CryptoHelper.EncryptLong(entity.Id),
                orijinalAd = dosya.FileName,
                dosyaBoyutu = dosya.Length,
                mimeType = dosya.ContentType
            };
        }

        public async Task<DosyaIndirmeDTO> DosyaIndir(long dosyaId)
        {
            var dosya = _dosyaRepo.Get(dosyaId)
                ?? throw new AppException(404, "Dosya bulunamadı");

            if (dosya.TenantId != HttpContextHelper.GetTenantId())
                throw new AppException(403, "Yetkisiz erişim");

            // MinioObjectKey: "bucketAd/objectKey" formatında saklandı
            var parts = (dosya.MinioObjectKey ?? "").Split('/', 2);
            var bucketAd = parts.Length >= 2 ? parts[0] : CoreConfig.MinioBucket;
            var objectKey = parts.Length >= 2 ? parts[1] : dosya.MinioObjectKey ?? "";

            var ms = new MemoryStream();
            var getArgs = new GetObjectArgs()
                .WithBucket(bucketAd)
                .WithObject(objectKey)
                .WithCallbackStream(stream => stream.CopyTo(ms));

            await _minioClient.GetObjectAsync(getArgs);
            ms.Position = 0;

            return new DosyaIndirmeDTO
            {
                stream = ms,
                orijinalAd = dosya.OrijinalAd,
                mimeType = dosya.MimeType ?? "application/octet-stream"
            };
        }

        public void DosyaSil(long dosyaId)
        {
            var dosya = _dosyaRepo.Get(dosyaId);
            if (dosya == null) return;

            if (dosya.TenantId != HttpContextHelper.GetTenantId())
                throw new AppException(403, "Yetkisiz erişim");

            var parts = (dosya.MinioObjectKey ?? "").Split('/', 2);
            var bucketAd = parts.Length >= 2 ? parts[0] : CoreConfig.MinioBucket;
            var objectKey = parts.Length >= 2 ? parts[1] : dosya.MinioObjectKey ?? "";

            var removeArgs = new RemoveObjectArgs()
                .WithBucket(bucketAd)
                .WithObject(objectKey);
            _minioClient.RemoveObjectAsync(removeArgs).Wait();

            _dosyaRepo.Delete(dosya);
            AppLog.Info($"[DosyaManager] DosyaSil: DosyaId={dosyaId}");
        }

        public List<DosyaListeDTO> BasvuruDosyalariniGetir(long basvuruId)
        {
            var sql = @"
                SELECT d.""Id"" AS rawId, d.""OrijinalAd"", d.""DosyaBoyu"", d.""MimeType"",
                       d.""SoruId"", d.""CreatedDate"" AS YuklemeTarihi
                FROM t_bsv_dosya d
                WHERE d.""UserBasvuruId"" = @bid AND d.""IsDeleted"" = FALSE
                ORDER BY d.""CreatedDate""";

            var list = _dosyaRepo.Query<DosyaListeDTO>(sql, new { bid = basvuruId });

            foreach (var item in list)
                item.id = item.rawId;

            return list;
        }

        private async Task BucketOlusturGerekiyorsaAsync(string bucketAd)
        {
            var existsArgs = new BucketExistsArgs().WithBucket(bucketAd);
            bool exists = await _minioClient.BucketExistsAsync(existsArgs);
            if (!exists)
            {
                var makeArgs = new MakeBucketArgs().WithBucket(bucketAd);
                await _minioClient.MakeBucketAsync(makeArgs);
                AppLog.Info($"[DosyaManager] Yeni bucket oluşturuldu: {bucketAd}");
            }
        }
    }
}
