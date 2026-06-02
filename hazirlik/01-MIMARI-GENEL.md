# 01 — Mimari Genel Bakış

## 4-Katmanlı Mimari

```
┌─────────────────────────────────────────────┐
│            Lore.Basvuru.Service                  │  ← Presentation / API
│   Controllers + Filters + Program.cs        │
└──────────────────┬──────────────────────────┘
                   │ Dependency Injection
┌──────────────────▼──────────────────────────┐
│            Lore.Basvuru.Bal                      │  ← Business Logic
│   Managers + AutoMapper + External APIs     │
└──────────────────┬──────────────────────────┘
                   │ Repository Pattern
┌──────────────────▼──────────────────────────┐
│            Lore.Basvuru.Dal                      │  ← Data Access
│   Dapper Repository + Poco Entities         │
└──────────────────┬──────────────────────────┘
                   │ Shared
┌──────────────────▼──────────────────────────┐
│            Lore.Basvuru.Common                   │  ← Shared Kernel
│   DTOs + Models + Config + Helpers + Logging│
└─────────────────────────────────────────────┘
```

---

## Referans Mimari ile Birebir Örtüşen Kurallar

| Kural | Açıklama |
|-------|---------|
| **Dapper** | Tüm DB işlemleri Dapper + Dapper.Contrib ile yapılır |
| **EID** | `id (long)` → `eid (şifreli string)` frontend'e hiç ham id gitmiyor |
| **BaseDTO** | Tüm DTO'lar `BaseDTO`'dan türer; eid↔id dönüşümü otomatik |
| **ModelBase** | Tüm entity'ler `ModelBase`'den türer |
| **CoreConfig** | Static config; appsettings.json'dan bind edilir |
| **ServiceResponse<T>** | Tüm controller'lar bu wrapper ile cevap döner |
| **AppException** | İş mantığı hataları bu exception ile fırlatılır |
| **SecurityFilter** | Her controller'a otomatik uygulanır; token doğrular |
| **DirectAccess** | Public endpoint'lere bu attribute eklenir, filter bypass |
| **HttpContextHelper** | Repository'ler UserId/IP'yi buradan static alır |
| **AppLog** | Loglama static AppLog.Info/Error/Debug üzerinden |

---

## Solution Klasör Yapısı

