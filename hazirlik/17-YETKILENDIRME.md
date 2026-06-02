# 17 — Yetkilendirme Mimarisi

## Genel Yaklaşım

LoreBaşvuru'nun yetkilendirmesi **üç katmanlı** çalışır:

```
[Talend SSO] → [Firma (Tenant) Bazlı Roller] → [Ekran/Widget/Controller Yetkileri]
```

---

## Hiyerarşi

```
SuperAdmin (Platform Yöneticisi)
└── Tenant (Firma)
    ├── Tenant Admin Rolü  ← firma kendi admin'ini belirler
    │   ├── Alt Rol A
    │   │   ├── Ekran Yetkileri  (hangi sayfalara erişebilir)
    │   │   ├── Widget Yetkileri (hangi buton/aksiyonlar görünür)
    │   │   └── Controller-Method Yetkileri (API güvenlik katmanı)
    │   └── Alt Rol B
    └── Kullanıcılar → Rollere atanır
```

---

## Yetkilendirme DB Şeması

```sql
-- ═══════════════════════════════════════════════════════════════
-- SİSTEM GENELİ TANIMLAR (SuperAdmin yönetir)
-- ═══════════════════════════════════════════════════════════════

-- Ekran/Sayfa tanımları (Angular route'larıyla eşleşir)
CREATE TABLE t_sis_ekran (
    Id              BIGINT IDENTITY PRIMARY KEY,
    Ad              NVARCHAR(200) NOT NULL,
    Yol             NVARCHAR(500),          -- Angular route: /admin/form-list
    Kod             NVARCHAR(100) NOT NULL, -- FORM_LIST, WORKFLOW_EDIT, vb.
    UstEkranId      BIGINT REFERENCES t_sis_ekran(Id),
    SiraNo          INT DEFAULT 0,
    Ikon            NVARCHAR(100),
    AktifMi         BIT DEFAULT 1,
    IsDeleted       BIT DEFAULT 0,
    CreatedDate     DATETIME,
    CreatedUser     BIGINT,
    CreatedIpAdress NVARCHAR(50),
    ModifiedDate    DATETIME,
    ModifiedUser    BIGINT,
    ModifiedIpAdress NVARCHAR(50)
);

-- Widget tanımları (ekran içindeki buton/aksiyon/bölüm)
-- Widget olmayan ekranlar sadece "görme" yetkisiyle kontrol edilir
CREATE TABLE t_sis_widget (
    Id              BIGINT IDENTITY PRIMARY KEY,
    EkranId         BIGINT NOT NULL REFERENCES t_sis_ekran(Id),
    Ad              NVARCHAR(200) NOT NULL,
    Kod             NVARCHAR(100) NOT NULL,  -- FORM_KAYDET_BTN, FORM_SIL_BTN, vb.
    Aciklama        NVARCHAR(500),
    SiraNo          INT DEFAULT 0,
    AktifMi         BIT DEFAULT 1,
    IsDeleted       BIT DEFAULT 0,
    CreatedDate     DATETIME,
    CreatedUser     BIGINT,
    CreatedIpAdress NVARCHAR(50),
    ModifiedDate    DATETIME,
    ModifiedUser    BIGINT,
    ModifiedIpAdress NVARCHAR(50)
);

-- Controller-Method tanımları (API endpoint listesi — otomatik taranır)
CREATE TABLE t_sis_controller_method (
    Id              BIGINT IDENTITY PRIMARY KEY,
    ControllerAd    NVARCHAR(200) NOT NULL,
    MethodAd        NVARCHAR(200) NOT NULL,
    HttpTip         NVARCHAR(10),            -- GET, POST, DELETE
    Aciklama        NVARCHAR(500),
    AktifMi         BIT DEFAULT 1,
    IsDeleted       BIT DEFAULT 0,
    CreatedDate     DATETIME,
    CreatedUser     BIGINT,
    CreatedIpAdress NVARCHAR(50),
    ModifiedDate    DATETIME,
    ModifiedUser    BIGINT,
    ModifiedIpAdress NVARCHAR(50),
    UNIQUE (ControllerAd, MethodAd)
);

-- Widget → Controller Method bağlantısı
-- Bir widget'a tıklanınca hangi API çağrıları tetiklenir?
CREATE TABLE t_sis_widget_controller_method (
    Id                  BIGINT IDENTITY PRIMARY KEY,
    WidgetId            BIGINT NOT NULL REFERENCES t_sis_widget(Id),
    ControllerMethodId  BIGINT NOT NULL REFERENCES t_sis_controller_method(Id),
    IsDeleted           BIT DEFAULT 0,
    CreatedDate         DATETIME,
    CreatedUser         BIGINT,
    CreatedIpAdress     NVARCHAR(50),
    ModifiedDate        DATETIME,
    ModifiedUser        BIGINT,
    ModifiedIpAdress    NVARCHAR(50)
);

-- ═══════════════════════════════════════════════════════════════
-- FİRMA BAZLI ROL YÖNETİMİ (Tenant Admin yönetir)
-- ═══════════════════════════════════════════════════════════════

-- Rol tanımları (her firma kendi rollerini tanımlar)
CREATE TABLE t_sis_rol (
    Id              BIGINT IDENTITY PRIMARY KEY,
    TenantId        BIGINT NOT NULL REFERENCES t_sis_tenant(Id),
    Ad              NVARCHAR(200) NOT NULL,
    Kod             NVARCHAR(100),
    UstRolId        BIGINT REFERENCES t_sis_rol(Id), -- hiyerarşik roller
    Aciklama        NVARCHAR(500),
    AktifMi         BIT DEFAULT 1,
    IsDeleted       BIT DEFAULT 0,
    CreatedDate     DATETIME,
    CreatedUser     BIGINT,
    CreatedIpAdress NVARCHAR(50),
    ModifiedDate    DATETIME,
    ModifiedUser    BIGINT,
    ModifiedIpAdress NVARCHAR(50)
);

-- Rol → Ekran yetkisi (bu rol hangi ekranlara erişebilir?)
CREATE TABLE t_sis_rol_ekran (
    Id          BIGINT IDENTITY PRIMARY KEY,
    TenantId    BIGINT NOT NULL,
    RolId       BIGINT NOT NULL REFERENCES t_sis_rol(Id),
    EkranId     BIGINT NOT NULL REFERENCES t_sis_ekran(Id),
    IsDeleted   BIT DEFAULT 0,
    CreatedDate DATETIME,
    CreatedUser BIGINT,
    CreatedIpAdress NVARCHAR(50),
    ModifiedDate DATETIME,
    ModifiedUser BIGINT,
    ModifiedIpAdress NVARCHAR(50),
    UNIQUE (RolId, EkranId)
);

-- Rol → Widget yetkisi (bu rol hangi widgetları görebilir/kullanabilir?)
CREATE TABLE t_sis_rol_widget (
    Id          BIGINT IDENTITY PRIMARY KEY,
    TenantId    BIGINT NOT NULL,
    RolId       BIGINT NOT NULL REFERENCES t_sis_rol(Id),
    WidgetId    BIGINT NOT NULL REFERENCES t_sis_widget(Id),
    IsDeleted   BIT DEFAULT 0,
    CreatedDate DATETIME,
    CreatedUser BIGINT,
    CreatedIpAdress NVARCHAR(50),
    ModifiedDate DATETIME,
    ModifiedUser BIGINT,
    ModifiedIpAdress NVARCHAR(50),
    UNIQUE (RolId, WidgetId)
);

-- Kullanıcı → Rol ataması
CREATE TABLE t_sis_user_rol (
    Id          BIGINT IDENTITY PRIMARY KEY,
    TenantId    BIGINT NOT NULL,
    UserId      BIGINT NOT NULL REFERENCES t_sis_user(Id),
    RolId       BIGINT NOT NULL REFERENCES t_sis_rol(Id),
    AktifMi     BIT DEFAULT 1,
    IsDeleted   BIT DEFAULT 0,
    CreatedDate DATETIME,
    CreatedUser BIGINT,
    CreatedIpAdress NVARCHAR(50),
    ModifiedDate DATETIME,
    ModifiedUser BIGINT,
    ModifiedIpAdress NVARCHAR(50),
    UNIQUE (UserId, RolId)
);
```

