using Lore.Basvuru.Bal.Managers.Security.Interfaces;
using Lore.Basvuru.Common.Configuration;
using Lore.Basvuru.Common.DTO.Security.Auth;
using Lore.Basvuru.Common.Helpers;
using Lore.Basvuru.Common.Logging;
using Lore.Basvuru.Common.Models;
using Lore.Basvuru.Dal.Model;
using Lore.Basvuru.Dal.Repository;

namespace Lore.Basvuru.Bal.Managers.Security
{
    public class AuthManager : IAuthManager
    {
        private readonly IGenericRepository<t_sis_user> _userRepo;
        private readonly IGenericRepository<t_sis_user_token> _tokenRepo;
        private readonly IGenericRepository<t_sis_tenant> _tenantRepo;
        private readonly IYetkiManager _yetkiManager;

        public AuthManager(
            IGenericRepository<t_sis_user> userRepo,
            IGenericRepository<t_sis_user_token> tokenRepo,
            IGenericRepository<t_sis_tenant> tenantRepo,
            IYetkiManager yetkiManager)
        {
            _userRepo = userRepo;
            _tokenRepo = tokenRepo;
            _tenantRepo = tenantRepo;
            _yetkiManager = yetkiManager;
        }

        public KisiTokenDTO Login(LoginRequestDTO request)
        {
            if (string.IsNullOrWhiteSpace(request.kullaniciAdi) || string.IsNullOrWhiteSpace(request.parola))
                throw new AppException(400, "Kullanıcı adı ve parola boş olamaz");

            // Tenant bul
            t_sis_tenant? tenant = null;
            if (!string.IsNullOrWhiteSpace(request.tenantKod))
            {
                tenant = _tenantRepo.Get($"\"Kod\" = @kod AND \"AktifMi\" = TRUE AND \"IsDeleted\" = FALSE",
                    new { kod = request.tenantKod });
                if (tenant == null)
                    throw new AppException(404, "Firma bulunamadı");
            }

            // Kullanıcı bul
            var user = _userRepo.Get($"\"KullaniciAdi\" = @k AND \"IsDeleted\" = FALSE",
                new { k = request.kullaniciAdi });

            if (user == null)
                throw new AppException(401, "Kullanıcı adı veya parola hatalı");
            if (!user.AktifMi)
                throw new AppException(401, "Hesabınız aktif değil");

            // Parola doğrula
            var hash = CryptoHelper.HashPassword(request.parola, user.ParolaTuz ?? "");
            if (user.ParolaHash != hash)
                throw new AppException(401, "Kullanıcı adı veya parola hatalı");

            return AppTokenOlustur(user);
        }

        public KisiTokenDTO TalendCallback(SSOLoginRequestDTO request)
        {
            // Talend SSO işlemi — TalendSSOManager üzerinden yönetilir
            throw new AppException(501, "Talend SSO bu endpoint üzerinden değil TalendSSOManager üzerinden yönetilir");
        }

        public KisiTokenDTO TokenDogrula(string token)
        {
            var tokenEntity = _tokenRepo.Get(
                $"\"Token\" = @t AND \"AktifMi\" = TRUE AND \"IsDeleted\" = FALSE",
                new { t = token });

            if (tokenEntity == null)
                throw new AppException(401, "Token geçersiz veya bulunamadı");

            if (tokenEntity.TokenExpiry < DateTime.Now)
            {
                // Token süresi doldu — pasife al
                tokenEntity.AktifMi = false;
                _tokenRepo.Update(tokenEntity);
                throw new AppException(401, "Token süresi doldu, lütfen tekrar giriş yapın");
            }

            var user = _userRepo.Get(tokenEntity.UserId);
            if (user == null || !user.AktifMi)
                throw new AppException(401, "Kullanıcı bulunamadı veya pasif");

            var ekranlar = _yetkiManager.KullaniciEkranlariniGetir(user.Id, tokenEntity.TenantId ?? 0);
            var widgetKodlari = _yetkiManager.KullaniciWidgetKodlariniGetir(user.Id, tokenEntity.TenantId ?? 0);

            return new KisiTokenDTO
            {
                isLogin = true,
                appToken = token,
                expireDate = tokenEntity.TokenExpiry,
                kisiDto = new KisiDTO
                {
                    id = user.Id,
                    ad = user.Ad,
                    soyad = user.Soyad,
                    email = user.Email,
                    telefon = user.Telefon,
                    tenantId = tokenEntity.TenantId
                },
                ekranDtoList = ekranlar,
                widgetKodlari = widgetKodlari
            };
        }

        public void Logout(string token)
        {
            var tokenEntity = _tokenRepo.Get($"\"Token\" = @t AND \"IsDeleted\" = FALSE", new { t = token });
            if (tokenEntity != null)
            {
                tokenEntity.AktifMi = false;
                _tokenRepo.Update(tokenEntity);
            }
            AppLog.Info($"[AuthManager] Logout: Token pasife alındı");
        }

        private KisiTokenDTO AppTokenOlustur(t_sis_user user)
        {
            var tokenStr = CryptoHelper.GenerateToken();
            var tokenEntity = new t_sis_user_token
            {
                UserId = user.Id,
                TenantId = user.TenantId,
                Token = tokenStr,
                TokenExpiry = DateTime.Now.AddMinutes(
                    double.TryParse(CoreConfig.TokenCreateMin, out var min) ? min : 480),
                IpAdresi = HttpContextHelper.GetClientIP(),
                AktifMi = true
            };
            _tokenRepo.Insert(tokenEntity);

            AppLog.Info($"[AuthManager] Login başarılı: UserId={user.Id}");

            return new KisiTokenDTO
            {
                isLogin = true,
                appToken = tokenStr,
                expireDate = tokenEntity.TokenExpiry,
                kisiDto = new KisiDTO
                {
                    id = user.Id,
                    ad = user.Ad,
                    soyad = user.Soyad,
                    email = user.Email,
                    tenantId = user.TenantId
                }
            };
        }
    }
}
