# LoreBaşvuru — Claude Code Agent Kılavuzu

## 🎯 Proje Hakkında
Bu proje **LoreBaşvuru** adında, her kuruma/firmaya satılabilecek, tamamen dinamik ve konfigüre edilebilir bir başvuru yönetim sistemidir.
- **Backend**: .NET 8 Web API (Dapper + SQL Server/PostgreSQL)
- **Frontend**: Angular 17+ (Fuse teması tabanlı — `web.rar` referans alınır)
- **Authentication**: Talend SSO (birincil) + kendi kullanıcı sistemi (opsiyonel fallback)
- **Mimari referans**: `../ornek mimariler/service.rar` (backend) + `web.rar` (frontend form modülü) + `web-basit.rar` (yetki modülü)

Bu klasördeki MD dosyaları **tek doğru kaynak**tır. Her geliştirme adımı için ilgili MD'yi oku, sonra kodu yaz.

---

## 📁 Döküman Dizini (sırayla oku)
| # | Dosya | İçerik |
|---|-------|--------|
| 00 | `00-BASLANGIC-REHBERI.md` | **Başlangıç kılavuzu** — manuel adımlar, kurulum, agent başlangıcı |
| 01 | `01-MIMARI-GENEL.md` | 4-katman mimari, klasör yapısı |
| 02 | `02-VERITABANI-SEMA.md` | Tüm tablo tasarımları, ilişkiler |
| 03 | `03-ENTITY-VE-POCO.md` | Dal katmanı entity/poco örnekleri |
| 04 | `04-DTO-VE-BASE-YAPILAR.md` | BaseDTO, EID, ServiceResponse, AppException |
| 05 | `05-REPOSITORY-KATMANI.md` | GenericRepository, kullanım örnekleri |
| 06 | `06-MANAGER-KATMANI.md` | Business layer örnek manager'lar |
| 07 | `07-SECURITY-VE-AUTH.md` | SecurityFilter, token yönetimi, DirectAccess |
| 08 | `08-SSO-VE-LOGIN.md` | Talend SSO, kendi login, AuthManager |
| 09 | `09-WORKFLOW-MOTORU.md` | Onay akışı tasarımı ve implementasyonu |
| 10 | `10-FORM-BUILDER.md` | Dinamik form builder (soru/sayfa/kural yönetimi) |
| 11 | `11-RAPORLAMA.md` | CSV/XML export, raporlama ekranı |
| 12 | `12-DOSYA-VE-MINIO.md` | MinIO entegrasyonu, dosya yükleme |
| 13 | `13-LOGLAMA.md` | AppLogger, dosya bazlı loglama, ayarlar |
| 14 | `14-ANGULAR-MIMARI.md` | Angular modül yapısı, servisler, guard'lar, Fuse teması |
| 15 | `15-PROGRAM-CS-VE-DI.md` | Program.cs DI kayıtları, middleware pipeline |
| 16 | `16-KURULUM-VE-DEPLOY.md` | IIS deploy, appsettings, migration |
| 17 | `17-YETKILENDIRME.md` | **Yetkilendirme mimarisi** — Talend SSO, rol/ekran/widget yönetimi |

---

## ⚡ Geliştirme Sırası (Agent için)

### Faz 1 — Backend Çatı
1. Solution + 4 proje oluştur: `Lore.Basvuru.Common`, `Lore.Basvuru.Dal`, `Lore.Basvuru.Bal`, `Lore.Basvuru.Service`
2. `02-VERITABANI-SEMA.md` → SQL migration script yaz (yeni auth tabloları dahil)
3. `03-ENTITY-VE-POCO.md` → Poco.cs oluştur
4. `04-DTO-VE-BASE-YAPILAR.md` → CoreConfig, BaseDTO, ServiceResponse, AppException
5. `05-REPOSITORY-KATMANI.md` → _BaseRepository, GenericRepository, IGenericRepository
6. `13-LOGLAMA.md` → AppLogger, AppLog (static), AppLogConfig
7. `07-SECURITY-VE-AUTH.md` → SecurityFilter, DirectAccessAttribute, NoPermissionCheckAttribute
8. `17-YETKILENDIRME.md` → TalendSSOManager, YetkiManager, YetkiController
9. `15-PROGRAM-CS-VE-DI.md` → Program.cs