---

## Talend SSO Entegrasyonu

### Akış

```
1. Frontend → "Talend ile Giriş" butonuna tıklar
2. Backend → Talend authorization URL döner
3. Browser → Talend login sayfasına gider
4. Talend → JWT (access_token) döner, callback URL'e yönlendirir
5. Frontend → Backend'e JWT gönderir
6. Backend → Talend JWKS endpoint ile token doğrular
7. Backend → JWT claims'den kullanıcı bilgisi çıkartır
8. Backend → Kullanıcıyı DB'de bul/oluştur (TenantId'ye göre)
9. Backend → Kullanıcının ekran listesini hesaplar
10. Backend → appToken + ekran listesi döner
11. Frontend → localStorage'a kaydeder, dashboard'a yönlendirir
```

### TalendSSOManager

```csharp
// Lore.Basvuru.Bal/Managers/Security/TalendSSOManager.cs
public interface ITalendSSOManager
{
    string AuthorizationUrlGetir(string tenantKod, string redirectUri);
    KisiTokenDTO CallbackIsle(string code, string redirectUri, long tenantId);
    TalendTokenValidateResult TokenDogrula(string accessToken, long tenantId);
}

public class TalendSSOManager : ITalendSSOManager
{
    private readonly IGenericRepository<t_sis_user> _userRepo;
    private readonly IGenericRepository<t_sis_user_token> _tokenRepo;
    private readonly IGenericRepository<t_sis_tenant> _tenantRepo;
    private readonly IYetkiManager _yetkiManager;
    private readonly HttpClient _httpClient;

    public string AuthorizationUrlGetir(string tenantKod, string redirectUri)
    {
        var tenant = _tenantRepo.Get(
            "Kod = @kod AND AktifMi = 1 AND IsDeleted = 0",
            new { kod = tenantKod });

        if (tenant == null)
            throw new AppException(404, "Tenant bulunamadı");

        // Talend OAuth2 authorization URL
        return $"{tenant.TalendAuthUrl}/oauth2/authorize" +
               $"?client_id={tenant.TalendClientId}" +
               $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
               $"&response_type=code" +
               $"&scope=openid%20profile%20email";
    }

    public KisiTokenDTO CallbackIsle(string code, string redirectUri, long tenantId)
    {
        var tenant = _tenantRepo.Get(tenantId);
        if (tenant == null)
            throw new AppException(404, "Tenant bulunamadı");

        // 1. Code → Access Token
        var tokenResponse = TalendTokenAl(code, redirectUri, tenant);

        // 2. Token doğrula ve claims çıkart
        var validateResult = TokenDogrula(tokenResponse.access_token, tenantId);

        // 3. Kullanıcıyı bul/oluştur
        var user = SSOKullanicisiniIsle(
            validateResult.Email,
            validateResult.Ad,
            validateResult.Soyad,
            validateResult.ExternalId,
            tenantId
        );

        // 4. Ekran listesi hesapla
        var ekranlar = _yetkiManager.KullaniciEkranlariniGetir(user.Id, tenantId);

        return AppTokenOlustur(user, ekranlar);
    }

    public TalendTokenValidateResult TokenDogrula(string accessToken, long tenantId)
    {
        var tenant = _tenantRepo.Get(tenantId);

        // Talend JWKS ile token doğrulama
        var jwksUrl = $"{tenant.TalendAuthUrl}/.well-known/jwks.json";

        // Microsoft.IdentityModel.Tokens ile doğrula
        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var jwks = TalendJwksAl(jwksUrl);

        var validationParams = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKeys = jwks.Keys,
            ValidateIssuer = true,
            ValidIssuer = tenant.TalendIssuer,
            ValidateAudience = false,
            ValidateLifetime = true
        };

        try
        {
            var principal = handler.ValidateToken(accessToken, validationParams, out _);
            var claims = principal.Claims.ToList();

            return new TalendTokenValidateResult
            {
                Email = claims.FirstOrDefault(c => c.Type == "email")?.Value,
                Ad = claims.FirstOrDefault(c => c.Type == "given_name")?.Value,
                Soyad = claims.FirstOrDefault(c => c.Type == "family_name")?.Value,
                ExternalId = claims.FirstOrDefault(c => c.Type == "sub")?.Value,
                IsValid = true
            };
        }
        catch (Exception ex)
        {
            AppLog.Warning($"[TalendSSOManager] Token doğrulama başarısız: {ex.Message}");
            throw new AppException(401, "Talend token doğrulanamadı");
        }
    }

    private KisiTokenDTO AppTokenOlustur(t_sis_user user, List<EkranDTO> ekranlar)
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

        return new KisiTokenDTO
        {
            isLogin = true,
            appToken = tokenStr,
            expireDate = token.TokenExpiry,
            kisiDto = new KisiDTO
            {
                id = user.Id,
                ad = user.Ad,
                soyad = user.Soyad,
                email = user.Email,
                tenantId = user.TenantId
            },
            ekranDtoList = ekranlar
        };
    }
}
```

