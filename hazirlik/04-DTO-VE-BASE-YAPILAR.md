# 04 — DTO ve Base Yapılar

## BaseDTO (EID Pattern)

Her DTO bu sınıftan türer. `id` alanı JSON'a yazılmaz, bunun yerine şifreli `eid` string kullanılır.

```csharp
// Lore.Basvuru.Common/DTO/Base/BaseDTO.cs
using Lore.Basvuru.Common.Helpers;
using Newtonsoft.Json;

namespace Lore.Basvuru.Common.DTO.Base
{
    public abstract class BaseDTO
    {
        private string _eid;
        private long _id;
        private bool _manualEidSet = false;

        [JsonIgnore]
        public long id
        {
            get => _id;
            set
            {
                _id = value;
                if (_id > 0 && !_manualEidSet)
                    _eid = CryptoHelper.EncryptString(_id.ToString());
            }
        }

        public string eid
        {
            get => _eid;
            set
            {
                _eid = value;
                if (_eid != null) _manualEidSet = true;

                if (!string.IsNullOrWhiteSpace(_eid))
                {
                    try
                    {
                        _id = Convert.ToInt64(CryptoHelper.DecryptString(_eid));
                        _manualEidSet = false;
                    }
                    catch
                    {
                        _id = 0;
                    }
                }
            }
        }
    }
}
```

---

## EidDTO

Sadece `eid` alan GET/DELETE için kullanılan minimal DTO:

```csharp
// Lore.Basvuru.Common/DTO/Base/EidDTO.cs
namespace Lore.Basvuru.Common.DTO.Base
{
    public class EidDTO : BaseDTO
    {
        // Sadece eid mirası alınır (BaseDTO'dan)
        // Kullanım: frontend id yerine şifreli eid gönderir
    }
}
```

---

## SingleValueDTO

```csharp
// Lore.Basvuru.Common/DTO/Base/SingleValueDTO.cs
namespace Lore.Basvuru.Common.DTO.Base
{
    public class SingleValueDTO
    {
        public string value { get; set; }
    }

    public class SingleLongDTO
    {
        public long value { get; set; }
    }

    public class SingleBoolDTO
    {
        public bool value { get; set; }
    }
}
```

---

## CoreConfig

```csharp
// Lore.Basvuru.Common/Configuration/CoreConfig.cs
namespace Lore.Basvuru.Common.Configuration
{
    public class CoreConfig
    {
        // DB
        public static string ConnectionString { get; set; }
        public static string SqlDialect { get; set; } = "SqlServer"; // veya "PostgreSql"

        // ORM field names (Poco'daki property adlarıyla eşleşmeli)
        public static string IDProperty { get; set; }
        public static string CreatedUserProperty { get; set; }
        public static string CreatedDateProperty { get; set; }
        public static string CreatedIpAdressProperty { get; set; }
        public static string ModifiedUserProperty { get; set; }
        public static string ModifiedDateProperty { get; set; }
        public static string ModifiedIpAdressProperty { get; set; }
        public static string IsDeletedProperty { get; set; }

        // Token
        public static string TokenKeyName { get; set; }
        public static string TokenCreateMin { get; set; }
        public static string TokenExpAddMin { get; set; }
        public static string TokenExpMin { get; set; }

        // App hosts
        public static bool IsProd { get; set; }
        public static string UygulamaWebHost { get; set; }
        public static string UygulamaServiceHost { get; set; }

        // Encryption
        public static string EncryptionKey { get; set; }  // CryptoHelper için
        public static string superToken { get; set; }

        // SSO
        public static string GoogleClientId { get; set; }
        public static string GoogleClientSecret { get; set; }

        // MinIO
        public static string MinioEndpoint { get; set; }
        public static string MinioAccessKey { get; set; }
        public static string MinioSecretKey { get; set; }
        public static string MinioBucket { get; set; }
        public static bool MinioUseSSL { get; set; }

        // Redis
        public static string RedisHost { get; set; }
        public static string RedisPort { get; set; }
        public static string RedisPassword { get; set; }

        public static string ProjectName { get; set; }
    }
}
```

---

## appsettings.json (CoreConfig bağlantısı)