### Faz 2 — Core Manager'lar
10. `06-MANAGER-KATMANI.md` → TenantManager, BasvuruFormManager, UserBasvuruManager
11. `08-SSO-VE-LOGIN.md` → AuthManager (Talend SSO entegrasyonu), LoginProviderManager
12. `09-WORKFLOW-MOTORU.md` → WorkflowManager

### Faz 3 — Form Builder
13. `10-FORM-BUILDER.md` → FormBuildManager, FormRespondentManager, KuralManager

### Faz 4 — Raporlama & Dosya
14. `11-RAPORLAMA.md` → RaporManager (CSV/XML)
15. `12-DOSYA-VE-MINIO.md` → DosyaManager (MinIO)

### Faz 5 — Angular Frontend
16. `14-ANGULAR-MIMARI.md` → Modüller, servisler, guard'lar (Fuse tema üzerine)
17. `17-YETKILENDIRME.md` → Angular PermissionService, ekran/widget yönetimi

---

## 🔴 Kritik Kurallar (ASLA İhlal Etme)

### API Kuralları
- **ORM**: Sadece Dapper + DapperExtensions kullan. EF Core KULLANMA.
- **EID**: Frontend'e hiçbir zaman ham `long id` gönderme. Her zaman `eid` (şifreli) gönder. `BaseDTO` bu işi otomatik yapar.
- **ID Fields**: Her tabloda `Id (long PK)`, `CreatedUser`, `CreatedDate`, `CreatedIpAdress`, `ModifiedUser?`, `ModifiedDate?`, `ModifiedIpAdress?`, `IsDeleted (bool)` OLMALI.
- **TenantId**: Multi-tenant için her tabloda `TenantId (long)` olmalı (auth tabloları hariç).
- **ServiceResponse<T>**: Tüm controller action'ları `ServiceResponse<T>` döner.
- **AppException**: İş mantığı hataları `throw new AppException(kod, mesaj)` ile fırlatılır.
- **Türkçe İsimlendirme**: Manager metod isimleri Türkçe olmalı: `Getir`, `Kaydet`, `Sil`, `Listele`, vb.
- **DirectAccess**: Public endpoint'lere `[DirectAccess]` attribute ekle.
- **NoPermissionCheck**: Controller-method yetki kontrolü bypass için `[NoPermissionCheck]` kullan.
- **SecurityFilter**: Her controller'a otomatik uygulanır (ControllerSecurityConvention ile).
- **Talend SSO**: Ana kimlik doğrulama Talend OIDC/OAuth2 üzerindendir. `17-YETKILENDIRME.md` dosyasına bak.

### Angular Kuralları
- Frontend base: **web.rar** içindeki Fuse teması tabanlı Angular projesi.
- Yetki yönetimi: **web-basit.rar** içindeki `yetki` modülü referans alınır.
- Her modül kendi `_services` klasörüne sahip olmalı.
- HTTP response'lar her zaman `ServiceResponse<T>` tipinde gelir.
- `eid` alanı her zaman string olarak saklanır, backend'e `eid` gönderilir.
- Environment dosyalarında `apiUrl` tanımlı olmalı.
- **PermissionService**: `widgetGorunur(kod)` ve `ekranYetkisiVar(yol)` metodları tüm bileşenlerde kullanılır.
- **AuthGuard**: Korunan route'larda kullanılır, Talend SSO oturumunu kontrol eder.

---

## 🏗️ Solution Yapısı

