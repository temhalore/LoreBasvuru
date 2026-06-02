# 13 — Loglama

## AppLogConfig

```csharp
// Lore.Basvuru.Common/Logging/Models/AppLogConfig.cs
namespace Lore.Basvuru.Common.Logging.Models
{
    public class AppLogConfig
    {
        public string ProjectName { get; set; } = "LoreBasvuru";
        public string LogDirectory { get; set; } = "Logs";
        public string FallbackDirectory { get; set; } = "C:\\Logs\\LoreBasvuru";
        public AppLogLevels Levels { get; set; } = new();
    }

    public class AppLogLevels
    {
        public bool Debug { get; set; } = false;
        public bool Info { get; set; } = true;
        public bool Warning { get; set; } = true;
        public bool Error { get; set; } = true;
        public bool RequestResponse { get; set; } = false;
    }
}
```

---

## AppLogger

```csharp
// Lore.Basvuru.Common/Logging/AppLogger.cs
using Lore.Basvuru.Common.Logging.Models;

namespace Lore.Basvuru.Common.Logging
{
    public class AppLogger
    {
        private readonly AppLogConfig _config;
        private string _logDirectory;
        private readonly object _lock = new();

        public AppLogger(AppLogConfig config)
        {
            _config = config;
            _logDirectory = GetLogsDirectory();
        }

        private string GetLogsDirectory()
        {
            // 1. appsettings'deki LogDirectory (relative → absolute)
            var primaryPath = Path.IsPathRooted(_config.LogDirectory)
                ? _config.LogDirectory
                : Path.Combine(AppDomain.CurrentDomain.BaseDirectory, _config.LogDirectory);

            if (TryEnsureDirectory(primaryPath))
                return primaryPath;

            // 2. Fallback directory
            if (!string.IsNullOrEmpty(_config.FallbackDirectory))
            {
                if (TryEnsureDirectory(_config.FallbackDirectory))
                    return _config.FallbackDirectory;
            }

            // 3. Temp
            var tempPath = Path.Combine(Path.GetTempPath(), _config.ProjectName, "Logs");
            TryEnsureDirectory(tempPath);
            return tempPath;
        }

        private static bool TryEnsureDirectory(string path)
        {
            try
            {
                if (!Directory.Exists(path))
                    Directory.CreateDirectory(path);
                // Yazma testi
                var test = Path.Combine(path, ".write_test");
                File.WriteAllText(test, "");
                File.Delete(test);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public void Debug(string message, Exception ex = null)
        {
            if (_config.Levels.Debug)
                Yaz("DEBUG", message, ex);
        }

        public void Info(string message)
        {
            if (_config.Levels.Info)
                Yaz("INFO", message);
        }

        public void Warning(string message, Exception ex = null)
        {
            if (_config.Levels.Warning)
                Yaz("WARNING", message, ex);
        }

        public void Error(string message, Exception ex = null)
        {
            if (_config.Levels.Error)
                Yaz("ERROR", message, ex);
        }

        public void RequestResponse(string method, string path, int statusCode,
            long elapsedMs, string requestBody = null, string responseBody = null)
        {
            if (!_config.Levels.RequestResponse) return;

            var content = $"{method} {path} → {statusCode} [{elapsedMs}ms]";
            if (!string.IsNullOrEmpty(requestBody))
                content += $"\n  REQ: {requestBody}";
            if (!string.IsNullOrEmpty(responseBody))
                content += $"\n  RES: {responseBody?.Substring(0, Math.Min(500, responseBody.Length))}";

            Yaz("REQUEST", content);
        }

        private void Yaz(string seviye, string mesaj, Exception ex = null)
        {
            try
            {
                var tarih = DateTime.Now;
                var dosyaAd = $"{_config.ProjectName}_{tarih:yyyyMMdd}.log";
                var dosyaYolu = Path.Combine(_logDirectory, dosyaAd);

                var satirlar = new List<string>
                {
                    $"[{tarih:yyyy-MM-dd HH:mm:ss.fff}] [{seviye}] {mesaj}"
                };

                if (ex != null)
                {
                    satirlar.Add($"  Exception: {ex.GetType().Name}: {ex.Message}");
                    if (ex.StackTrace != null)
                    {
                        foreach (var satir in ex.StackTrace.Split('\n').Take(10))
                            satirlar.Add($"  {satir.Trim()}");
                    }
                    if (ex.InnerException != null)
                        satirlar.Add($"  InnerException: {ex.InnerException.Message}");
                }

                lock (_lock)
                {
                    File.AppendAllLines(dosyaYolu, satirlar);
                }
            }
            catch
            {
                // Loglama hatası → yut (sistem çökmemeli)
            }
        }

        // Eski logları temizle (X günden eski)
        public void EskiLoglarTemizle(int gunSayisi = 30)
        {
            try
            {
                var sinirTarih = DateTime.Now.AddDays(-gunSayisi);
                foreach (var dosya in Directory.GetFiles(_logDirectory, "*.log"))
                {
                    if (File.GetCreationTime(dosya) < sinirTarih)
                        File.Delete(dosya);
                }
            }
            catch (Exception ex)
            {
                Error("EskiLoglarTemizle hatası", ex);
            }
        }
    }
}
```

---

## AppLog (Static Erişim)

