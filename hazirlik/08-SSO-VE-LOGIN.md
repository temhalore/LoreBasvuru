# 08 — SSO ve Login Mekanizmaları

## Desteklenen Giriş Yöntemleri

| Tip | Kod | Açıklama |
|-----|-----|---------|
| Kendi sistemi | 1 | Username/password + OTP |
| Google OAuth2 | 2 | Google hesabı ile giriş |
| e-Devlet | 3 | TC Kimlik ile e-Devlet Kapısı |
| Özel JWT | 4 | Firma kendi token'ını verir |
| OIDC | 5 | Herhangi bir OIDC/OAuth2 provider |

---

## Genel SSO Akışı

```
Frontend                    Backend (LoreBaşvuru)          Dış Provider
    │                               │                           │
    │─── Hangi providerlar var? ──→ │                           │
    │←── Provider listesi ──────── │                           │
    │                               │                           │
    │ Kullanıcı provider seçer      │                           │
    │─── SSO auth URL iste ───────→ │                           │
    │←── Provider login URL ─────── │                           │
    │                               │                           │
    │ Browser provider'a gider      │                           │
    │──────────────────────────────────────────────────────────→│
    │←─────────────── Auth kodu / Token ──────────────────────── │
    │                               │                           │
    │─── SSOGiris(token, provId) ─→ │                           │
    │                    Backend provider'a token doğrular      │
    │                               │──── Token doğrula ───────→│
    │                               │←─── Kullanıcı bilgileri ──│
    │                    Kullanıcıyı DB'de bul/oluştur          │
    │←── appToken (sistem tokenı) ─ │                           │
```

---

## SSOManager