```json
{
  "CoreConfig": {
    "ConnectionString": "Server=.;Database=LoreBasvuru;User Id=sa;Password=xxx;TrustServerCertificate=True;",
    "SqlDialect": "SqlServer",
    "IDProperty": "Id",
    "CreatedUserProperty": "CreatedUser",
    "CreatedDateProperty": "CreatedDate",
    "CreatedIpAdressProperty": "CreatedIP",
    "ModifiedUserProperty": "ModifiedUser",
    "ModifiedDateProperty": "ModifiedDate",
    "ModifiedIpAdressProperty": "ModifiedIP",
    "IsDeletedProperty": "IsDeleted",
    "TokenKeyName": "appToken",
    "TokenCreateMin": "60",
    "TokenExpAddMin": "30",
    "TokenExpMin": "60",
    "IsProd": false,
    "UygulamaWebHost": "https://localhost:4200",
    "UygulamaServiceHost": "https://localhost:5000/Api",
    "EncryptionKey": "BasvuruSistemi2024!@#$",
    "superToken": "supersecrettoken2024",
    "MinioEndpoint": "localhost:9000",
    "MinioAccessKey": "minioadmin",
    "MinioSecretKey": "minioadmin",
    "MinioBucket": "basvuru",
    "MinioUseSSL": false,
    "RedisHost": "localhost",
    "RedisPort": "6379",
    "ProjectName": "LoreBasvuru"
  },
  "AppLogConfig": {
    "IsActive": true,
    "ProjectName": "LoreBasvuru",
    "LogDirectory": "D:/logs/LoreBasvuru",
    "FallbackDirectory": "defaultLogs",
    "EnableRequestResponseLogging": true,
    "EnableExceptionDetailLogging": true,
    "Levels": {
      "Debug": false,
      "Info": true,
      "RequestResponse": true,
      "Warning": true,
      "Error": true
    }
  }
}
```

---

## ServiceResponse<T>

```csharp
// Lore.Basvuru.Common/Models/ServiceResponse/ServiceResponse.cs
using Lore.Basvuru.Common.DTO.Enums;

namespace Lore.Basvuru.Common.Models.ServiceResponse
{
    public class ServiceResponse<T>
    {
        public bool isSuccess { get; set; } = true;
        public string message { get; set; } = string.Empty;
        public AppExceptionModel error_message { get; set; }
        public AppExceptionModel dev_message { get; set; }
        public T data { get; set; }
        public int? pageNumber { get; set; }
        public int? itemsPerPage { get; set; }
        public int? totalItems { get; set; }

        public ServiceResponse() { }

        public ServiceResponse(T entity)
        {
            isSuccess = true;
            data = entity;
            message = ServiceResponseMessageType.Success;
        }

        public ServiceResponse(AppException appEx)
        {
            isSuccess = false;
            dev_message = new AppExceptionModel
            {
                messageHeader = appEx.header,
                code = appEx.code,
                message = $"{appEx.message} ST:{appEx.StackTrace}"
            };
            error_message = new AppExceptionModel
            {
                messageHeader = appEx.header,
                code = appEx.code,
                message = appEx.message
            };
            message = ServiceResponseMessageType.Error;
        }

        public ServiceResponse(Exception ex)
        {
            isSuccess = false;
            dev_message = new AppExceptionModel
            {
                messageHeader = "Beklenmedik hata",
                code = (int)MessageCode.ERROR_500_BIR_HATA_OLUSTU,
                message = $"{ex.Message} ST:{ex.StackTrace}"
            };
            error_message = new AppExceptionModel
            {
                messageHeader = "Beklenmedik hata",
                code = (int)MessageCode.ERROR_500_BIR_HATA_OLUSTU,
                message = ex.Message
            };
            message = ServiceResponseMessageType.Error;
        }
    }

    public class AppExceptionModel
    {
        public string messageHeader { get; set; }
        public int code { get; set; }
        public string message { get; set; }
    }

    public static class ServiceResponseMessageType
    {
        public static string Error = "error";
        public static string Success = "success";
        public static string Warning = "warning";
        public static string Info = "info";
    }
}
```

---

## AppException

```csharp
// Lore.Basvuru.Common/Models/AppException.cs
using Lore.Basvuru.Common.DTO.Enums;

namespace Lore.Basvuru.Common.Models
{
    public class AppException : Exception
    {
        public string header { get; set; } = "Hata";
        public int code { get; set; }
        public new string message { get; set; }

        public AppException(string mesaj)
        {
            message = mesaj;
            code = (int)MessageCode.ERROR_500_BIR_HATA_OLUSTU;
        }

        public AppException(int kod, string mesaj)
        {
            code = kod;
            message = mesaj;
        }

        public AppException(MessageCode kod, string mesaj)
        {
            code = Convert.ToInt16(kod);
            message = mesaj;
        }

        public AppException(MessageCode messageCode, string messageHeader, Exception exp)
        {
            header = messageHeader;
            code = Convert.ToInt16(messageCode);
            message = exp.Message;
        }
    }
}
```

---

## MessageCode Enum