---

## YetkiManager

```csharp
// Lore.Basvuru.Bal/Managers/Security/YetkiManager.cs
public interface IYetkiManager
{
    // Ekran yönetimi (SuperAdmin)
    List<EkranDTO> TumEkranlariGetir();
    EkranDTO EkranKaydet(EkranDTO dto);
    void EkranSil(long ekranId);

    // Widget yönetimi (SuperAdmin)
    List<WidgetDTO> EkranWidgetlariniGetir(long ekranId);
    WidgetDTO WidgetKaydet(WidgetDTO dto);

    // Controller-Method tarama ve yönetim (SuperAdmin)
    List<ControllerMethodDTO> ControllerMethodleriGetir();
    void ControllerMethodleriTara(); // reflection ile otomatik tarar
    void WidgetControllerMethodBagla(long widgetId, List<long> methodIds);

    // Rol yönetimi (Tenant Admin)
    List<RolDTO> TenantRolleriniGetir(long tenantId);
    RolDTO RolKaydet(RolDTO dto);
    void RolSil(long rolId);
    void RolEkranYetkisiKaydet(long rolId, List<long> ekranIds);
    void RolWidgetYetkisiKaydet(long rolId, List<long> widgetIds);

    // Kullanıcı-Rol ataması
    void KullaniciRolAta(long userId, long rolId, long tenantId);
    void KullaniciRolKaldir(long userId, long rolId);

    // Yetki kontrol metodları (SecurityFilter'da kullanılır)
    bool ControllerMethodYetkisiVarMi(long userId, string controller, string method);
    List<EkranDTO> KullaniciEkranlariniGetir(long userId, long tenantId);
    List<string> KullaniciWidgetKodlariniGetir(long userId, long tenantId);
}

public class YetkiManager : IYetkiManager
{
    private readonly IGenericRepository<t_sis_ekran> _ekranRepo;
    private readonly IGenericRepository<t_sis_widget> _widgetRepo;
    private readonly IGenericRepository<t_sis_controller_method> _cmRepo;
    private readonly IGenericRepository<t_sis_widget_controller_method> _wcmRepo;
    private readonly IGenericRepository<t_sis_rol> _rolRepo;
    private readonly IGenericRepository<t_sis_rol_ekran> _rolEkranRepo;
    private readonly IGenericRepository<t_sis_rol_widget> _rolWidgetRepo;
    private readonly IGenericRepository<t_sis_user_rol> _userRolRepo;
    private readonly IMapper _mapper;

    public void ControllerMethodleriTara()
    {
        // Tüm Controller'ları reflection ile tara
        var assembly = Assembly.GetAssembly(typeof(Program));
        var controllers = assembly.GetTypes()
            .Where(t => t.IsSubclassOf(typeof(ControllerBase)))
            .ToList();

        foreach (var controller in controllers)
        {
            var controllerAd = controller.Name.Replace("Controller", "");
            var methods = controller.GetMethods(BindingFlags.Public | BindingFlags.Instance)
                .Where(m => m.GetCustomAttributes<HttpGetAttribute>().Any()
                         || m.GetCustomAttributes<HttpPostAttribute>().Any()
                         || m.GetCustomAttributes<HttpDeleteAttribute>().Any()
                         || m.GetCustomAttributes<HttpPutAttribute>().Any())
                .ToList();

            foreach (var method in methods)
            {
                var httpTip = method.GetCustomAttributes<HttpGetAttribute>().Any() ? "GET"
                    : method.GetCustomAttributes<HttpPostAttribute>().Any() ? "POST"
                    : method.GetCustomAttributes<HttpDeleteAttribute>().Any() ? "DELETE"
                    : "PUT";

                // Zaten var mı?
                var existing = _cmRepo.Get(
                    "ControllerAd = @c AND MethodAd = @m AND IsDeleted = 0",
                    new { c = controllerAd, m = method.Name });

                if (existing == null)
                {
                    _cmRepo.Insert(new t_sis_controller_method
                    {
                        ControllerAd = controllerAd,
                        MethodAd = method.Name,
                        HttpTip = httpTip,
                        AktifMi = true
                    });
                }
            }
        }
        AppLog.Info($"[YetkiManager] Controller method taraması tamamlandı");
    }

    public bool ControllerMethodYetkisiVarMi(long userId, string controller, string method)
    {
        // SuperAdmin her şeye erişebilir
        var userRoller = _userRolRepo.GetList(
            "UserId = @uid AND AktifMi = 1 AND IsDeleted = 0",
            new { uid = userId });

        if (!userRoller.Any()) return false;

        var rolIds = userRoller.Select(r => r.RolId).ToList();

        // Bu controller+method hangi widget'lara bağlı?
        var sql = @"
            SELECT COUNT(*)
            FROM t_sis_rol_widget rw
            INNER JOIN t_sis_widget_controller_method wcm ON wcm.WidgetId = rw.WidgetId
            INNER JOIN t_sis_controller_method cm ON cm.Id = wcm.ControllerMethodId
            WHERE rw.RolId IN @rolIds
            AND cm.ControllerAd = @controller
            AND cm.MethodAd = @method
            AND rw.IsDeleted = 0 AND wcm.IsDeleted = 0 AND cm.IsDeleted = 0";

        var count = _cmRepo.Query<int>(sql, new { rolIds, controller, method })
            .FirstOrDefault();

        return count > 0;
    }

    public List<EkranDTO> KullaniciEkranlariniGetir(long userId, long tenantId)
    {
        var sql = @"
            SELECT DISTINCT e.Id, e.Ad, e.Yol, e.Kod, e.UstEkranId, e.SiraNo, e.Ikon
            FROM t_sis_ekran e
            INNER JOIN t_sis_rol_ekran re ON re.EkranId = e.Id
            INNER JOIN t_sis_user_rol ur ON ur.RolId = re.RolId
            WHERE ur.UserId = @uid
            AND ur.TenantId = @tid
            AND ur.AktifMi = 1 AND ur.IsDeleted = 0
            AND re.IsDeleted = 0
            AND e.AktifMi = 1 AND e.IsDeleted = 0
            ORDER BY e.SiraNo";

        var ekranlar = _ekranRepo.Query<EkranDTO>(sql, new { uid = userId, tid = tenantId });

        // Hiyerarşik yapı oluştur
        return EkranHiyerarsiOlustur(ekranlar);
    }

    public List<string> KullaniciWidgetKodlariniGetir(long userId, long tenantId)
    {
        var sql = @"
            SELECT DISTINCT w.Kod
            FROM t_sis_widget w
            INNER JOIN t_sis_rol_widget rw ON rw.WidgetId = w.Id
            INNER JOIN t_sis_user_rol ur ON ur.RolId = rw.RolId
            WHERE ur.UserId = @uid
            AND ur.TenantId = @tid
            AND ur.AktifMi = 1 AND ur.IsDeleted = 0
            AND rw.IsDeleted = 0
            AND w.AktifMi = 1 AND w.IsDeleted = 0";

        return _widgetRepo.Query<string>(sql, new { uid = userId, tid = tenantId });
    }

    private List<EkranDTO> EkranHiyerarsiOlustur(List<EkranDTO> tum)
    {
        var lookup = tum.ToDictionary(e => e.id);
        var roots = new List<EkranDTO>();

        foreach (var ekran in tum)
        {
            if (ekran.ustEkranId == null || ekran.ustEkranId == 0)
            {
                roots.Add(ekran);
            }
            else if (lookup.TryGetValue(ekran.ustEkranId.Value, out var parent))
            {
                parent.altEkranlar ??= new List<EkranDTO>();
                parent.altEkranlar.Add(ekran);
            }
        }

        return roots.OrderBy(e => e.siraNo).ToList();
    }
}
```

