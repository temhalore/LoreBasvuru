# 16 — Kurulum ve Deployment

## Gereksinimler

| Bileşen | Minimum Versiyon |
|---------|-----------------|
| Windows Server | 2019 veya üzeri |
| IIS | 10 |
| .NET | 8.0 Hosting Bundle |
| SQL Server | 2019 veya üzeri |
| Node.js | 18+ (Angular build için) |
| MinIO | RELEASE.2024+ |

---

## 1. Veritabanı Kurulumu

### SQL Server

```sql
-- Veritabanını oluştur
CREATE DATABASE LoreBasvuruDB
    COLLATE Turkish_CI_AS;
GO

-- Dedicated kullanıcı oluştur
CREATE LOGIN lorebasvuru_app WITH PASSWORD = 'SecurePassword123!';
GO
USE LoreBasvuruDB;
GO
CREATE USER lorebasvuru_app FOR LOGIN lorebasvuru_app;
GO
ALTER ROLE db_datareader ADD MEMBER lorebasvuru_app;
ALTER ROLE db_datawriter ADD MEMBER lorebasvuru_app;
GRANT CREATE TABLE TO lorebasvuru_app;
GO

-- Schema oluştur (01-MIMARI-GENEL.md dosyasındaki DDL'i çalıştır)
-- Ardından 02-VERITABANI-SEMA.md dosyasındaki tüm CREATE TABLE ifadelerini çalıştır
```

### PostgreSQL

```sql
CREATE DATABASE lorebasvuru
    ENCODING 'UTF8'
    LC_COLLATE 'tr_TR.UTF-8'
    LC_CTYPE 'tr_TR.UTF-8';

CREATE USER lorebasvuru_app WITH PASSWORD 'SecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE lorebasvuru TO lorebasvuru_app;

-- Schema oluştur (02-VERITABANI-SEMA.md PostgreSQL versiyonu)
```

### Temel Veri (Seed)

```sql
-- Varsayılan tenant
INSERT INTO t_sis_tenant (Ad, Kod, AktifMi, IsDeleted)
VALUES ('Varsayılan Firma', 'varsayilan', 1, 0);

-- Admin kullanıcı (parola: Admin123! — hash değeri)
DECLARE @tenantId BIGINT = SCOPE_IDENTITY();
DECLARE @salt NVARCHAR(100) = 'generated_salt_here';

INSERT INTO t_sis_user (TenantId, Ad, Soyad, Email, Parola, ParolaSalt,
    DogrulamaTipi, AktifMi, IsDeleted)
VALUES (@tenantId, 'Sistem', 'Yöneticisi', 'admin@firma.com',
    -- CryptoHelper.HashParola("Admin123!", salt) değerini buraya yaz
    'BU_KISMDA_HASH_DEGERI_OLMALI',
    @salt, 1, 1, 0);

-- Admin rolü
INSERT INTO t_sis_rol (TenantId, Ad, Kod, AktifMi, IsDeleted)
VALUES (@tenantId, 'Yönetici', 'Admin', 1, 0);

INSERT INTO t_sis_user_rol (TenantId, UserId, RolId, AktifMi, IsDeleted)
SELECT @tenantId, u.Id, r.Id, 1, 0
FROM t_sis_user u, t_sis_rol r
WHERE u.Email = 'admin@firma.com' AND r.Kod = 'Admin';
```

---

## 2. Backend Deploy (IIS)

### .NET Hosting Bundle Kurulumu