```csharp
// Lore.Basvuru.Common/DTO/Enums/MessageCode.cs
namespace Lore.Basvuru.Common.DTO.Enums
{
    public enum MessageCode
    {
        // 200 - Başarılı
        SUCCESS_200 = 200,

        // 400 - İstemci hataları
        ERROR_400_GECERSIZ_ISTEK = 400,
        ERROR_401_YETKISIZ = 401,
        ERROR_403_ERISIM_YASAK = 403,
        ERROR_404_BULUNAMADI = 404,

        // 500 - Sunucu hataları
        ERROR_500_BIR_HATA_OLUSTU = 500,
        ERROR_500_TOKEN_GECERSIZ = 501,
        ERROR_500_TOKEN_SURESI_DOLDU = 502,
        ERROR_500_KULLANICI_BULUNAMADI = 503,
        ERROR_500_PAROLA_HATALI = 504,
        ERROR_500_FORM_BULUNAMADI = 510,
        ERROR_500_BASVURU_BULUNAMADI = 511,
        ERROR_500_BASVURU_SURESI_DOLDU = 512,
        ERROR_500_BASVURU_ZATEN_YAPILDI = 513,
        ERROR_500_BASVURU_LINK_IHLALI = 514,
        ERROR_500_WORKFLOW_HATASI = 520,
        ERROR_500_DOSYA_UPLOAD_HATALI = 530,
    }
}
```

---

## Domain DTO Örnekleri

### BasvuruFormDTO
```csharp
// Lore.Basvuru.Common/DTO/Form/Common/BasvuruFormDTO.cs
using Lore.Basvuru.Common.DTO.Base;

namespace Lore.Basvuru.Common.DTO.Form.Common
{
    public class BasvuruFormDTO : BaseDTO
    {
        public string ad { get; set; }
        public string aciklama { get; set; }
        public DateTime? baslamaTarihi { get; set; }
        public DateTime? bitisTarihi { get; set; }
        public int durum { get; set; }
        public string durumAdi { get; set; }           // Computed
        public bool loginGerekliMi { get; set; }
        public bool anonymousIzinliMi { get; set; }
        public bool cokluBasvuruIzinliMi { get; set; }
        public string kopyalandiFormEid { get; set; }
        public string workflowEid { get; set; }
        public bool bildirimAktifMi { get; set; }
        public bool aktifMi { get; set; }              // Computed: tarih kontrolü
        public List<BasvuruSayfaDTO> sayfalar { get; set; }
    }
}
```

### BasvuruSoruDTO
```csharp
// Lore.Basvuru.Common/DTO/Form/Common/BasvuruSoruDTO.cs
using Lore.Basvuru.Common.DTO.Base;

namespace Lore.Basvuru.Common.DTO.Form.Common
{
    public class BasvuruSoruDTO : BaseDTO
    {
        public string sayfaEid { get; set; }
        public string etiket { get; set; }
        public string altMetin { get; set; }
        public int soruTipi { get; set; }
        public string soruTipiAdi { get; set; }        // Computed
        public bool zorunluMu { get; set; }
        public int siraNo { get; set; }
        public string grupKodu { get; set; }
        public int? grupMin { get; set; }
        public int? grupMax { get; set; }
        public int kaynakTipi { get; set; }
        public string kaynakEid { get; set; }
        public string degerValidasyonuJson { get; set; }
        public bool gizliMi { get; set; }
        public bool readOnlyMi { get; set; }
        public List<BasvuruSecenekDTO> secenekler { get; set; }
    }
}
```

### KullaniciTokenDTO (login response)
```csharp
// Lore.Basvuru.Common/DTO/Security/Auth/KullaniciTokenDTO.cs
using Lore.Basvuru.Common.DTO.Base;

namespace Lore.Basvuru.Common.DTO.Security.Auth
{
    public class KullaniciTokenDTO
    {
        public bool isLogin { get; set; }
        public string token { get; set; }
        public string refreshToken { get; set; }
        public DateTime tokenExpiry { get; set; }
        public KullaniciDTO kullaniciDto { get; set; }
        public List<string> roller { get; set; }
    }

    public class KullaniciDTO : BaseDTO
    {
        public string ad { get; set; }
        public string soyad { get; set; }
        public string adSoyad { get; set; }         // Computed
        public string email { get; set; }
        public string telefon { get; set; }
        public long? tenantId { get; set; }
        public string tenantAdi { get; set; }
    }
}
```

### DataTable DTO (liste sorguları için)
```csharp
// Lore.Basvuru.Common/DTO/Base/Datatable/DatatableRequestDTO.cs
namespace Lore.Basvuru.Common.DTO.Base.Datatable
{
    public class DatatableRequestDTO<T>
    {
        public int pageNumber { get; set; } = 1;
        public int pageSize { get; set; } = 10;
        public string sortField { get; set; }
        public string sortOrder { get; set; } = "asc";   // asc / desc
        public T filter { get; set; }
    }
}

// Lore.Basvuru.Common/DTO/Base/Datatable/DatatableResponseDTO.cs
namespace Lore.Basvuru.Common.DTO.Base.Datatable
{
    public class DatatableResponseDTO<T>
    {
        public List<T> data { get; set; }
        public int totalRecords { get; set; }
        public int pageNumber { get; set; }
        public int pageSize { get; set; }
        public int totalPages => (int)Math.Ceiling((double)totalRecords / pageSize);
    }
}
```