---

## Geliştirilmiş SecurityFilter

```csharp
// Lore.Basvuru.Service/Filters/SecurityFilter.cs
public class SecurityFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        _authManager ??= context.HttpContext.RequestServices.GetService<IAuthManager>();
        _yetkiManager ??= context.HttpContext.RequestServices.GetService<IYetkiManager>();

        var isDirectAccess = false;
        if (context.ActionDescriptor is ControllerActionDescriptor cad)
        {
            isDirectAccess = cad.MethodInfo
                .GetCustomAttributes(typeof(DirectAccessAttribute), false).Length > 0;
        }
        if (isDirectAccess) return;

        var appToken = context.HttpContext.Request.Headers[CoreConfig.TokenKeyName].ToString();
        if (string.IsNullOrWhiteSpace(appToken))
            throw new AppException(401, "Token gereklidir");

        // Token doğrula
        var kullaniciToken = _authManager.TokenDogrula(appToken);

        // HttpContext'e kullanıcı bilgilerini set et
        HttpContextHelper.SetUserInfo(
            kullaniciToken.kisiDto.id,
            context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "",
            kullaniciToken.kisiDto.tenantId ?? 0
        );

        // Controller-Method yetki kontrolü
        if (context.ActionDescriptor is ControllerActionDescriptor descriptor)
        {
            var controllerAd = descriptor.ControllerName;
            var methodAd = descriptor.ActionName;

            // NoPermissionCheck attribute ile yetki kontrolü atlanabilir
            var skipCheck = descriptor.MethodInfo
                .GetCustomAttributes(typeof(NoPermissionCheckAttribute), false).Length > 0;

            if (!skipCheck)
            {
                var yetkiVar = _yetkiManager.ControllerMethodYetkisiVarMi(
                    kullaniciToken.kisiDto.id,
                    controllerAd,
                    methodAd
                );

                if (!yetkiVar)
                    throw new AppException(403, "Bu işlem için yetkiniz bulunmamaktadır");
            }
        }

        context.HttpContext.Items["KullaniciToken"] = kullaniciToken;
    }
}

// Yetki kontrolünü atlamak için attribute
[AttributeUsage(AttributeTargets.Method)]
public class NoPermissionCheckAttribute : Attribute { }
```