```
LoreBasvuru.sln
├── Lore.Basvuru.Common/          ← Shared: DTO, Model, Config, Helper, Logging
│   ├── Configuration/
│   │   └── CoreConfig.cs
│   ├── DTO/
│   │   ├── Base/
│   │   │   ├── BaseDTO.cs         ← EID pattern
│   │   │   ├── EidDTO.cs
│   │   │   └── SingleValueDTO.cs
│   │   ├── Enums/
│   │   ├── Security/
│   │   │   ├── Auth/              ← KisiTokenDTO, LoginRequestDTO, vb.
│   │   │   ├── Ekran/             ← EkranDTO
│   │   │   ├── Widget/            ← WidgetDTO
│   │   │   └── Rol/               ← RolDTO
│   │   └── [Domain DTOs]
│   ├── Helpers/
│   │   ├── CryptoHelper.cs        ← EID şifreleme
│   │   └── HttpContextHelper.cs   ← Static user/IP erişim
│   ├── Logging/
│   │   ├── AppLog.cs              ← Static log erişim noktası
│   │   ├── AppLogger.cs           ← Dosya bazlı logger
│   │   └── Models/AppLogConfig.cs
│   ├── Middlewares/
│   │   ├── ExceptionMiddleware.cs
│   │   └── RequestResponseLoggingMiddleware.cs
│   └── Models/
│       ├── AppException.cs
│       └── ServiceResponse/ServiceResponse.cs
│
├── Lore.Basvuru.Dal/             ← Data: Entity, Repository
│   ├── Model/
│   │   ├── ModelBase.cs
│   │   ├── _BaseModel.cs
│   │   └── Poco.cs                ← Tüm entity'ler
│   ├── Repository/
│   │   ├── _BaseRepository.cs     ← Dapper CRUD base
│   │   ├── GenericRepository.cs
│   │   └── IGenericRepository.cs
│   └── Enums/
│
├── Lore.Basvuru.Bal/             ← Business: Manager'lar
│   ├── AutoMapper/
│   │   └── MappingProfile.cs
│   ├── BaseManager/
│   │   └── MinIo/MinioManager.cs
│   └── Managers/
│       ├── Security/          ← AuthManager, TalendSSOManager, YetkiManager
│       ├── Tenant/            ← TenantManager
│       ├── Form/              ← FormBuildManager, FormRespondentManager, KuralManager
│       ├── Workflow/          ← WorkflowManager
│       ├── Rapor/             ← RaporManager
│       ├── Dosya/             ← DosyaManager
│       └── DisServis/         ← DisServisManager
│
└── Lore.Basvuru.Service/         ← API: Controller, Filter, Program.cs
    ├── Controllers/
    │   ├── Security/          ← AuthController, YetkiController
    │   ├── Tenant/            ← TenantController
    │   ├── Form/              ← FormBuildController, FormRespondentController
    │   ├── Workflow/          ← WorkflowController
    │   └── Rapor/             ← RaporController
    ├── Filters/
    │   ├── SecurityFilter.cs              ← Token + controller-method yetki kontrolü
    │   ├── DirectAccessAttribute.cs       ← Public endpoint bypass
    │   ├── NoPermissionCheckAttribute.cs  ← Yetki kontrolü bypass
    │   └── UserContext.cs
    └── Program.cs
```

---

## 🗄️ Temel Tablo Listesi (Özet)

| Prefix | Alan | Tablolar |
|--------|------|---------|
| `t_sis_` | Sistem/Auth | `tenant`, `login_provider`, `user`, `user_token`, `otp`, `rol`, `user_rol` |
| `t_sis_` | Yetkilendirme | `ekran`, `widget`, `controller_method`, `widget_controller_method`, `rol_ekran`, `rol_widget` |
| `t_frm_` | Form Builder | `basvuru_form`, `sayfa`, `soru`, `soru_secenek`, `kural`, `basvuru_form_login_provider` |
| `t_wf_` | Workflow | `workflow`, `workflow_adim`, `adim_rol`, `adim_rol_filtre`, `adim_islem`, `basvuru_adim_durum` |
| `t_bsv_` | Başvuru | `user_basvuru`, `cevap`, `dosya` |
| `t_lnk_` | Bağlantı | `cross_link_kural` |
| `t_log_` | Log | `islem` |

Detaylar için `02-VERITABANI-SEMA.md` ve `17-YETKILENDIRME.md` dosyalarına bak.

---

## 🔑 Kimlik Doğrulama Mimarisi (Özet)

```
Kullanıcı → Talend SSO (OIDC/OAuth2)
              ↓ access_token (JWT)
           TalendSSOManager.TalendTokenDogrula()
              ↓ JWKS ile imza doğrulama
           t_sis_user kaydı bul/oluştur (TalendSub ile eşleştir)
              ↓
           LoreBasvuru appToken üret → t_sis_user_token'a yaz
              ↓
           SecurityFilter her istekte appToken doğrular
              ↓
           YetkiManager.ControllerMethodYetkisiVarMi() → endpoint yetkisi kontrol
```

### Tenant (Firma) Bazlı Rol Hiyerarşisi
```
t_sis_tenant (Firma)
    └── t_sis_rol (Firmanın rolleri)
            ├── t_sis_rol_ekran    (Rolün erişebileceği ekranlar)
            ├── t_sis_rol_widget   (Rolün görebileceği widget/butonlar)
            └── t_sis_user_rol     (Role atanan kullanıcılar)

t_sis_ekran → t_sis_widget → t_sis_widget_controller_method → t_sis_controller_method
```

Detaylar için `17-YETKILENDIRME.md` dosyasına bak.
