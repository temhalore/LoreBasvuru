# 12 — Dosya Yönetimi ve MinIO

## Genel Yaklaşım

Dosyalar MinIO (S3-compatible) üzerinde saklanır. Her tenant kendi bucket'ına sahiptir. Dosya yolları DB'de `t_bsv_dosya` tablosunda tutulur.

**NuGet Paketi**: `Minio` (v6.x)

---

## MinIO Yapılandırması (appsettings.json)

```json
{
  "CoreConfig": {
    "MinioEndpoint": "localhost:9000",
    "MinioAccessKey": "minioadmin",
    "MinioSecretKey": "minioadmin",
    "MinioUseSsl": false,
    "MinioBucketPrefix": "basvuru"
  }
}
```

---

## DosyaManager

```csharp
// Lore.Basvuru.Bal/Managers/Dosya/DosyaManager.cs
public interface IDosyaManager
{
    Task<DosyaYuklemeResponseDTO> DosyaYukle(IFormFile dosya, long basvuruId, long soruId);
    Task<DosyaIndirmeDTO> DosyaIndir(long dosyaId);
    void DosyaSil(long dosyaId);
    List<DosyaListeDTO> BasvuruDosyalariniGetir(long basvuruId);
}

public class DosyaManager : IDosyaManager
{
    private readonly IGenericRepository<t_bsv_dosya> _dosyaRepo;
    private readonly IMinioClient _minioClient;
    private readonly IMapper _mapper;

    // İzin verilen dosya tipleri
    private static readonly HashSet<string> IzinliUzantilar = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp",
        ".txt", ".csv", ".zip", ".rar", ".7z"
    };

    private const long MaksimumDosyaBoyutu = 20 * 1024 * 1024; // 20 MB

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
        var bucketAd = $"{CoreConfig.MinioBucketPrefix}-{tenantId}";

        // Bucket yoksa oluştur
        await BucketOlusturGerekiyorsaAsync(bucketAd);

        // Benzersiz dosya adı
        var dosyaAd = $"{Guid.NewGuid():N}{uzanti}";
        var minioYol = $"basvurular/{basvuruId}/{soruId}/{dosyaAd}";

        // MinIO'ya yükle
        using var stream = dosya.OpenReadStream();
        var putArgs = new PutObjectArgs()
            .WithBucket(bucketAd)
            .WithObject(minioYol)
            .WithStreamData(stream)
            .WithObjectSize(dosya.Length)
            .WithContentType(dosya.ContentType);

        await _minioClient.PutObjectAsync(putArgs);

        // DB'ye kaydet
        var dosyaEntity = new t_bsv_dosya
        {
            TenantId = tenantId,
            BasvuruId = basvuruId,
            SoruId = soruId,
            OrijinalAd = Path.GetFileName(dosya.FileName),
            MinioYol = minioYol,
            BucketAd = bucketAd,
            DosyaBoyutu = dosya.Length,
            DosyaTipi = dosya.ContentType,
            Uzanti = uzanti
        };
        var dosyaId = _dosyaRepo.Insert(dosyaEntity);

        AppLog.Info($"[DosyaManager] DosyaYukle: DosyaId={dosyaId}, BasvuruId={basvuruId}, Boyut={dosya.Length}");

        return new DosyaYuklemeResponseDTO
        {
            dosyaId = dosyaId,
            dosyaEid = CryptoHelper.EncryptLong(dosyaId),
            orijinalAd = dosya.FileName,
            dosyaBoyutu = dosya.Length,
            dosyaTipi = dosya.ContentType
        };
    }

    public async Task<DosyaIndirmeDTO> DosyaIndir(long dosyaId)
    {
        var dosya = _dosyaRepo.Get(dosyaId);
        if (dosya == null)
            throw new AppException(404, "Dosya bulunamadı");

        // Tenant erişim kontrolü
        if (dosya.TenantId != HttpContextHelper.GetTenantId())
            throw new AppException(403, "Yetkisiz erişim");

        // MinIO'dan getir
        var ms = new MemoryStream();
        var getArgs = new GetObjectArgs()
            .WithBucket(dosya.BucketAd)
            .WithObject(dosya.MinioYol)
            .WithCallbackStream(stream => stream.CopyTo(ms));

        await _minioClient.GetObjectAsync(getArgs);
        ms.Position = 0;

        return new DosyaIndirmeDTO
        {
            stream = ms,
            orijinalAd = dosya.OrijinalAd,
            dosyaTipi = dosya.DosyaTipi ?? "application/octet-stream"
        };
    }

    public void DosyaSil(long dosyaId)
    {
        var dosya = _dosyaRepo.Get(dosyaId);
        if (dosya == null) return;

        if (dosya.TenantId != HttpContextHelper.GetTenantId())
            throw new AppException(403, "Yetkisiz erişim");

        // MinIO'dan sil (async ama fire-and-forget)
        var removeArgs = new RemoveObjectArgs()
            .WithBucket(dosya.BucketAd)
            .WithObject(dosya.MinioYol);
        _minioClient.RemoveObjectAsync(removeArgs).Wait();

        // Soft delete
        _dosyaRepo.Delete(dosya);
        AppLog.Info($"[DosyaManager] DosyaSil: DosyaId={dosyaId}");
    }

    public List<DosyaListeDTO> BasvuruDosyalariniGetir(long basvuruId)
    {
        var sql = @"
            SELECT d.Id, d.OrijinalAd, d.DosyaBoyutu, d.DosyaTipi,
                   d.Uzanti, d.CreatedDate AS YuklemeTarihi, d.SoruId
            FROM t_bsv_dosya d
            WHERE d.BasvuruId = @bid AND d.IsDeleted = 0
            ORDER BY d.CreatedDate";

        var list = _dosyaRepo.Query<DosyaListeDTO>(sql, new { bid = basvuruId });

        // EID ekle
        foreach (var item in list)
            item.eid = CryptoHelper.EncryptLong(item.rawId);

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
```

