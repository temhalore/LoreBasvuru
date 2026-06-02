# 00 — Başlangıç Rehberi

Bu dosya projeye **sıfırdan başlamadan önce** okunmalıdır.  
Hangi adımları **sen yapacaksın**, hangilerini **Claude Code agent** yapacak — hepsi burada.

---

## BÖLÜM 1: SEN YAPACAKSIN (Manuel Adımlar)

### 1.1 Gerekli Yazılımları Kur

Aşağıdaki araçların kurulu olduğundan emin ol:

| Araç | Minimum Versiyon | İndirme |
|------|-----------------|---------|
| .NET SDK | 8.0 | https://dotnet.microsoft.com/download |
| Node.js | 18+ | https://nodejs.org |
| Angular CLI | 17+ | `npm install -g @angular/cli` |
| SQL Server | 2019+ | veya PostgreSQL 15+ |
| MinIO | 2024+ | https://min.io/download |
| Git | Herhangi | https://git-scm.com |
| Visual Studio / Rider | Güncel | (opsiyonel, CLI yeterli) |

Kurulum doğrulaması:
```bash
dotnet --version       # 8.x.x
node --version         # v18+
ng version             # Angular CLI: 17+
```

### 1.2 SQL Server / PostgreSQL Hazırlığı

#### SQL Server için:
```sql
-- SSMS veya Azure Data Studio ile çalıştır
CREATE DATABASE LoreBasvuruDB
    COLLATE Turkish_CI_AS;
GO

CREATE LOGIN lorebasvuru_app WITH PASSWORD = 'Güvenli_Şifre_Buraya!';
GO

USE LoreBasvuruDB;
GO

CREATE USER lorebasvuru_app FOR LOGIN lorebasvuru_app;
ALTER ROLE db_datareader ADD MEMBER lorebasvuru_app;
ALTER ROLE db_datawriter ADD MEMBER lorebasvuru_app;
GRANT CREATE TABLE TO lorebasvuru_app;
GO
```

#### PostgreSQL için:
```sql
CREATE DATABASE lorebasvuru
    ENCODING 'UTF8'
    LC_COLLATE 'tr_TR.UTF-8'
    LC_CTYPE 'tr_TR.UTF-8';

CREATE USER lorebasvuru_app WITH PASSWORD 'Güvenli_Şifre_Buraya!';
GRANT ALL PRIVILEGES ON DATABASE lorebasvuru TO lorebasvuru_app;
```

### 1.3 MinIO Başlat (Geliştirme Ortamı)

Docker varsa en kolay yol:
```bash
docker run -d -p 9000:9000 -p 9001:9001 \
    --name minio-dev \
    -e MINIO_ROOT_USER=minioadmin \
    -e MINIO_ROOT_PASSWORD=minioadmin \
    minio/minio server /data --console-address ":9001"
```

Docker yoksa: https://min.io/download adresinden Windows binary indir, çalıştır.

MinIO Console: http://localhost:9001 (minioadmin / minioadmin)

### 1.4 Talend SSO Bilgilerini Hazırla

Talend SSO entegrasyonu için aşağıdaki bilgilere ihtiyaç var. Bunları Talend yöneticisinden al:

| Bilgi | Açıklama | Örnek |
|-------|----------|-------|
| `TalendAuthUrl` | OAuth2 authorize endpoint | https://talend.firma.com/oauth/authorize |
| `TalendClientId` | Uygulama client ID | basvuru-app-123 |
| `TalendClientSecret` | Uygulama client secret | abc123secret |
| `TalendIssuer` | JWT issuer | https://talend.firma.com |
| `TalendJwksUrl` | JWKS public key endpoint | https://talend.firma.com/.well-known/jwks.json |
| `TalendRedirectUri` | Callback URL (uygulamana kayıt ettir) | https://basvuru.firma.com/auth/talend-callback |

> **Geliştirme ortamında**: Eğer Talend henüz hazır değilse, kendi kullanıcı sistemi (e-posta/şifre) ile başlayabilirsin. `08-SSO-VE-LOGIN.md` dosyasına bak.

### 1.5 Proje Klasör Yapısını Oluştur

```
D:\development\         ← veya istediğin bir yol
└── LoreBasvuru\
    ├── service\        ← .NET solution buraya gelecek
    ├── lore-basvuru-ui\     ← Angular projesi buraya gelecek
    └── hazirlik\       ← Bu MD dosyaları (şu an burada)
```