```csharp
// Lore.Basvuru.Bal/Managers/Security/SSOManager.cs
public interface ISSOManager
{
    string GoogleAuthUrlGetir(string tenantKod, string redirectUri);
    KullaniciTokenDTO GoogleCallbackIsle(string code, string redirectUri, long tenantId);
    KullaniciTokenDTO EDevletCallbackIsle(string token, long tenantId);
    KullaniciTokenDTO OzelJWTDogrula(string jwt, long tenantId);
    KullaniciTokenDTO OIDCCallbackIsle(string code, string redirectUri,
        t_sis_login_provider provider, long tenantId);
}

public class SSOManager : ISSOManager
{
    private readonly IGenericRepository<t_sis_user> _userRepo;
    private readonly IGenericRepository<t_sis_login_provider> _providerRepo;
    private readonly IGenericRepository<t_sis_user_token> _tokenRepo;
    private readonly IMapper _mapper;
    private readonly HttpClient _httpClient;

    public string GoogleAuthUrlGetir(string tenantKod, string redirectUri)
    {
        // Google OAuth2 authorization URL
        var clientId = CoreConfig.GoogleClientId;
        var state = CryptoHelper.EncryptString($"{tenantKod}|{DateTime.Now.Ticks}");

        return $"https://accounts.google.com/o/oauth2/v2/auth" +
               $"?client_id={clientId}" +
               $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
               $"&response_type=code" +
               $"&scope=openid%20email%20profile" +
               $"&state={state}";
    }

    public KullaniciTokenDTO GoogleCallbackIsle(string code, string redirectUri, long tenantId)
    {
        // 1. Code → Access Token
        var tokenResponse = GoogleTokenAl(code, redirectUri);

        // 2. Access Token → Kullanıcı bilgileri
        var googleUser = GoogleKullaniciBilgisiAl(tokenResponse.access_token);

        // 3. DB'de kullanıcı bul/oluştur
        var user = SSOKullanicisiniIsle(
            googleUser.email,
            googleUser.given_name,
            googleUser.family_name,
            googleUser.sub,
            "google",
            tenantId
        );

        return SistemTokenuOlustur(user);
    }

    public KullaniciTokenDTO EDevletCallbackIsle(string token, long tenantId)
    {
        // e-Devlet token doğrulama (TBMM/PTT e-Devlet Kapısı API)
        // Token içinden TC Kimlik No, Ad, Soyad çekilir
        // NOT: Her provider farklı endpoint/format kullanır, config'den alınır

        var provider = _providerRepo.Get(
            "TenantId = @tid AND ProviderTip = 3 AND AktifMi = 1 AND IsDeleted = 0",
            new { tid = tenantId });

        if (provider == null)
            throw new AppException(400, "e-Devlet giriş yapılandırılmamış");

        // Provider'ın TokenValidateUrl'ine istek at
        var validateUrl = provider.TokenValidateUrl;
        var response = _httpClient.PostAsync(validateUrl,
            new StringContent($"{{\"token\":\"{token}\"}}", Encoding.UTF8, "application/json"))
            .Result;

        if (!response.IsSuccessStatusCode)
            throw new AppException(401, "e-Devlet token doğrulanamadı");

        var json = response.Content.ReadAsStringAsync().Result;
        var userData = JsonConvert.DeserializeObject<dynamic>(json);

        var user = SSOKullanicisiniIsle(
            (string)userData.email ?? $"{(string)userData.tcKimlik}@edevlet.gov.tr",
            (string)userData.ad,
            (string)userData.soyad,
            (string)userData.tcKimlik,
            "edevlet",
            tenantId
        );

        // TcKimlik güncelle
        if (!string.IsNullOrEmpty((string)userData.tcKimlik))
        {
            user.TcKimlik = (string)userData.tcKimlik;
            _userRepo.Update(user);
        }

        return SistemTokenuOlustur(user);
    }

    public KullaniciTokenDTO OzelJWTDogrula(string jwt, long tenantId)
    {
        // Firma kendi JWT'sini verir, biz doğrularız
        var provider = _providerRepo.Get(
            "TenantId = @tid AND ProviderTip = 4 AND AktifMi = 1 AND IsDeleted = 0",
            new { tid = tenantId });

        if (provider == null)
            throw new AppException(400, "JWT giriş yapılandırılmamış");

        // EkParametreler'den JWT doğrulama bilgilerini al
        var ekParam = JsonConvert.DeserializeObject<dynamic>(provider.EkParametreler ?? "{}");
        var secret = (string)ekParam?.jwtSecret ?? "";
        var issuer = (string)ekParam?.issuer ?? "";

        // JWT parse ve doğrula
        var claims = JWTDogrula(jwt, secret, issuer);

        var email = claims.FirstOrDefault(c => c.Type == "email")?.Value;
        var ad = claims.FirstOrDefault(c => c.Type == "given_name")?.Value;
        var soyad = claims.FirstOrDefault(c => c.Type == "family_name")?.Value;
        var externalId = claims.FirstOrDefault(c => c.Type == "sub")?.Value;

        if (string.IsNullOrEmpty(email))
            throw new AppException(401, "JWT içinde email bilgisi bulunamadı");

        var user = SSOKullanicisiniIsle(email, ad, soyad, externalId, "jwt", tenantId);
        return SistemTokenuOlustur(user);
    }

    private t_sis_user SSOKullanicisiniIsle(
        string email, string ad, string soyad,
        string externalId, string providerKod, long tenantId)
    {
        // Önce email ile bul
        var user = _userRepo.Get(
            "Email = @e AND TenantId = @tid AND IsDeleted = 0",
            new { e = email, tid = tenantId });

        if (user == null)
        {
            // İlk kez giriş — kullanıcı oluştur
            user = new t_sis_user
            {
                TenantId = tenantId,
                Ad = ad ?? "İsimsiz",
                Soyad = soyad ?? "",
                Email = email,
                AktifMi = true,
                DisKullaniciId = externalId,
                SSOProviderKod = providerKod,
                DogrulamaTipi = 3 // YOK (SSO doğruladı)
            };
            user.Id = _userRepo.Insert(user);
            AppLog.Info($"[SSOManager] Yeni SSO kullanıcısı: Email={email}, Provider={providerKod}");
        }
        else if (!user.AktifMi)
        {
            throw new AppException(403, "Hesap aktif değil");
        }

        return user;
    }

    private KullaniciTokenDTO SistemTokenuOlustur(t_sis_user user)
    {
        var tokenStr = CryptoHelper.GenerateToken();
        var token = new t_sis_user_token
        {
            UserId = user.Id,
            TenantId = user.TenantId,
            Token = tokenStr,
            TokenExpiry = DateTime.Now.AddMinutes(
                Convert.ToDouble(CoreConfig.TokenCreateMin)),
            AktifMi = true
        };
        _tokenRepo.Insert(token);

        return new KullaniciTokenDTO
        {
            isLogin = true,
            token = tokenStr,
            tokenExpiry = token.TokenExpiry,
            kullaniciDto = new KullaniciDTO
            {
                id = user.Id,
                ad = user.Ad,
                soyad = user.Soyad,
                adSoyad = $"{user.Ad} {user.Soyad}",
                email = user.Email,
                tenantId = user.TenantId
            }
        };
    }
}
```