---

## DosyaController

```csharp
// Lore.Basvuru.Service/Controllers/Dosya/DosyaController.cs
[Route("Api/Dosya")]
[ApiController]
public class DosyaController : ControllerBase
{
    private readonly IDosyaManager _dosyaManager;

    /// <summary>
    /// Dosya yükle (multipart/form-data)
    /// </summary>
    [HttpPost("Yukle")]
    [RequestSizeLimit(25 * 1024 * 1024)] // 25 MB limit
    public async Task<IActionResult> Yukle(
        IFormFile dosya,
        [FromForm] string basvuruEid,
        [FromForm] string soruEid)
    {
        var basvuruId = CryptoHelper.DecryptLong(basvuruEid);
        var soruId = CryptoHelper.DecryptLong(soruEid);
        var response = new ServiceResponse<DosyaYuklemeResponseDTO>();
        response.data = await _dosyaManager.DosyaYukle(dosya, basvuruId, soruId);
        return Ok(response);
    }

    /// <summary>
    /// Dosya indir
    /// </summary>
    [HttpGet("Indir/{dosyaEid}")]
    public async Task<IActionResult> Indir(string dosyaEid)
    {
        var dosyaId = CryptoHelper.DecryptLong(dosyaEid);
        var result = await _dosyaManager.DosyaIndir(dosyaId);
        return File(result.stream, result.dosyaTipi, result.orijinalAd);
    }

    /// <summary>
    /// Dosya sil
    /// </summary>
    [HttpDelete("Sil/{dosyaEid}")]
    public IActionResult Sil(string dosyaEid)
    {
        var dosyaId = CryptoHelper.DecryptLong(dosyaEid);
        _dosyaManager.DosyaSil(dosyaId);
        return Ok(new ServiceResponse<bool>(true));
    }

    /// <summary>
    /// Başvuruya ait dosyaları listele
    /// </summary>
    [HttpGet("BasvuruDosyalari/{basvuruEid}")]
    public IActionResult BasvuruDosyalari(string basvuruEid)
    {
        var basvuruId = CryptoHelper.DecryptLong(basvuruEid);
        var response = new ServiceResponse<List<DosyaListeDTO>>();
        response.data = _dosyaManager.BasvuruDosyalariniGetir(basvuruId);
        return Ok(response);
    }
}
```

---

## MinIO DI Kaydı (Program.cs)

```csharp
// Program.cs — MinIO kaydı
builder.Services.AddTransient<IMinioClient>(sp =>
{
    var endpoint = CoreConfig.MinioEndpoint;    // "localhost:9000"
    var accessKey = CoreConfig.MinioAccessKey;
    var secretKey = CoreConfig.MinioSecretKey;
    var useSsl = CoreConfig.MinioUseSsl;

    return new MinioClient()
        .WithEndpoint(endpoint)
        .WithCredentials(accessKey, secretKey)
        .WithSSL(useSsl)
        .Build();
});

builder.Services.AddScoped<IDosyaManager, DosyaManager>();
```

---

## DTOlar

```csharp
public class DosyaYuklemeResponseDTO
{
    public long dosyaId { get; set; }
    public string dosyaEid { get; set; }
    public string orijinalAd { get; set; }
    public long dosyaBoyutu { get; set; }
    public string dosyaTipi { get; set; }
}

public class DosyaListeDTO : BaseDTO
{
    [JsonIgnore]
    public long rawId { get; set; }
    public string OrijinalAd { get; set; }
    public long DosyaBoyutu { get; set; }
    public string DosyaTipi { get; set; }
    public string Uzanti { get; set; }
    public DateTime YuklemeTarihi { get; set; }
    public long SoruId { get; set; }
    // İnsan okunabilir boyut
    public string BoyutGoster => DosyaBoyutu switch
    {
        < 1024 => $"{DosyaBoyutu} B",
        < 1024 * 1024 => $"{DosyaBoyutu / 1024.0:F1} KB",
        _ => $"{DosyaBoyutu / (1024.0 * 1024):F1} MB"
    };
}

public class DosyaIndirmeDTO
{
    public Stream stream { get; set; }
    public string orijinalAd { get; set; }
    public string dosyaTipi { get; set; }
}
```

---

## Program.cs — Request Size Limiti

```csharp
// Program.cs
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 25 * 1024 * 1024; // 25 MB
});

// IIS için web.config veya kestrel konfigürasyonu gerekebilir
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 25 * 1024 * 1024;
});
```

---

## web.config (IIS — Büyük Dosya Yükleme)

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <security>
      <requestFiltering>
        <!-- 25 MB -->
        <requestLimits maxAllowedContentLength="26214400" />
      </requestFiltering>
    </security>
    <aspNetCore processPath="dotnet"
                arguments=".\Lore.Basvuru.Service.dll"
                stdoutLogEnabled="false"
                stdoutLogFile=".\logs\stdout"
                hostingModel="inprocess" />
  </system.webServer>
</configuration>
```

---

## MinIO Kurulum Notu

Geliştirme ortamı için Docker Compose:

```yaml
version: '3.8'
services:
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"  # Console UI
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"

volumes:
  minio_data:
```

Production için MinIO standalone veya distributed mode kurulumu ayrıca yapılandırılmalıdır.