1. [dotnet.microsoft.com](https://dotnet.microsoft.com) adresinden .NET 8 Hosting Bundle indir
2. Yükle ve IIS'i yeniden başlat: `iisreset`

### Uygulama Havuzu Oluştur

```powershell
# PowerShell (Admin)
Import-Module WebAdministration

# Application Pool
New-WebAppPool -Name "LoreBasvuruPool"
Set-ItemProperty "IIS:\AppPools\LoreBasvuruPool" -Name "managedRuntimeVersion" -Value ""
Set-ItemProperty "IIS:\AppPools\LoreBasvuruPool" -Name "processModel.identityType" -Value "ApplicationPoolIdentity"
Set-ItemProperty "IIS:\AppPools\LoreBasvuruPool" -Name "startMode" -Value "AlwaysRunning"
```

### Backend Site Oluştur

```powershell
# Backend API site
New-Website -Name "LoreBasvuruAPI" `
    -PhysicalPath "C:\inetpub\wwwroot\LoreBasvuruAPI" `
    -ApplicationPool "LoreBasvuruPool" `
    -Port 5000

# Veya mevcut site altında uygulama olarak
New-WebApplication -Name "api" `
    -Site "Default Web Site" `
    -PhysicalPath "C:\inetpub\wwwroot\LoreBasvuruAPI" `
    -ApplicationPool "LoreBasvuruPool"
```

### Publish ve Deploy

```bash
# Lokal'de publish
dotnet publish Lore.Basvuru.Service/Lore.Basvuru.Service.csproj \
    -c Release \
    -r win-x64 \
    --self-contained false \
    -o publish/api

# Publish çıktısını IIS klasörüne kopyala
# C:\inetpub\wwwroot\LoreBasvuruAPI\
```

### web.config (API için)

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*"
             modules="AspNetCoreModuleV2"
             resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath="dotnet"
                  arguments=".\Lore.Basvuru.Service.dll"
                  stdoutLogEnabled="false"
                  stdoutLogFile=".\logs\stdout"
                  hostingModel="inprocess">
        <environmentVariables>
          <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Production" />
        </environmentVariables>
      </aspNetCore>
      <security>
        <requestFiltering>
          <requestLimits maxAllowedContentLength="26214400" />
        </requestFiltering>
      </security>
    </system.webServer>
  </location>
</configuration>
```

### appsettings.Production.json

```json
{
  "CoreConfig": {
    "ConnectionString": "Server=DB_SUNUCU;Database=LoreBasvuruDB;User Id=lorebasvuru_app;Password=SecurePassword123!;TrustServerCertificate=True;",
    "MinioEndpoint": "minio.firma.com:9000",
    "MinioAccessKey": "PRODUCTION_ACCESS_KEY",
    "MinioSecretKey": "PRODUCTION_SECRET_KEY",
    "MinioUseSsl": true,
    "EncryptionKey": "PRODUCTION_ENCRYPTION_KEY_32CHARS"
  },
  "AppLogConfig": {
    "LogDirectory": "C:\\Logs\\LoreBasvuru",
    "Levels": {
      "Debug": false,
      "Info": true,
      "Warning": true,
      "Error": true,
      "RequestResponse": false
    }
  },
  "AllowedOrigins": [
    "https://basvuru.firma.com"
  ]
}
```

### Klasör İzinleri

```powershell
# Log klasörü izni
New-Item -ItemType Directory -Path "C:\Logs\LoreBasvuru" -Force
$acl = Get-Acl "C:\Logs\LoreBasvuru"
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    "IIS AppPool\LoreBasvuruPool", "FullControl", "ContainerInherit,ObjectInherit",
    "None", "Allow")
$acl.SetAccessRule($rule)
Set-Acl "C:\Logs\LoreBasvuru" $acl

# wwwroot izni
$acl = Get-Acl "C:\inetpub\wwwroot\LoreBasvuruAPI"
$acl.SetAccessRule($rule)
Set-Acl "C:\inetpub\wwwroot\LoreBasvuruAPI" $acl
```

---

## 3. Frontend Deploy (Angular)

```bash
# Angular build
cd lore-basvuru-ui
npm install
ng build --configuration production

# dist/lore-basvuru-ui içeriğini kopyala
# C:\inetpub\wwwroot\LoreBasvuruUI\
```

### Frontend IIS Site Oluştur

```powershell
New-Website -Name "LoreBasvuruUI" `
    -PhysicalPath "C:\inetpub\wwwroot\LoreBasvuruUI" `
    -ApplicationPool "LoreBasvuruPool" `
    -Port 80
```

### URL Rewrite (Angular SPA)

```xml
<!-- C:\inetpub\wwwroot\LoreBasvuruUI\web.config -->
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Angular SPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".webmanifest" mimeType="application/manifest+json" />
    </staticContent>
  </system.webServer>
</configuration>
```

---

## 4. Tek Sunucu — Reverse Proxy Yapısı

