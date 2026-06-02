# 07 — Security ve Auth Katmanı

## SecurityFilter

Her controller action'dan önce çalışır. Referans projedeki `SecurityFilter` ile birebir aynı pattern.

```csharp
// Lore.Basvuru.Service/Filters/SecurityFilter.cs
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.Controllers;
using Lore.Basvuru.Bal.Managers.Security.Interfaces;
using Lore.Basvuru.Common.Configuration;
using Lore.Basvuru.Common.Helpers;
using Lore.Basvuru.Common.Models;

namespace Lore.Basvuru.Service.Filters
{
    public class SecurityFilter : IActionFilter
    {
        private IAuthManager _authManager;
        private IHelperManager _helperManager;

        public void OnActionExecuting(ActionExecutingContext context)
        {
            // Lazy service resolve (constructor injection yerine)
            _authManager ??= (IAuthManager)context.HttpContext.RequestServices
                .GetService(typeof(IAuthManager));

            var appToken = context.HttpContext.Request.Headers[CoreConfig.TokenKeyName].ToString();
            var language = context.HttpContext.Request.Headers["language"].ToString();
            var tenantKod = context.HttpContext.Request.Headers["tenantKod"].ToString();

            // DirectAccess kontrolü — bypass et
            var isDirectAccess = false;
            if (context.ActionDescriptor is ControllerActionDescriptor cad)
                isDirectAccess = cad.MethodInfo
                    .GetCustomAttributes(typeof(DirectAccessAttribute), false).Length > 0;

            if (isDirectAccess) return;

            // Token zorunlu
            if (string.IsNullOrWhiteSpace(appToken))
                throw new AppException(MessageCode.ERROR_401_YETKISIZ, "Token gereklidir");

            try
            {
                // Token doğrula → KullaniciTokenDTO döner
                var kullaniciToken = _authManager.TokenDogrula(appToken);

                // HttpContext'e kullanıcı bilgilerini set et
                // Repository'ler buradan UserId/IP alacak
                HttpContextHelper.SetUserInfo(
                    kullaniciToken.kullaniciDto.id,
                    context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "",
                    kullaniciToken.kullaniciDto.tenantId ?? 0
                );

                // İstek context'ine de ekle (controller'larda erişim için)
                context.HttpContext.Items["KullaniciToken"] = kullaniciToken;
                context.HttpContext.Items["TenantKod"] = tenantKod;
            }
            catch (AppException appEx)
            {
                throw; // ExceptionMiddleware yakalar
            }
        }

        public void OnActionExecuted(ActionExecutedContext context) { }
    }
}
```

---

## DirectAccessAttribute

```csharp
// Lore.Basvuru.Service/Filters/DirectAccessAttribute.cs
namespace Lore.Basvuru.Service.Filters
{
    /// <summary>
    /// Bu attribute ile işaretlenmiş action'lar SecurityFilter'ı bypass eder.
    /// Kullanım: public login endpoint'leri, public form listeleme, SSO callback vb.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method)]
    public class DirectAccessAttribute : Attribute { }
}
```

---

## ControllerSecurityConvention

`Program.cs`'te tüm controller'lara SecurityFilter'ı otomatik ekler:

```csharp
// Lore.Basvuru.Service/Program.cs (ilgili kısım)
builder.Services.AddControllers(options =>
{
    options.Conventions.Add(new ControllerSecurityConvention());
});

// ...

public class ControllerSecurityConvention : IControllerModelConvention
{
    public void Apply(ControllerModel controller)
    {
        controller.Filters.Add(new SecurityFilter());
    }
}
```

---

## AuthController

