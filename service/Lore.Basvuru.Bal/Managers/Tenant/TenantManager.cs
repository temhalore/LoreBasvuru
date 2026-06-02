using AutoMapper;
using Lore.Basvuru.Bal.Managers.Tenant.Interfaces;
using Lore.Basvuru.Common.DTO.Base.Datatable;
using Lore.Basvuru.Common.Helpers;
using Lore.Basvuru.Common.Logging;
using Lore.Basvuru.Common.Models;
using Lore.Basvuru.Common.DTO.Tenant;
using Lore.Basvuru.Dal.Model;
using Lore.Basvuru.Dal.Repository;

namespace Lore.Basvuru.Bal.Managers.Tenant
{
    public class TenantManager : ITenantManager
    {
        private readonly IGenericRepository<t_sis_tenant> _tenantRepo;
        private readonly IGenericRepository<t_sis_user> _userRepo;
        private readonly IMapper _mapper;

        public TenantManager(
            IGenericRepository<t_sis_tenant> tenantRepo,
            IGenericRepository<t_sis_user> userRepo,
            IMapper mapper)
        {
            _tenantRepo = tenantRepo;
            _userRepo = userRepo;
            _mapper = mapper;
        }

        // ── TENANT ────────────────────────────────────────────────

        public List<TenantListDTO> TenantListesiGetir()
        {
            var sql = @"
                SELECT t.""Id"", t.""Ad"", t.""Kod"", t.""AktifMi"", t.""CreatedDate"",
                       (SELECT COUNT(*) FROM t_sis_user u WHERE u.""TenantId"" = t.""Id"" AND u.""IsDeleted"" = FALSE) AS kullaniciSayisi,
                       (SELECT COUNT(*) FROM t_frm_basvuru_form f WHERE f.""TenantId"" = t.""Id"" AND f.""IsDeleted"" = FALSE) AS formSayisi
                FROM t_sis_tenant t
                WHERE t.""IsDeleted"" = FALSE
                ORDER BY t.""Ad""";

            return _tenantRepo.Query<TenantListDTO>(sql, null);
        }

        public TenantDTO TenantGetir(long tenantId)
        {
            var entity = _tenantRepo.Get(tenantId)
                ?? throw new AppException(404, "Tenant bulunamadı");
            return _mapper.Map<TenantDTO>(entity);
        }

        public TenantDTO TenantKaydet(TenantDTO dto)
        {
            // Kod unique kontrolü
            if (string.IsNullOrWhiteSpace(dto.kod))
                throw new AppException(400, "Tenant kodu boş olamaz");

            var kodMevcut = _tenantRepo.Get(
                $"\"Kod\" = @k AND \"IsDeleted\" = FALSE AND \"Id\" != @id",
                new { k = dto.kod, id = dto.id > 0 ? dto.id : -1 });

            if (kodMevcut != null)
                throw new AppException(409, $"'{dto.kod}' kodu başka bir tenant tarafından kullanılmaktadır");

            var entity = _mapper.Map<t_sis_tenant>(dto);
            _tenantRepo.Save(entity);
            dto.id = entity.Id;
            AppLog.Info($"[TenantManager] TenantKaydet: TenantId={entity.Id}, Kod={dto.kod}");
            return dto;
        }

        public void TenantSil(long tenantId)
        {
            var entity = _tenantRepo.Get(tenantId)
                ?? throw new AppException(404, "Tenant bulunamadı");

            // Bağlı kullanıcı var mı?
            var kullaniciSayisi = _userRepo.Query<int>(
                "SELECT COUNT(*) FROM t_sis_user WHERE \"TenantId\" = @tid AND \"IsDeleted\" = FALSE",
                new { tid = tenantId }).FirstOrDefault();

            if (kullaniciSayisi > 0)
                throw new AppException(400, "Kullanıcıları olan tenant silinemez");

            _tenantRepo.Delete(entity);
            AppLog.Info($"[TenantManager] TenantSil: TenantId={tenantId}");
        }

        // ── KULLANICI ─────────────────────────────────────────────

        public DatatableResponseDTO<KullaniciDTO> KullaniciListesiGetir(
            long tenantId, int pageNumber, int pageSize, string? aramaMetni)
        {
            var where = "u.\"TenantId\" = @tid AND u.\"IsDeleted\" = FALSE";
            var param = new Dapper.DynamicParameters();
            param.Add("tid", tenantId);

            if (!string.IsNullOrWhiteSpace(aramaMetni))
            {
                where += " AND (u.\"Ad\" ILIKE @arama OR u.\"Soyad\" ILIKE @arama OR u.\"Email\" ILIKE @arama OR u.\"KullaniciAdi\" ILIKE @arama)";
                param.Add("arama", $"%{aramaMetni}%");
            }

            var offset = (pageNumber - 1) * pageSize;
            param.Add("offset", offset);
            param.Add("pageSize", pageSize);

            var sql = $@"
                SELECT u.""Id"", u.""TenantId"", u.""Ad"", u.""Soyad"", u.""Email"",
                       u.""Telefon"", u.""TcKimlik"", u.""AktifMi"", u.""KullaniciAdi"", u.""DogrulamaTipi""
                FROM t_sis_user u
                WHERE {where}
                ORDER BY u.""Ad"", u.""Soyad""
                LIMIT @pageSize OFFSET @offset";

            var countSql = $"SELECT COUNT(*) FROM t_sis_user u WHERE {where}";

            var data = _userRepo.Query<KullaniciDTO>(sql, param);
            var total = _userRepo.Query<int>(countSql, param).FirstOrDefault();

            return new DatatableResponseDTO<KullaniciDTO>
            {
                data = data,
                totalRecords = total,
                pageNumber = pageNumber,
                pageSize = pageSize
            };
        }

        public KullaniciDTO KullaniciKaydet(KullaniciKaydetReqDTO req)
        {
            if (string.IsNullOrWhiteSpace(req.kullaniciAdi))
                throw new AppException(400, "Kullanıcı adı boş olamaz");

            // KullaniciAdi unique kontrolü
            var mevcutKullanici = _userRepo.Get(
                $"\"KullaniciAdi\" = @k AND \"IsDeleted\" = FALSE",
                new { k = req.kullaniciAdi });

            long userId;

            if (!string.IsNullOrWhiteSpace(req.eid))
            {
                // Güncelleme
                userId = CryptoHelper.DecryptLong(req.eid);
                var mevcut = _userRepo.Get(userId)
                    ?? throw new AppException(404, "Kullanıcı bulunamadı");

                if (mevcutKullanici != null && mevcutKullanici.Id != userId)
                    throw new AppException(409, "Bu kullanıcı adı zaten kullanılmaktadır");

                mevcut.Ad = req.ad;
                mevcut.Soyad = req.soyad;
                mevcut.Email = req.email;
                mevcut.Telefon = req.telefon;
                mevcut.KullaniciAdi = req.kullaniciAdi;
                mevcut.AktifMi = req.aktifMi;
                mevcut.DogrulamaTipi = req.dogrulamaTipi;

                if (!string.IsNullOrWhiteSpace(req.parola))
                {
                    mevcut.ParolaTuz = CryptoHelper.GenerateSalt();
                    mevcut.ParolaHash = CryptoHelper.HashPassword(req.parola, mevcut.ParolaTuz);
                }

                _userRepo.Update(mevcut);
                AppLog.Info($"[TenantManager] KullaniciGuncelle: UserId={userId}");
            }
            else
            {
                // Yeni kayıt
                if (mevcutKullanici != null)
                    throw new AppException(409, "Bu kullanıcı adı zaten kullanılmaktadır");

                if (string.IsNullOrWhiteSpace(req.parola))
                    throw new AppException(400, "Yeni kullanıcı için parola zorunludur");

                var tuz = CryptoHelper.GenerateSalt();
                var yeniKullanici = new t_sis_user
                {
                    TenantId = req.tenantId,
                    Ad = req.ad,
                    Soyad = req.soyad,
                    Email = req.email,
                    Telefon = req.telefon,
                    KullaniciAdi = req.kullaniciAdi,
                    ParolaTuz = tuz,
                    ParolaHash = CryptoHelper.HashPassword(req.parola, tuz),
                    AktifMi = req.aktifMi,
                    DogrulamaTipi = req.dogrulamaTipi
                };

                _userRepo.Insert(yeniKullanici);
                userId = yeniKullanici.Id;
                AppLog.Info($"[TenantManager] KullaniciEkle: UserId={userId}, KullaniciAdi={req.kullaniciAdi}");
            }

            var entity = _userRepo.Get(userId)!;
            return _mapper.Map<KullaniciDTO>(entity);
        }

        public void KullaniciSil(long userId)
        {
            var entity = _userRepo.Get(userId)
                ?? throw new AppException(404, "Kullanıcı bulunamadı");
            _userRepo.Delete(entity);
            AppLog.Info($"[TenantManager] KullaniciSil: UserId={userId}");
        }

        public void SifreSifirla(SifreSifirlaReqDTO req)
        {
            var userId = CryptoHelper.DecryptLong(req.kullaniciEid);
            var entity = _userRepo.Get(userId)
                ?? throw new AppException(404, "Kullanıcı bulunamadı");

            if (string.IsNullOrWhiteSpace(req.yeniParola) || req.yeniParola.Length < 6)
                throw new AppException(400, "Parola en az 6 karakter olmalıdır");

            entity.ParolaTuz = CryptoHelper.GenerateSalt();
            entity.ParolaHash = CryptoHelper.HashPassword(req.yeniParola, entity.ParolaTuz);
            _userRepo.Update(entity);
            AppLog.Info($"[TenantManager] SifreSifirla: UserId={userId}");
        }

        public void KullaniciAktifPasif(long userId, bool aktifMi)
        {
            var entity = _userRepo.Get(userId)
                ?? throw new AppException(404, "Kullanıcı bulunamadı");
            entity.AktifMi = aktifMi;
            _userRepo.Update(entity);
            AppLog.Info($"[TenantManager] KullaniciAktifPasif: UserId={userId}, AktifMi={aktifMi}");
        }
    }
}