```
LoreBasvuru.sln
│
├── Lore.Basvuru.Common/
│   ├── Aspects/
│   │   ├── Caching/
│   │   │   ├── ICacheManager.cs
│   │   │   ├── MemoryCacheManager.cs
│   │   │   └── RedisCacheManager.cs
│   │   └── PermissionAspect.cs
│   ├── Attributes/
│   │   └── PermissionAttribute.cs
│   ├── Configuration/
│   │   └── CoreConfig.cs
│   ├── DTO/
│   │   ├── Base/
│   │   │   ├── BaseDTO.cs
│   │   │   ├── EidDTO.cs
│   │   │   ├── SingleValueDTO.cs
│   │   │   └── Datatable/
│   │   │       ├── DatatableRequestDTO.cs
│   │   │       └── DatatableResponseDTO.cs
│   │   ├── Enums/
│   │   │   ├── AppEnums.cs
│   │   │   └── MessageCode.cs
│   │   ├── Security/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginRequestDTO.cs
│   │   │   │   ├── LoginResponseDTO.cs
│   │   │   │   ├── SSOLoginRequestDTO.cs
│   │   │   │   └── TokenDTO.cs
│   │   │   ├── User/
│   │   │   │   └── KullaniciDTO.cs
│   │   │   └── Role/
│   │   │       └── RolDTO.cs
│   │   ├── Tenant/
│   │   │   └── TenantDTO.cs
│   │   ├── Form/
│   │   │   ├── Common/
│   │   │   │   ├── BasvuruFormDTO.cs
│   │   │   │   ├── BasvuruSayfaDTO.cs
│   │   │   │   ├── BasvuruSoruDTO.cs
│   │   │   │   └── BasvuruSecenekDTO.cs
│   │   │   ├── FormBuild/
│   │   │   │   ├── Request/
│   │   │   │   └── Response/
│   │   │   └── FormRespondent/
│   │   │       ├── Request/
│   │   │       └── Response/
│   │   ├── Workflow/
│   │   │   ├── WorkflowDTO.cs
│   │   │   └── WorkflowAdimDTO.cs
│   │   └── Rapor/
│   │       └── RaporRequestDTO.cs
│   ├── Extensions/
│   │   ├── CustomMiddlewareExtensions.cs
│   │   ├── GeneralExtensions.cs
│   │   └── StringExtensions.cs
│   ├── Helpers/
│   │   ├── CryptoHelper.cs
│   │   ├── HttpContextHelper.cs
│   │   ├── HttpHelper.cs          ← Dış servis HTTP çağrıları
│   │   └── SerializerHelper.cs
│   ├── Logging/
│   │   ├── AppLog.cs              ← Static erişim noktası
│   │   ├── AppLogger.cs           ← Dosya bazlı implementasyon
│   │   ├── Interfaces/
│   │   │   └── IAppLogger.cs
│   │   ├── Models/
│   │   │   └── AppLogConfig.cs
│   │   └── Enrichers/
│   │       └── LogEnricher.cs
│   ├── Middlewares/
│   │   ├── ExceptionMiddleware.cs
│   │   └── RequestResponseLoggingMiddleware.cs
│   └── Models/
│       ├── AppException.cs
│       └── ServiceResponse/
│           └── ServiceResponse.cs
│
├── Lore.Basvuru.Dal/
│   ├── Model/
│   │   ├── ModelBase.cs
│   │   ├── _BaseModel.cs
│   │   └── Poco.cs                ← TÜM entity'ler burada (T4 veya manuel)
│   ├── Repository/
│   │   ├── _BaseRepository.cs
│   │   ├── GenericRepository.cs
│   │   └── IGenericRepository.cs
│   └── Enums/
│       └── TableEnums.cs          ← Her entity için property enum'ları
│
├── Lore.Basvuru.Bal/
│   ├── AutoMapper/
│   │   ├── MappingProfile.cs
│   │   └── Mappers/
│   │       ├── Security/
│   │       ├── Tenant/
│   │       ├── Form/
│   │       └── Workflow/
│   ├── BaseManager/
│   │   └── MinIo/
│   │       ├── MinioManager.cs
│   │       └── Interfaces/
│   │           └── IMinioManager.cs
│   └── Managers/
│       ├── Security/
│       │   ├── AuthManager.cs           + Interface
│       │   ├── TokenManager.cs          + Interface
│       │   ├── KullaniciManager.cs      + Interface
│       │   ├── RolManager.cs            + Interface
│       │   ├── RolKullaniciManager.cs   + Interface
│       │   └── SSOManager.cs            + Interface
│       ├── Tenant/
│       │   └── TenantManager.cs         + Interface
│       ├── Form/
│       │   ├── FormBuildManager.cs      + Interface
│       │   ├── FormRespondentManager.cs + Interface
│       │   └── KuralManager.cs          + Interface
│       ├── Workflow/
│       │   ├── WorkflowManager.cs       + Interface
│       │   └── WorkflowAdimManager.cs   + Interface
│       ├── Dosya/
│       │   └── DosyaManager.cs          + Interface
│       └── Rapor/
│           └── RaporManager.cs          + Interface
│
└── Lore.Basvuru.Service/
    ├── Controllers/
    │   ├── Security/
    │   │   └── AuthController.cs
    │   ├── Tenant/
    │   │   └── TenantController.cs
    │   ├── Form/
    │   │   ├── FormBuildController.cs
    │   │   └── FormRespondentController.cs
    │   ├── Workflow/
    │   │   └── WorkflowController.cs
    │   └── Rapor/
    │       └── RaporController.cs
    ├── Filters/
    │   ├── SecurityFilter.cs
    │   ├── DirectAccessAttribute.cs
    │   └── UserContext.cs
    ├── appsettings.json
    ├── appsettings.Development.json
    ├── appsettings.Production.json
    └── Program.cs
```

---

## Request Akışı

```
HTTP Request
    │
    ▼
[Program.cs Middleware Pipeline]
    │ ExceptionMiddleware (tüm hataları yakalar)
    │ RequestResponseLoggingMiddleware (loglama)
    │ CorrelationId Middleware
    ▼
[SecurityFilter.OnActionExecuting]
    │ Header'dan appToken oku
    │ DirectAccess attribute kontrol
    │ tokenValidate → KullaniciToken
    │ HttpContextHelper.SetUserInfo(...)
    ▼
[Controller Action]
    │ ServiceResponse<T> oluştur
    │ Manager metodunu çağır
    ▼
[Manager (BAL)]
    │ İş mantığı
    │ Repository çağrıları
    │ AppLog.Info/Error
    ▼
[Repository (DAL)]
    │ SQL sorgu oluştur
    │ Dapper ile çalıştır
    │ HttpContextHelper'dan UserId/IP al (otomatik)
    ▼
[Database]
```

---

## Bağımlılık Yönü

```
service → bal → dal → common
service → common
bal     → common
dal     → common
```

**Hiçbir katman kendinden "üst" katmana bağımlı olamaz.**

---

## Naming Convention

| Öğe | Convention | Örnek |
|-----|-----------|-------|
| Controller | PascalCase + Controller | `BasvuruFormController` |
| Manager | PascalCase + Manager | `FormBuildManager` |
| Interface | I + PascalCase + Manager | `IFormBuildManager` |
| DTO (Request) | PascalCase + ReqDTO | `FormKaydetReqDTO` |
| DTO (Response) | PascalCase + ResDTO | `FormDetayResDTO` |
| Entity | t_ prefix + snake_case tablo adından | `t_frm_basvuru_form` |
| Metod | Türkçe eylem + nesne | `BasvuruFormGetir`, `SoruKaydet`, `WorkflowListele` |
| Route | `Api/[Domain]/[Action]` | `Api/FormBuild/Form/Kaydet` |