---

## YetkiController

```csharp
// Lore.Basvuru.Service/Controllers/Security/YetkiController.cs
[Route("Api/Yetki")]
[ApiController]
public class YetkiController : ControllerBase
{
    private readonly IYetkiManager _yetkiManager;

    // === EKRAN YÖNETİMİ ===
    [NoPermissionCheck]
    [HttpGet("Ekran/Listele")]
    public IActionResult EkranListele() { ... }

    [HttpPost("Ekran/Kaydet")]
    public IActionResult EkranKaydet([FromBody] EkranDTO dto) { ... }

    [HttpDelete("Ekran/Sil/{eid}")]
    public IActionResult EkranSil(string eid) { ... }

    // === WİDGET YÖNETİMİ ===
    [HttpGet("Widget/Listele/{ekranEid}")]
    public IActionResult WidgetListele(string ekranEid) { ... }

    [HttpPost("Widget/Kaydet")]
    public IActionResult WidgetKaydet([FromBody] WidgetDTO dto) { ... }

    // === CONTROLLER METHOD TARAMA ===
    [HttpPost("ControllerMethod/Tara")]
    public IActionResult ControllerMethodTara()
    {
        _yetkiManager.ControllerMethodleriTara();
        return Ok(new ServiceResponse<bool>(true));
    }

    [HttpGet("ControllerMethod/Listele")]
    public IActionResult ControllerMethodListele() { ... }

    [HttpPost("Widget/ControllerMethodBagla")]
    public IActionResult WidgetControllerMethodBagla([FromBody] WidgetCMBaglaReqDTO req) { ... }

    // === ROL YÖNETİMİ ===
    [NoPermissionCheck]
    [HttpPost("Rol/Listele")]
    public IActionResult RolListele([FromBody] DatatableRequestDTO req)
    {
        var tenantId = HttpContextHelper.GetTenantId();
        var response = new ServiceResponse<List<RolDTO>>();
        response.data = _yetkiManager.TenantRolleriniGetir(tenantId);
        return Ok(response);
    }

    [HttpPost("Rol/Kaydet")]
    public IActionResult RolKaydet([FromBody] RolDTO dto) { ... }

    [HttpDelete("Rol/Sil/{eid}")]
    public IActionResult RolSil(string eid) { ... }

    [HttpPost("Rol/EkranYetkisiKaydet")]
    public IActionResult RolEkranYetkisiKaydet([FromBody] RolEkranYetkisiReqDTO req) { ... }

    [HttpPost("Rol/WidgetYetkisiKaydet")]
    public IActionResult RolWidgetYetkisiKaydet([FromBody] RolWidgetYetkisiReqDTO req) { ... }

    // === KULLANICI-ROL ATAMASI ===
    [HttpPost("KullaniciRolAta")]
    public IActionResult KullaniciRolAta([FromBody] KullaniciRolAtaReqDTO req) { ... }

    // === GİRİŞ SONRASI KULLANICININ YETKİ LİSTESİ ===
    [NoPermissionCheck]
    [HttpGet("KullaniciYetkileri")]
    public IActionResult KullaniciYetkileri()
    {
        var userId = HttpContextHelper.GetUserId();
        var tenantId = HttpContextHelper.GetTenantId();
        var response = new ServiceResponse<KullaniciYetkiDTO>();
        response.data = new KullaniciYetkiDTO
        {
            ekranlar = _yetkiManager.KullaniciEkranlariniGetir(userId, tenantId),
            widgetKodlari = _yetkiManager.KullaniciWidgetKodlariniGetir(userId, tenantId)
        };
        return Ok(response);
    }
}
```