---

## LoginProviderManager

```csharp
// Lore.Basvuru.Bal/Managers/Security/LoginProviderManager.cs
public interface ILoginProviderManager
{
    List<LoginProviderDTO> FormProviderlariniGetir(long formId);
    LoginProviderDTO ProviderKaydet(LoginProviderDTO dto);
    void ProviderSil(long providerId);
}

public class LoginProviderManager : ILoginProviderManager
{
    private readonly IGenericRepository<t_sis_login_provider> _providerRepo;
    private readonly IGenericRepository<t_frm_basvuru_form_login_provider> _formProviderRepo;

    public List<LoginProviderDTO> FormProviderlariniGetir(long formId)
    {
        var sql = @"
            SELECT p.Id, p.ProviderTip, p.ProviderAd, p.AktifMi
            FROM t_sis_login_provider p
            INNER JOIN t_frm_basvuru_form_login_provider fp ON fp.LoginProviderId = p.Id
            WHERE fp.BasvuruFormId = @fid
            AND fp.IsDeleted = 0 AND p.IsDeleted = 0 AND p.AktifMi = 1
            ORDER BY fp.SiraNo";

        return _providerRepo.Query<LoginProviderDTO>(sql, new { fid = formId });
    }
}
```

---

## DTOlar

```csharp
// Login Request DTO'ları
public class LoginRequestDTO
{
    public string kullaniciAdi { get; set; }  // email veya username
    public string parola { get; set; }
    public string tenantKod { get; set; }     // hangi tenant için giriş
}

public class SSOLoginRequestDTO
{
    public string token { get; set; }          // SSO provider'dan gelen token/code
    public string redirectUri { get; set; }    // OAuth2 için redirect URL
    public int providerTip { get; set; }       // 2=Google, 3=eDevlet, 4=JWT, 5=OIDC
    public string tenantKod { get; set; }
}

public class JWTLoginRequestDTO
{
    public string jwt { get; set; }
    public string tenantKod { get; set; }
}

public class KayitOlRequestDTO
{
    public string ad { get; set; }
    public string soyad { get; set; }
    public string email { get; set; }
    public string telefon { get; set; }
    public string parola { get; set; }
    public string parolaKontrol { get; set; }
    public string tenantKod { get; set; }
}

public class LoginResponseDTO
{
    public KullaniciTokenDTO kullaniciTokenDto { get; set; }
}
```

---

## Angular Tarafı: SSO Akışı

```typescript
// Angular SSO Service özeti
// 1. Backend'den form provider listesini al
// 2. Seçilen provider'a göre yönlendir:

// Google için:
// - Google JS SDK veya redirect flow kullan
// - id_token veya code al
// - Backend SSOGiris endpoint'ine gönder

// e-Devlet için:
// - e-Devlet Kapısı'nın yönlendirme URL'ini backend'den al
// - Callback'te gelen token'ı backend'e gönder

// Özel JWT için:
// - Firma login sayfasına yönlendir
// - JWT al, backend'e gönder
```

---

## Tenant Belirleme

Her request'te tenant hangi yöntemle belirlenir:
1. Header `tenantKod: firma-kodu`
2. Token içindeki `TenantId` (giriş sonrası)
3. Domain bazlı (gelecek faz — subdomain: firma.lorebasvuru.com)

```csharp
// AuthManager.TokenDogrula içinde tenant set etme:
HttpContextHelper.SetUserInfo(
    kullanici.Id,
    ipAdresi,
    kullanici.TenantId ?? 0
);
```