```csharp
// Lore.Basvuru.Common/Logging/AppLog.cs
// Tüm katmanlardan static olarak erişilir
namespace Lore.Basvuru.Common.Logging
{
    public static class AppLog
    {
        private static AppLogger _logger;

        public static void Configure(AppLogger logger)
        {
            _logger = logger;
        }

        public static void Debug(string message, Exception ex = null)
            => _logger?.Debug(message, ex);

        public static void Info(string message)
            => _logger?.Info(message);

        public static void Warning(string message, Exception ex = null)
            => _logger?.Warning(message, ex);

        public static void Error(string message, Exception ex = null)
            => _logger?.Error(message, ex);

        public static void RequestResponse(string method, string path,
            int statusCode, long elapsedMs,
            string requestBody = null, string responseBody = null)
            => _logger?.RequestResponse(method, path, statusCode, elapsedMs,
                requestBody, responseBody);
    }
}
```

---

## RequestResponseLoggingMiddleware

```csharp
// Lore.Basvuru.Common/Middlewares/RequestResponseLoggingMiddleware.cs
namespace Lore.Basvuru.Common.Middlewares
{
    public class RequestResponseLoggingMiddleware
    {
        private readonly RequestDelegate _next;

        // Bu endpoint'lerin body'si loglanmaz (şifre içerebilir)
        private static readonly HashSet<string> AtlananYollar = new(StringComparer.OrdinalIgnoreCase)
        {
            "/Api/Auth/Giris",
            "/Api/Auth/KayitOl",
            "/Api/Auth/SifreDegistir"
        };

        public RequestResponseLoggingMiddleware(RequestDelegate next) => _next = next;

        public async Task InvokeAsync(HttpContext context)
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();
            var method = context.Request.Method;
            var path = context.Request.Path.Value;

            string requestBody = null;
            if (method is "POST" or "PUT" && !AtlananYollar.Contains(path))
            {
                context.Request.EnableBuffering();
                using var reader = new StreamReader(context.Request.Body,
                    leaveOpen: true);
                requestBody = await reader.ReadToEndAsync();
                context.Request.Body.Position = 0;

                // Büyük body'leri kes
                if (requestBody?.Length > 2000)
                    requestBody = requestBody[..2000] + "... [kesildi]";
            }

            // Orijinal response stream'i yakala
            var originalBody = context.Response.Body;
            using var responseBodyMs = new MemoryStream();
            context.Response.Body = responseBodyMs;

            await _next(context);

            sw.Stop();

            // Response body'yi oku
            responseBodyMs.Seek(0, SeekOrigin.Begin);
            var responseBody = await new StreamReader(responseBodyMs).ReadToEndAsync();
            responseBodyMs.Seek(0, SeekOrigin.Begin);
            await responseBodyMs.CopyToAsync(originalBody);
            context.Response.Body = originalBody;

            if (responseBody?.Length > 1000)
                responseBody = responseBody[..1000] + "... [kesildi]";

            AppLog.RequestResponse(method, path, context.Response.StatusCode,
                sw.ElapsedMilliseconds, requestBody, responseBody);
        }
    }
}
```

---

## Program.cs'te Konfigürasyon

```csharp
// Program.cs — AppLogger kurulumu
var logConfig = builder.Configuration
    .GetSection("AppLogConfig")
    .Get<AppLogConfig>() ?? new AppLogConfig();

var appLogger = new AppLogger(logConfig);
AppLog.Configure(appLogger);

// Singleton olarak da kaydet (DI gerekirse)
builder.Services.AddSingleton(appLogger);
builder.Services.AddSingleton(logConfig);
```

---

## appsettings.json — AppLogConfig Bölümü

```json
{
  "AppLogConfig": {
    "ProjectName": "LoreBasvuru",
    "LogDirectory": "Logs",
    "FallbackDirectory": "C:\\Logs\\LoreBasvuru",
    "Levels": {
      "Debug": false,
      "Info": true,
      "Warning": true,
      "Error": true,
      "RequestResponse": false
    }
  }
}
```

---

## Log Dosya Yapısı

```
{AppBase}/Logs/
├── LoreBasvuru_20260101.log
├── LoreBasvuru_20260102.log
└── LoreBasvuru_20260103.log
```

### Örnek Log Satırları

```
[2026-01-15 09:23:14.512] [INFO] [FormBuildManager] FormKaydet: FormId=42, User=7
[2026-01-15 09:23:15.001] [INFO] [FormRespondentManager] BasvuruBaslat: FormId=42, UserId=31, BasvuruId=150
[2026-01-15 09:24:01.888] [ERROR] Token doğrulama başarısız: Token süresi dolmuş
  Exception: AppException: Token süresi dolmuş veya geçersiz
  at Lore.Basvuru.Bal.Managers.Security.AuthManager.TokenDogrula(String token)
  at Lore.Basvuru.Service.Filters.SecurityFilter.OnActionExecuting(ActionExecutingContext context)
[2026-01-15 09:30:00.000] [REQUEST] POST /Api/FormRespondent/CevapKaydet → 200 [45ms]
  REQ: {"basvuruEid":"abc123","sayfaNo":1,"cevaplar":[...]}
  RES: {"isSuccess":true,"data":null,"message":"Cevaplar kaydedildi"... [kesildi]
```

---

## t_log_islem Tablosu

Kritik iş olayları (workflow kararları, durum değişiklikleri) ayrıca DB'de de loglanır:

```csharp
// İş event'lerini DB'ye logla
public void IslemLogKaydet(string islemTipi, string aciklama, long? basvuruId = null)
{
    var log = new t_log_islem
    {
        TenantId = HttpContextHelper.GetTenantId(),
        IslemTipi = islemTipi,
        Aciklama = aciklama,
        BasvuruId = basvuruId,
        // CreatedUser/Date/IP otomatik set edilir (BaseRepository)
    };
    _logRepo.Insert(log);
}
```