---

## DTOlar

```csharp
public class EkranDTO : BaseDTO
{
    public string ad { get; set; }
    public string yol { get; set; }
    public string kod { get; set; }
    public long? ustEkranId { get; set; }
    public int siraNo { get; set; }
    public string ikon { get; set; }
    public bool aktifMi { get; set; }
    public List<EkranDTO> altEkranlar { get; set; }
}

public class WidgetDTO : BaseDTO
{
    public long ekranId { get; set; }
    public string ad { get; set; }
    public string kod { get; set; }  // Frontend'de visibility kontrolü için
    public string aciklama { get; set; }
    public int siraNo { get; set; }
}

public class RolDTO : BaseDTO
{
    public long tenantId { get; set; }
    public string ad { get; set; }
    public string kod { get; set; }
    public long? ustRolId { get; set; }
    public string aciklama { get; set; }
    public List<EkranDTO> ekranlar { get; set; }
    public List<string> widgetKodlari { get; set; }
}

public class KisiTokenDTO : BaseDTO
{
    public bool isLogin { get; set; }
    public string appToken { get; set; }
    public DateTime expireDate { get; set; }
    public KisiDTO kisiDto { get; set; }
    public List<EkranDTO> ekranDtoList { get; set; }  // Navigation için
    public List<string> widgetKodlari { get; set; }   // Frontend visibility için
}

public class KullaniciYetkiDTO
{
    public List<EkranDTO> ekranlar { get; set; }
    public List<string> widgetKodlari { get; set; }
}

public class RolEkranYetkisiReqDTO
{
    public string rolEid { get; set; }
    public List<string> ekranEidler { get; set; }
}

public class RolWidgetYetkisiReqDTO
{
    public string rolEid { get; set; }
    public List<string> widgetEidler { get; set; }
}

public class WidgetCMBaglaReqDTO
{
    public string widgetEid { get; set; }
    public List<string> controllerMethodEidler { get; set; }
}
```

