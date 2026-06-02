# 15 — Program.cs ve Dependency Injection

## Tam Program.cs

```csharp
// Lore.Basvuru.Service/Program.cs
using Lore.Basvuru.Bal.Managers.Dosya;
using Lore.Basvuru.Bal.Managers.Form;
using Lore.Basvuru.Bal.Managers.Rapor;
using Lore.Basvuru.Bal.Managers.Security;
using Lore.Basvuru.Bal.Managers.Security.Interfaces;
using Lore.Basvuru.Bal.Managers.Workflow;
using Lore.Basvuru.Bal.Mapping;
using Lore.Basvuru.Common.Configuration;
using Lore.Basvuru.Common.Extensions;
using Lore.Basvuru.Common.Helpers;
using Lore.Basvuru.Common.Logging;
using Lore.Basvuru.Common.Logging.Models;
using Lore.Basvuru.Dal.Repository;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.Extensions.Options;
using Minio;

var builder = WebApplication.CreateBuilder(args);

// ─── 1. CoreConfig ───────────────────────────────────────────────────────────
CoreConfig.Configure(builder.Configuration);

// ─── 2. AppLogger ────────────────────────────────────────────────────────────
var logConfig = builder.Configuration
    .GetSection("AppLogConfig")
    .Get<AppLogConfig>() ?? new AppLogConfig();

var appLogger = new AppLogger(logConfig);
AppLog.Configure(appLogger);
builder.Services.AddSingleton(appLogger);
builder.Services.AddSingleton(logConfig);

AppLog.Info("[Startup] LoreBasvuru servisi başlatılıyor...");

// ─── 3. Controllers + SecurityFilter ─────────────────────────────────────────
builder.Services.AddControllers(options =>
{
    options.Conventions.Add(new ControllerSecurityConvention());
}).AddNewtonsoftJson(options =>
{
    options.SerializerSettings.ReferenceLoopHandling =
        Newtonsoft.Json.ReferenceLoopHandling.Ignore;
    options.SerializerSettings.NullValueHandling =
        Newtonsoft.Json.NullValueHandling.Ignore;
});

// ─── 4. HttpContextAccessor (HttpContextHelper için) ─────────────────────────
builder.Services.AddHttpContextAccessor();

// ─── 5. AutoMapper ───────────────────────────────────────────────────────────
builder.Services.AddAutoMapper(typeof(MappingProfile));

// ─── 6. Repository'ler (Scoped) ───────────────────────────────────────────────
// Tüm entity'ler için GenericRepository kaydı
// t_sis_* — Sistem tabloları
RegisterRepo<t_sis_user>(builder.Services);
RegisterRepo<t_sis_user_token>(builder.Services);
RegisterRepo<t_sis_login_provider>(builder.Services);
RegisterRepo<t_sis_rol>(builder.Services);
RegisterRepo<t_sis_user_rol>(builder.Services);
RegisterRepo<t_sis_tenant>(builder.Services);
RegisterRepo<t_sis_otp>(builder.Services);

// t_frm_* — Form tabloları
RegisterRepo<t_frm_basvuru_form>(builder.Services);
RegisterRepo<t_frm_basvuru_form_login_provider>(builder.Services);
RegisterRepo<t_frm_sayfa>(builder.Services);
RegisterRepo<t_frm_soru>(builder.Services);
RegisterRepo<t_frm_soru_secenek>(builder.Services);
RegisterRepo<t_frm_kural>(builder.Services);

// t_wf_* — Workflow tabloları
RegisterRepo<t_wf_workflow>(builder.Services);
RegisterRepo<t_wf_workflow_adim>(builder.Services);
RegisterRepo<t_wf_adim_rol>(builder.Services);
RegisterRepo<t_wf_adim_rol_filtre>(builder.Services);
RegisterRepo<t_wf_adim_islem>(builder.Services);
RegisterRepo<t_wf_basvuru_adim_durum>(builder.Services);

// t_bsv_* — Başvuru tabloları
RegisterRepo<t_bsv_user_basvuru>(builder.Services);
RegisterRepo<t_bsv_cevap>(builder.Services);
RegisterRepo<t_bsv_dosya>(builder.Services);

// t_lnk_* — Cross-link tabloları
RegisterRepo<t_lnk_cross_link_kural>(builder.Services);

// t_log_* — Log tabloları
RegisterRepo<t_log_islem>(builder.Services);

// ─── 7. Manager'lar (Scoped) ──────────────────────────────────────────────────
// Security
builder.Services.AddScoped<IAuthManager, AuthManager>();
builder.Services.AddScoped<ISSOManager, SSOManager>();
builder.Services.AddScoped<ILoginProviderManager, LoginProviderManager>();

// Form
builder.Services.AddScoped<IFormBuildManager, FormBuildManager>();
builder.Services.AddScoped<IFormRespondentManager, FormRespondentManager>();
builder.Services.AddScoped<IKuralManager, KuralManager>();
builder.Services.AddScoped<IDisServisManager, DisServisManager>();

// Workflow
builder.Services.AddScoped<IWorkflowManager, WorkflowManager>();

// Rapor
builder.Services.AddScoped<IRaporManager, RaporManager>();

// Dosya
builder.Services.AddScoped<IDosyaManager, DosyaManager>();

// ─── 8. MinIO (Transient — her istek yeni client) ────────────────────────────
builder.Services.AddTransient<IMinioClient>(sp =>
    new MinioClient()
        .WithEndpoint(CoreConfig.MinioEndpoint)
        .WithCredentials(CoreConfig.MinioAccessKey, CoreConfig.MinioSecretKey)
        .WithSSL(CoreConfig.MinioUseSsl)
        .Build()
);

// ─── 9. HttpClient (Dış servisler için) ──────────────────────────────────────
builder.Services.AddHttpClient();
builder.Services.AddHttpClient<IDisServisManager, DisServisManager>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

// ─── 10. Redis (Opsiyonel) ────────────────────────────────────────────────────
var redisConn = builder.Configuration.GetValue<string>("Redis:ConnectionString");
if (!string.IsNullOrEmpty(redisConn))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConn;
        options.InstanceName = "LoreBasvuru_";
    });
    AppLog.Info("[Startup] Redis cache aktif");
}
else
{
    builder.Services.AddMemoryCache();
    AppLog.Info("[Startup] In-memory cache aktif");
}

// ─── 11. CORS ─────────────────────────────────────────────────────────────────
var corsOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? new[] { "*" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("BasvuruPolicy", policy =>
    {
        if (corsOrigins.Contains("*"))
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            policy.WithOrigins(corsOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

// ─── 12. Dosya yükleme limitleri ─────────────────────────────────────────────
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 25 * 1024 * 1024; // 25 MB
});
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 25 * 1024 * 1024;
});

// ─── 13. Swagger (sadece Development) ────────────────────────────────────────
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new() { Title = "LoreBaşvuru API", Version = "v1" });
        c.AddSecurityDefinition("appToken", new()
        {
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Name = "appToken"
        });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
var app = builder.Build();
// ─────────────────────────────────────────────────────────────────────────────

// HttpContextHelper'ı konfigüre et (static — tüm katmanlar kullanır)
var httpContextAccessor = app.Services.GetRequiredService<IHttpContextAccessor>();
HttpContextHelper.Configure(httpContextAccessor);

// Middleware sırası önemli:
app.UseCors("BasvuruPolicy");

// Custom middleware'ler (ExceptionMiddleware + RequestResponseLoggingMiddleware)
app.ConfigureCustomMiddleware();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.MapControllers();

AppLog.Info("[Startup] LoreBasvuru servisi hazır");

app.Run();

// ─── Yardımcı Metod ──────────────────────────────────────────────────────────
static void RegisterRepo<T>(IServiceCollection services) where T : class
{
    services.AddScoped<IGenericRepository<T>, GenericRepository<T>>();
}

// ─── SecurityFilter Convention ───────────────────────────────────────────────
public class ControllerSecurityConvention : IControllerModelConvention
{
    public void Apply(ControllerModel controller)
    {
        controller.Filters.Add(new SecurityFilter());
    }
}
```