Eğer API ve UI aynı domain altında çalışacaksa (`/` → UI, `/Api` → API):

```xml
<!-- Default Web Site web.config (port 443/80) -->
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- /Api/* → localhost:5000 -->
        <rule name="API Proxy" stopProcessing="true">
          <match url="^Api/(.*)" />
          <action type="Rewrite" url="http://localhost:5000/Api/{R:1}" />
        </rule>
        <!-- Angular SPA -->
        <rule name="Angular SPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

> **Not**: Reverse proxy için IIS'te **URL Rewrite** ve **Application Request Routing (ARR)** modülleri yüklü olmalıdır.

---

## 5. SSL Sertifika (HTTPS)

```powershell
# Let's Encrypt — win-acme ile
winacme.exe --target iis --siteid 1 --installation iis

# Veya IIS Manager üzerinden:
# Site → Bindings → Add → https, port 443, sertifika seç
```

---

## 6. MinIO Production Kurulumu

```powershell
# Windows Service olarak kurulum
minio.exe server C:\MinIO\Data --address ":9000" --console-address ":9001"

# Service olarak kaydet
sc.exe create MinIO binPath="C:\MinIO\minio.exe server C:\MinIO\Data" start=auto
sc.exe start MinIO
```

---

## 7. Deployment Kontrol Listesi

### Pre-Deploy
- [ ] `appsettings.Production.json` düzgün dolduruldu
- [ ] ConnectionString test edildi (SSMS ile bağlantı kontrol)
- [ ] MinIO erişilebilir ve bucket prefix ayarlı
- [ ] Log klasörü (`C:\Logs\LoreBasvuru`) oluşturuldu, izinler verildi
- [ ] `EncryptionKey` 32 karakter ve güvenli
- [ ] URL Rewrite IIS modülü yüklü
- [ ] .NET 8 Hosting Bundle yüklü (`dotnet --info` ile kontrol)

### Post-Deploy
- [ ] `https://basvuru.firma.com/Api/Auth/Giris` → 200 döner
- [ ] Log dosyası oluştu (`C:\Logs\LoreBasvuru\LoreBasvuru_YYYYMMDD.log`)
- [ ] Admin girişi çalışıyor
- [ ] Test formu oluşturulup başvuru yapılabiliyor
- [ ] Dosya yükleme çalışıyor (MinIO bucket oluşturuldu mu?)
- [ ] CSV export çalışıyor

---

## 8. Güncelleme (Zero-Downtime)

```powershell
# 1. Uygulama havuzunu durdur
Stop-WebAppPool -Name "LoreBasvuruPool"

# 2. Yeni dosyaları kopyala (web.config hariç)
robocopy publish\api "C:\inetpub\wwwroot\LoreBasvuruAPI" /E /XF web.config

# 3. Uygulama havuzunu başlat
Start-WebAppPool -Name "LoreBasvuruPool"
```

---

## 9. İzleme ve Bakım

```powershell
# Uygulama havuzu durumu
Get-WebAppPoolState -Name "LoreBasvuruPool"

# IIS servisini yeniden başlat
iisreset /restart

# Log dosyaları
Get-Content "C:\Logs\LoreBasvuru\LoreBasvuru_$(Get-Date -Format yyyyMMdd).log" -Tail 50

# Eski logları temizle (30 günden eski)
Get-ChildItem "C:\Logs\LoreBasvuru\*.log" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
    Remove-Item -Force
```

---

## 10. Geliştirme Ortamı Hızlı Başlangıç

```bash
# Backend
cd service/Lore.Basvuru.Service
dotnet run

# Frontend
cd lore-basvuru-ui
npm install
ng serve --proxy-config proxy.conf.json

# MinIO (Docker)
docker run -d -p 9000:9000 -p 9001:9001 \
    -e MINIO_ROOT_USER=minioadmin \
    -e MINIO_ROOT_PASSWORD=minioadmin \
    minio/minio server /data --console-address ":9001"
```

### Geliştirme URL'leri
- Frontend: `http://localhost:4200`
- Backend: `http://localhost:5000`
- MinIO Console: `http://localhost:9001`
- Swagger: `http://localhost:5000/swagger`