---

## t_sis_tenant Güncellemesi

```sql
-- Talend SSO için tenant tablosuna eklenecek alanlar
ALTER TABLE t_sis_tenant ADD
    TalendAuthUrl       NVARCHAR(500),  -- https://talend.firma.com/oidc
    TalendClientId      NVARCHAR(200),
    TalendClientSecret  NVARCHAR(500),
    TalendIssuer        NVARCHAR(500),  -- JWT issuer doğrulama için
    TalendJwksUrl       NVARCHAR(500);  -- JWKS endpoint
```

---

## Angular Tarafında Widget Visibility

```typescript
// core/services/permission.service.ts
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private widgetKodlari = new Set<string>();
  private ekranYollari = new Set<string>();

  initialize(token: KisiTokenDTO): void {
    this.widgetKodlari = new Set(token.widgetKodlari ?? []);

    // Ekran yollarını düzleştir
    const flatten = (ekranlar: EkranDTO[]) => {
      ekranlar?.forEach(e => {
        if (e.yol) this.ekranYollari.add(e.yol);
        if (e.altEkranlar) flatten(e.altEkranlar);
      });
    };
    flatten(token.ekranDtoList ?? []);
  }

  widgetGorunur(widgetKod: string): boolean {
    return this.widgetKodlari.has(widgetKod);
  }

  ekranYetkisiVar(yol: string): boolean {
    return this.ekranYollari.has(yol);
  }
}

// Template'de kullanım:
// <button *ngIf="permission.widgetGorunur('FORM_KAYDET_BTN')">Kaydet</button>
// <button *ngIf="permission.widgetGorunur('FORM_SIL_BTN')">Sil</button>
```