---

## appsettings.json (tam şablon)

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  },

  "AllowedHosts": "*",

  "AllowedOrigins": [
    "http://localhost:4200",
    "https://basvuru.firma.com"
  ],

  "CoreConfig": {
    "ConnectionString": "Server=localhost;Database=LoreBasvuruDB;User Id=sa;Password=YourPassword123!;TrustServerCertificate=True;",
    "SqlDialect": "SqlServer",

    "TokenKeyName": "appToken",
    "TokenCreateMin": "480",

    "EncryptionKey": "LoreBasvuru_SecretKey_2025!@#$",

    "IDProperty": "Id",
    "CreatedDateProperty": "CreatedDate",
    "CreatedUserProperty": "CreatedUser",
    "CreatedIpAdressProperty": "CreatedIpAdress",
    "ModifiedDateProperty": "ModifiedDate",
    "ModifiedUserProperty": "ModifiedUser",
    "ModifiedIpAdressProperty": "ModifiedIpAdress",
    "IsDeletedProperty": "IsDeleted",

    "MinioEndpoint": "localhost:9000",
    "MinioAccessKey": "minioadmin",
    "MinioSecretKey": "minioadmin",
    "MinioUseSsl": false,
    "MinioBucketPrefix": "basvuru",

    "GoogleClientId": "YOUR_GOOGLE_CLIENT_ID",
    "GoogleClientSecret": "YOUR_GOOGLE_CLIENT_SECRET"
  },

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
  },

  "Redis": {
    "ConnectionString": ""
  }
}
```

### PostgreSQL için ConnectionString

```json
"ConnectionString": "Host=localhost;Port=5432;Database=lorebasvuru;Username=postgres;Password=YourPassword123!"
"SqlDialect": "PostgreSql"
```

---

## NuGet Paketleri (Lore.Basvuru.Service.csproj)

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <!-- API -->
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.*" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.*" />
    <PackageReference Include="Microsoft.AspNetCore.Mvc.NewtonsoftJson" Version="8.*" />
  </ItemGroup>
</Project>
```