Bash ile:
```bash
mkdir -p LoreBasvuru/service
mkdir -p LoreBasvuru/lore-basvuru-ui
```

### 1.6 Angular Başlangıç Projesini Hazırla

Frontend için `web.rar` referans projesi temel alınacak. İki seçenek var:

**Seçenek A — web.rar'dan başla (Önerilen)**
1. `web.rar`'ı `LoreBasvuru/lore-basvuru-ui/` klasörüne çıkart
2. İçindeki `node_modules` klasörü yoksa: `npm install` çalıştır
3. `src/environments/environment.ts` dosyasını kendi ayarlarınla güncelle
4. Agent'a söyle: "Angular projesi web.rar'dan hazırlandı, geliştirmeye başla"

**Seçenek B — Sıfırdan oluştur (Fuse lisansın yoksa)**
```bash
ng new lore-basvuru-ui --routing --style=scss
cd lore-basvuru-ui
ng add @angular/material
```
> Bu durumda form-builder ve form-respondent modülleri `web.rar`'dan manuel kopyalanmalı.

### 1.7 appsettings.json Hazırlığı

Agent solution'ı oluşturduktan sonra `Lore.Basvuru.Service/appsettings.Development.json` dosyasını oluştur ve kendi bağlantı bilgilerini gir:

```json
{
  "CoreConfig": {
    "ConnectionString": "Server=localhost;Database=LoreBasvuruDB;User Id=lorebasvuru_app;Password=BURAYA_SIFREN;TrustServerCertificate=True;",
    "SqlDialect": "SqlServer",
    "TokenKeyName": "appToken",
    "TokenCreateMin": "480",
    "EncryptionKey": "LoreBasvuru_SecretKey_2025!@#$",
    "MinioEndpoint": "localhost:9000",
    "MinioAccessKey": "minioadmin",
    "MinioSecretKey": "minioadmin",
    "MinioUseSsl": false,
    "MinioBucketPrefix": "basvuru",
    "TalendAuthUrl": "TALEND_AUTH_URL",
    "TalendClientId": "TALEND_CLIENT_ID",
    "TalendClientSecret": "TALEND_CLIENT_SECRET",
    "TalendIssuer": "TALEND_ISSUER",
    "TalendJwksUrl": "TALEND_JWKS_URL"
  },
  "AppLogConfig": {
    "ProjectName": "LoreBasvuru",
    "LogDirectory": "Logs",
    "Levels": {
      "Debug": true,
      "Info": true,
      "Warning": true,
      "Error": true,
      "RequestResponse": true
    }
  },
  "AllowedOrigins": ["http://localhost:4200"]
}
```

---

## BÖLÜM 2: CLAUDE CODE AGENT YAPACAK

Agent'a vereceğin başlangıç komutu ve hangi adımları otomatik yapacağı:

### 2.1 Agent'a Verilecek Başlangıç Komutu

```
CLAUDE.md dosyasını oku ve hazirlik klasöründeki tüm MD dosyalarını incele.
Faz 1 adımlarına göre backend'i oluştur:
1. LoreBasvuru.sln ve 4 projeyi oluştur
2. Veritabanı migration scriptini yaz
3. Tüm entity ve repository katmanlarını yaz
4. Security, auth ve yetkilendirme katmanlarını yaz
5. Program.cs ve DI kayıtlarını yaz
```

### 2.2 Agent'ın Yapacakları (Otomatik)

**Backend:**
- `LoreBasvuru.sln` solution dosyası oluşturma
- 4 .NET proje oluşturma ve referansları kurma
- NuGet paket kurulumu (`Dapper`, `DapperExtensions`, `AutoMapper`, `Minio`, `Newtonsoft.Json`, `Microsoft.IdentityModel.Tokens`)
- Tüm entity/poco sınıflarını `Poco.cs`'e yazma
- `_BaseRepository<T>`, `GenericRepository<T>`, `IGenericRepository<T>` yazma
- Tüm manager'ları ve interface'lerini yazma
- Controller'ları yazma
- `Program.cs` DI kayıtlarını yazma
- SQL migration scriptini (`migrate.sql`) oluşturma
- `appsettings.json` şablonunu oluşturma (hassas bilgiler boş bırakılır)