```csharp
// Lore.Basvuru.Service/Controllers/Security/AuthController.cs
using Lore.Basvuru.Common.DTO.Security.Auth;
using Lore.Basvuru.Common.Models.ServiceResponse;
using Lore.Basvuru.Service.Filters;
using Microsoft.AspNetCore.Mvc;

namespace Lore.Basvuru.Service.Controllers.Security
{
    [Route("Api/Auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthManager _authManager;

        public AuthController(IAuthManager authManager)
        {
            _authManager = authManager;
        }

        /// <summary>
        /// Kullanıcı adı/şifre ile giriş
        /// </summary>
        [DirectAccess]
        [HttpPost("Giris")]
        public IActionResult KullaniciGiris([FromBody] LoginRequestDTO req)
        {
            var response = new ServiceResponse<LoginResponseDTO>();
            response.data = _authManager.KullaniciGiris(req);
            return Ok(response);
        }

        /// <summary>
        /// SSO (Google, e-Devlet, özel) ile giriş
        /// Frontend SSO provider'dan token alır, buraya gönderir
        /// </summary>
        [DirectAccess]
        [HttpPost("SSOGiris")]
        public IActionResult SSOIleGiris([FromBody] SSOLoginRequestDTO req)
        {
            var response = new ServiceResponse<LoginResponseDTO>();
            response.data = _authManager.SSOIleGiris(req);
            return Ok(response);
        }

        /// <summary>
        /// Dış JWT token ile giriş (firma kendi auth sisteminden token verir)
        /// </summary>
        [DirectAccess]
        [HttpPost("JWTGiris")]
        public IActionResult JWTIleGiris([FromBody] JWTLoginRequestDTO req)
        {
            var response = new ServiceResponse<LoginResponseDTO>();
            response.data = _authManager.JWTIleGiris(req);
            return Ok(response);
        }

        /// <summary>
        /// Token doğrula ve kullanıcı bilgilerini döndür (frontend session check)
        /// </summary>
        [DirectAccess]
        [HttpPost("TokenDogrula")]
        public IActionResult TokenDogrula([FromBody] SingleValueDTO req)
        {
            var response = new ServiceResponse<KullaniciTokenDTO>();
            response.data = _authManager.TokenDogrula(req.value);
            return Ok(response);
        }

        /// <summary>
        /// Çıkış yap — token pasife çekilir
        /// </summary>
        [HttpPost("CikisYap")]
        public IActionResult CikisYap()
        {
            var token = Request.Headers[CoreConfig.TokenKeyName].ToString();
            _authManager.CikisYap(token);
            var response = new ServiceResponse<bool>(true);
            response.message = "Çıkış yapıldı";
            return Ok(response);
        }

        /// <summary>
        /// Kayıt ol (kendi sistemi için)
        /// </summary>
        [DirectAccess]
        [HttpPost("KayitOl")]
        public IActionResult KayitOl([FromBody] KayitOlRequestDTO req)
        {
            var response = new ServiceResponse<LoginResponseDTO>();
            response.data = _authManager.KayitOl(req);
            return Ok(response);
        }

        /// <summary>
        /// Şifremi unuttum — doğrulama kodu gönder
        /// </summary>
        [DirectAccess]
        [HttpPost("SifremiUnuttum")]
        public IActionResult SifremiUnuttum([FromBody] SingleValueDTO req)
        {
            _authManager.SifremiUnuttum(req.value);
            var response = new ServiceResponse<bool>(true);
            response.message = "Doğrulama kodu gönderildi";
            return Ok(response);
        }
    }
}
```

---

## ExceptionMiddleware (Tüm Hataları Yakalar)

```csharp
// Lore.Basvuru.Common/Middlewares/ExceptionMiddleware.cs
// Referans projeden birebir alınır — namespace değişir
using Lore.Basvuru.Common.Models;
using Lore.Basvuru.Common.Models.ServiceResponse;
using Newtonsoft.Json;

namespace Lore.Basvuru.Common.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionMiddleware(RequestDelegate next) => _next = next;

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (AppException e)
            {
                await HataYaz(context, e);
            }
            catch (Exception e)
            {
                await HataYaz(context, e);
            }
        }

        private async Task HataYaz(HttpContext context, AppException e)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = StatusCodes.Status200OK;
            var response = new ServiceResponse<object>(e);
            await context.Response.WriteAsync(JsonConvert.SerializeObject(response));
        }

        private async Task HataYaz(HttpContext context, Exception e)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = StatusCodes.Status200OK;
            var response = new ServiceResponse<object>(e);
            await context.Response.WriteAsync(JsonConvert.SerializeObject(response));
        }
    }
}
```