---

## Superadmin Seed Data

```sql
-- SuperAdmin tenant
INSERT INTO t_sis_tenant (Ad, Kod, AktifMi, IsDeleted)
VALUES ('SuperAdmin', 'superadmin', 1, 0);

-- Temel ekranlar
INSERT INTO t_sis_ekran (Ad, Yol, Kod, SiraNo, AktifMi, IsDeleted) VALUES
('Formlar', '/admin/formlar', 'FORM_LIST', 1, 1, 0),
('Form Oluştur', '/admin/form-editor', 'FORM_EDITOR', 2, 1, 0),
('Başvurular', '/admin/basvurular', 'BASVURU_LIST', 3, 1, 0),
('Workflow', '/admin/workflow', 'WORKFLOW', 4, 1, 0),
('Raporlar', '/admin/raporlar', 'RAPOR', 5, 1, 0),
('Yetki Yönetimi', '/admin/yetki', 'YETKI', 10, 1, 0);

-- Form ekranı widget'ları
INSERT INTO t_sis_widget (EkranId, Ad, Kod, SiraNo, AktifMi, IsDeleted)
SELECT e.Id, 'Form Oluştur Butonu', 'FORM_OLUSTUR_BTN', 1, 1, 0
FROM t_sis_ekran e WHERE e.Kod = 'FORM_LIST';

INSERT INTO t_sis_widget (EkranId, Ad, Kod, SiraNo, AktifMi, IsDeleted)
SELECT e.Id, 'Form Sil Butonu', 'FORM_SIL_BTN', 2, 1, 0
FROM t_sis_ekran e WHERE e.Kod = 'FORM_LIST';

INSERT INTO t_sis_widget (EkranId, Ad, Kod, SiraNo, AktifMi, IsDeleted)
SELECT e.Id, 'Form Yayınla Butonu', 'FORM_YAYINLA_BTN', 3, 1, 0
FROM t_sis_ekran e WHERE e.Kod = 'FORM_LIST';
```