**Frontend (Faz 5'te):**
- `core/` servisleri oluşturma/güncelleme
- `PermissionService`, `AuthService`, `AuthGuard` yazma
- Yetki modülü oluşturma (rol, ekran, widget yönetimi)
- Route yapılandırması
- Environment dosyalarını güncelleme

### 2.3 Agent Çalışma Dizini

Agent'ı çalıştırmadan önce hangi klasörde olduğunu kontrol et:

```bash
# .NET solution için
cd D:\development\ozel\LoreBasvuru\service

# Angular için
cd D:\development\ozel\LoreBasvuru\lore-basvuru-ui
```

---

## BÖLÜM 3: ADIM ADIM ÇALIŞMA PLANI

### Adım 1 — Backend Solution Oluştur

Agent'a ver:
```
hazirlik/01-MIMARI-GENEL.md, 03-ENTITY-VE-POCO.md, 04-DTO-VE-BASE-YAPILAR.md dosyalarını oku.
D:\development\ozel\LoreBasvuru\service klasöründe LoreBasvuru.sln solution dosyası ve 4 projeyi oluştur:
- Lore.Basvuru.Common (.NET 8 Class Library)
- Lore.Basvuru.Dal (.NET 8 Class Library) → references Lore.Basvuru.Common
- Lore.Basvuru.Bal (.NET 8 Class Library) → references Lore.Basvuru.Dal, Lore.Basvuru.Common
- Lore.Basvuru.Service (.NET 8 Web API) → references Lore.Basvuru.Bal, Lore.Basvuru.Dal, Lore.Basvuru.Common
NuGet paketlerini kur: Dapper, DapperExtensions, AutoMapper, Minio, Newtonsoft.Json, Microsoft.AspNetCore.Mvc.NewtonsoftJson, Swashbuckle.AspNetCore, Microsoft.IdentityModel.Tokens, System.IdentityModel.Tokens.Jwt
```

### Adım 2 — Veritabanı Şeması

Agent'a ver:
```
hazirlik/02-VERITABANI-SEMA.md ve hazirlik/17-YETKILENDIRME.md dosyalarını oku.
Tüm tabloları içeren migrate.sql dosyası yaz. SQL Server syntax kullan.
Dosyayı D:\development\ozel\LoreBasvuru\service\migrate.sql konumuna kaydet.
```

**Sen:** `migrate.sql`'i SSMS'te çalıştır.

### Adım 3 — Common Katmanı

Agent'a ver:
```
hazirlik/04-DTO-VE-BASE-YAPILAR.md ve hazirlik/13-LOGLAMA.md dosyalarını oku.
Lore.Basvuru.Common projesinde:
- CoreConfig.cs
- BaseDTO.cs, EidDTO.cs, SingleValueDTO.cs
- AppException.cs, ServiceResponse<T>.cs
- CryptoHelper.cs, HttpContextHelper.cs
- AppLogger.cs, AppLog.cs, AppLogConfig.cs
- ExceptionMiddleware.cs, RequestResponseLoggingMiddleware.cs
dosyalarını oluştur.
```

### Adım 4 — DAL Katmanı

Agent'a ver:
```
hazirlik/03-ENTITY-VE-POCO.md ve hazirlik/05-REPOSITORY-KATMANI.md dosyalarını oku.
Lore.Basvuru.Dal projesinde Poco.cs ve Repository katmanını oluştur.
```

### Adım 5 — Security ve Auth

Agent'a ver:
```
hazirlik/07-SECURITY-VE-AUTH.md, hazirlik/08-SSO-VE-LOGIN.md ve hazirlik/17-YETKILENDIRME.md dosyalarını oku.
Lore.Basvuru.Bal/Managers/Security/ klasöründe:
- IAuthManager.cs + AuthManager.cs
- ITalendSSOManager.cs + TalendSSOManager.cs
- IYetkiManager.cs + YetkiManager.cs
oluştur.
Lore.Basvuru.Service/Filters/ klasöründe:
- SecurityFilter.cs (güncellenmiş — controller-method yetki kontrolü ile)
- DirectAccessAttribute.cs
- NoPermissionCheckAttribute.cs
oluştur.
Lore.Basvuru.Service/Controllers/Security/ klasöründe:
- AuthController.cs
- YetkiController.cs
oluştur.
```

### Adım 6 — Program.cs ve Başlatma

Agent'a ver:
```
hazirlik/15-PROGRAM-CS-VE-DI.md dosyasını oku.
Lore.Basvuru.Service/Program.cs dosyasını oluştur.
Tüm manager ve repository DI kayıtlarını yap.
dotnet build ile derleme hatası olmadığını kontrol et.
```

**Sen:** `dotnet run` ile backend'i başlat, http://localhost:5000/swagger açarak kontrol et.

### Adım 7 — Domain Manager'lar

Agent'a ver:
```
hazirlik/06-MANAGER-KATMANI.md, hazirlik/09-WORKFLOW-MOTORU.md, hazirlik/10-FORM-BUILDER.md dosyalarını oku.
Sırayla TenantManager, FormBuildManager, FormRespondentManager, KuralManager, WorkflowManager, RaporManager, DosyaManager manager'larını ve ilgili controller'larını oluştur.
```

### Adım 8 — Angular Frontend

**Sen:** web.rar'ı açıp `lore-basvuru-ui/` klasörüne kopyala, `npm install` çalıştır.

Agent'a ver:
```
hazirlik/14-ANGULAR-MIMARI.md ve hazirlik/17-YETKILENDIRME.md dosyalarını oku.
lore-basvuru-ui/ klasöründe:
1. src/environments/environment.ts güncelle (apiUrl, talendSSOUrl)
2. core/services/auth.service.ts — Talend SSO destekli AuthService
3. core/services/permission.service.ts — PermissionService
4. core/guards/auth.guard.ts — AuthGuard
5. core/models/ — KisiTokenDto, EkranDto, RolDto modelleri
6. modules/auth/talend-callback/ — TalendCallbackComponent
7. modules/yonetim/yetki/ — Rol, Ekran, Widget yönetimi ekranları
8. app-routing.module.ts güncelle
```

**Sen:** `ng serve` ile frontend'i başlat, http://localhost:4200 açarak kontrol et.

### Adım 9 — Veritabanına İlk Veri Girişi

```sql
-- İlk tenant (firma) ve superadmin kullanıcısı
-- hazirlik/17-YETKILENDIRME.md → "Seed Data" bölümüne bak

-- Ekranları tanımla
INSERT INTO t_sis_ekran (TenantId, Ad, Yol, Kod, SiraNo, AktifMi, IsDeleted)
VALUES
(1, 'Başvuru Listesi', '/basvuru', 'BASVURU_LISTESI', 1, 1, 0),
(1, 'Form Yönetimi', '/yonetim/form-builder', 'FORM_YONETIMI', 2, 1, 0),
(1, 'Workflow', '/yonetim/workflow', 'WORKFLOW', 3, 1, 0),
(1, 'Raporlama', '/yonetim/raporlama', 'RAPORLAMA', 4, 1, 0),
(1, 'Yetki Yönetimi', '/yonetim/yetki', 'YETKI_YONETIMI', 5, 1, 0);

-- Controller metodlarını tara
-- POST http://localhost:5000/Api/Yetki/ControllerMethodleriTara
```

**Agent'a ver (controller tarama için):**
```
YetkiController'ı çalıştırarak tüm controller metodlarını veritabanına kaydet:
POST /Api/Yetki/ControllerMethodleriTara endpoint'ini çağır (Swagger üzerinden veya curl ile).
```

---

## BÖLÜM 4: GELİŞTİRME SIRASINDA KULLANILACAK KOMUTLAR

### Backend

```bash
# Proje çalıştır
cd D:\development\ozel\LoreBasvuru\service
dotnet run --project Lore.Basvuru.Service

# Build
dotnet build

# Test (birim testleri eklendiyse)
dotnet test

# Publish
dotnet publish Lore.Basvuru.Service -c Release -o publish/api
```

### Frontend

```bash
cd D:\development\ozel\LoreBasvuru\lore-basvuru-ui

# Geliştirme sunucusu
ng serve

# Proxy ile (API yönlendirme)
ng serve --proxy-config proxy.conf.json

# Production build
ng build --configuration production

# Yeni modül oluştur
ng generate module modules/yeni-modul --routing
ng generate component modules/yeni-modul/components/yeni-component
```

### proxy.conf.json (Angular geliştirme için)

```json
{
  "/Api": {
    "target": "http://localhost:5000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

---

## BÖLÜM 5: SORUN GİDERME

### "Token gereklidir" hatası
→ İstek header'ında `appToken` değeri gönderilmiyor. Angular `token.interceptor.ts`'in doğru çalıştığını kontrol et.

### CORS hatası
→ `appsettings.json` içinde `AllowedOrigins` dizisine Angular URL'ini (`http://localhost:4200`) ekle.

### MinIO bağlantı hatası
→ MinIO'nun çalıştığını doğrula: `http://localhost:9001`. `CoreConfig.MinioEndpoint = "localhost:9000"` olduğunu kontrol et.

### "Şifreli ID çözümlenemedi" hatası
→ `CoreConfig.EncryptionKey` backend ile frontend arasında tutarsız. Her ortamda aynı key kullanılmalı.

### Talend SSO çalışmıyor
→ `TalendJwksUrl`'nin erişilebilir olduğunu kontrol et. Development ortamında `TalendSSOManager` mock moduna geçilebilir (bkz. `08-SSO-VE-LOGIN.md`).

### Veritabanı bağlantı hatası
→ Connection string'deki `Server`, `Database`, `User Id`, `Password` değerlerini kontrol et. SQL Server için `TrustServerCertificate=True` gerekebilir.

---

## BÖLÜM 6: PROJE GELİŞTİRME SIRASINDA CLAUDE CODE AGENT'A NASIL İŞ VERİLİR

### Etkili Prompt Şablonları

**Yeni bir manager eklemek için:**
```
hazirlik/06-MANAGER-KATMANI.md dosyasını oku.
[ManagerAdi] manager'ını oluştur. Yapması gerekenler:
- [İş kuralı 1]
- [İş kuralı 2]
IGenericRepository<t_xxx_tablo> kullan, tüm metod isimleri Türkçe olsun,
ServiceResponse<T> dönsün.
```

**Yeni bir Angular modülü eklemek için:**
```
hazirlik/14-ANGULAR-MIMARI.md ve hazirlik/17-YETKILENDIRME.md dosyalarını oku.
[ModulAdi] modülünü oluştur. PermissionService ile widget kontrolü yap.
API endpoint'leri: [endpoint listesi]
```

**Bir hata düzeltmek için:**
```
[Hata mesajı / stack trace]
İlgili dosyalar: [dosya yolları]
Sorunu analiz edip düzelt.
```

### Agent'a Daima Söyle
- "hazirlik/ klasöründeki ilgili MD dosyasını oku" — agent belgeyi okumadan kod yazmasın
- "CLAUDE.md'deki kurallara uy" — EID, TenantId, ServiceResponse kurallarını hatırlat
- "EF Core kullanma, sadece Dapper + DapperExtensions" — ORM konusunda net ol

---

## ÖZET KONTROL LİSTESİ

### Sen Yapacaksın (Başlamadan Önce)
- [ ] .NET 8 SDK kuruldu
- [ ] Node.js 18+ kuruldu  
- [ ] Angular CLI 17+ kuruldu
- [ ] SQL Server/PostgreSQL kuruldu, veritabanı ve kullanıcı oluşturuldu
- [ ] MinIO başlatıldı (Docker veya binary)
- [ ] Talend SSO bilgileri hazır (veya geliştirme için ertelendi)
- [ ] web.rar açıldı ve `npm install` çalıştırıldı
- [ ] Proje klasör yapısı oluşturuldu

### Agent Yapacak (Otomatik)
- [ ] .NET solution + 4 proje
- [ ] NuGet paket kurulumu
- [ ] migrate.sql (tüm tablolar)
- [ ] Common katmanı (Config, DTO, Helper, Logging, Middleware)
- [ ] DAL katmanı (Poco.cs, Repository)
- [ ] BAL katmanı (tüm Manager'lar)
- [ ] Service katmanı (Controller'lar, Filter'lar, Program.cs)
- [ ] Angular core servisleri (AuthService, PermissionService, AuthGuard)
- [ ] Angular yetki modülü (Rol, Ekran, Widget yönetimi)
- [ ] Angular routing güncellemesi

### Sen Yapacaksın (Agent'tan Sonra)
- [ ] migrate.sql'i veritabanında çalıştır
- [ ] appsettings.Development.json'ı kendi bilgilerinle doldur
- [ ] `dotnet run` ile backend'i başlat
- [ ] POST /Api/Yetki/ControllerMethodleriTara çağır
- [ ] Başlangıç ekranlarını ve rollerini SQL ile tanımla
- [ ] `ng serve` ile frontend'i başlat
- [ ] Login akışını test et