---

## CustomMiddlewareExtensions

```csharp
// Lore.Basvuru.Common/Extensions/CustomMiddlewareExtensions.cs
using Lore.Basvuru.Common.Middlewares;

namespace Lore.Basvuru.Common.Extensions
{
    public static class CustomMiddlewareExtensions
    {
        public static IApplicationBuilder ConfigureCustomMiddleware(
            this IApplicationBuilder app)
        {
            app.UseMiddleware<ExceptionMiddleware>();
            app.UseMiddleware<RequestResponseLoggingMiddleware>();
            return app;
        }
    }
}
```

---

## CryptoHelper

```csharp
// Lore.Basvuru.Common/Helpers/CryptoHelper.cs
using System.Security.Cryptography;
using System.Text;

namespace Lore.Basvuru.Common.Helpers
{
    public static class CryptoHelper
    {
        private static string _key = CoreConfig.EncryptionKey ?? "DefaultKey12345!";

        /// <summary>
        /// ID şifrele → eid (frontend'e gönderilecek)
        /// </summary>
        public static string EncryptString(string plainText)
        {
            using var aes = Aes.Create();
            aes.Key = GetKey();
            aes.IV = new byte[16]; // Basit IV (production'da random IV kullan)

            using var encryptor = aes.CreateEncryptor();
            var plainBytes = Encoding.UTF8.GetBytes(plainText);
            var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
            return Convert.ToBase64String(cipherBytes)
                .Replace("+", "-").Replace("/", "_").Replace("=", ""); // URL safe
        }

        /// <summary>
        /// eid çöz → ID
        /// </summary>
        public static string DecryptString(string cipherText)
        {
            try
            {
                // URL safe base64 → normal base64
                var normalized = cipherText.Replace("-", "+").Replace("_", "/");
                var padded = normalized.PadRight(normalized.Length + (4 - normalized.Length % 4) % 4, '=');

                using var aes = Aes.Create();
                aes.Key = GetKey();
                aes.IV = new byte[16];

                using var decryptor = aes.CreateDecryptor();
                var cipherBytes = Convert.FromBase64String(padded);
                var plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);
                return Encoding.UTF8.GetString(plainBytes);
            }
            catch
            {
                throw new AppException(MessageCode.ERROR_400_GECERSIZ_ISTEK, "Geçersiz kimlik bilgisi");
            }
        }

        /// <summary>
        /// Parola hash (SHA256 + salt)
        /// </summary>
        public static string HashParola(string parola, string salt)
        {
            using var sha256 = SHA256.Create();
            var combined = $"{parola}{salt}";
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(combined));
            return Convert.ToBase64String(bytes);
        }

        /// <summary>
        /// Salt oluştur
        /// </summary>
        public static string GenerateSalt()
            => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

        /// <summary>
        /// Token üret
        /// </summary>
        public static string GenerateToken()
            => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64))
                .Replace("+", "-").Replace("/", "_").Replace("=", "");

        private static byte[] GetKey()
        {
            var keyBytes = Encoding.UTF8.GetBytes(_key.PadRight(32).Substring(0, 32));
            return keyBytes;
        }
    }
}
```

---

## Controller Route Convention

```
Api/Auth/Giris                  → Login (DirectAccess)
Api/Auth/SSOGiris               → SSO giriş (DirectAccess)
Api/Auth/TokenDogrula           → Token check (DirectAccess)
Api/Auth/CikisYap               → Logout (Token gerekli)
Api/FormBuild/Form/Listele      → Form listesi
Api/FormBuild/Form/Kaydet       → Form kaydet/güncelle
Api/FormBuild/Form/Sil          → Form sil
Api/FormRespondent/Basvur       → Başvuruyu başlat
Api/FormRespondent/CevapKaydet  → Sayfa cevaplarını kaydet
Api/FormRespondent/Tamamla      → Başvuruyu tamamla
Api/Workflow/OnayIslem          → Onayla/Reddet/İade
Api/Rapor/BasvuruListesi        → Raporlama
Api/Rapor/CsvIndir              → CSV export
Api/Rapor/XmlIndir              → XML export
```