## NuGet Paketleri (Lore.Basvuru.Dal.csproj)

```xml
<ItemGroup>
  <!-- ORM -->
  <PackageReference Include="Dapper" Version="2.*" />
  <PackageReference Include="DapperExtensions" Version="1.*" />

  <!-- SQL Server -->
  <PackageReference Include="System.Data.SqlClient" Version="4.*" />

  <!-- PostgreSQL (opsiyonel) -->
  <PackageReference Include="Npgsql" Version="8.*" />
  <PackageReference Include="Npgsql.DapperExtensions" Version="1.*" />
</ItemGroup>
```

## NuGet Paketleri (Lore.Basvuru.Bal.csproj)

```xml
<ItemGroup>
  <PackageReference Include="AutoMapper" Version="13.*" />
  <PackageReference Include="AutoMapper.Extensions.Microsoft.DependencyInjection" Version="12.*" />
  <PackageReference Include="Minio" Version="6.*" />
  <PackageReference Include="Newtonsoft.Json" Version="13.*" />
  <!-- Redis (opsiyonel) -->
  <PackageReference Include="Microsoft.Extensions.Caching.StackExchangeRedis" Version="8.*" />
</ItemGroup>
```

---

## Solution Yapısı (.sln)

```
LoreBasvuru.sln
├── Lore.Basvuru.Common    → shared models, helpers, config, logging
├── Lore.Basvuru.Dal       → entities (Poco.cs), repositories
├── Lore.Basvuru.Bal       → managers, DTOs, mapping
└── Lore.Basvuru.Service   → controllers, filters, Program.cs
```

### Proje referansları:
- `Lore.Basvuru.Service` → `Lore.Basvuru.Bal`, `Lore.Basvuru.Dal`, `Lore.Basvuru.Common`
- `Lore.Basvuru.Bal` → `Lore.Basvuru.Dal`, `Lore.Basvuru.Common`
- `Lore.Basvuru.Dal` → `Lore.Basvuru.Common`
- `Lore.Basvuru.Common` → (yok)
