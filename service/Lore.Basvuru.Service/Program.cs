using Lore.Basvuru.Bal.AutoMapper;
using Lore.Basvuru.Bal.Managers.DisServis;
using Lore.Basvuru.Bal.Managers.DisServis.Interfaces;
using Lore.Basvuru.Bal.Managers.Dosya;
using Lore.Basvuru.Bal.Managers.Dosya.Interfaces;
using Lore.Basvuru.Bal.Managers.Form;
using Lore.Basvuru.Bal.Managers.Form.Interfaces;
using Lore.Basvuru.Bal.Managers.Rapor;
using Lore.Basvuru.Bal.Managers.Rapor.Interfaces;
using Lore.Basvuru.Bal.Managers.Security;
using Lore.Basvuru.Bal.Managers.Security.Interfaces;
using Lore.Basvuru.Bal.Managers.Tenant;
using Lore.Basvuru.Bal.Managers.Tenant.Interfaces;
using Lore.Basvuru.Bal.Managers.Workflow;
using Lore.Basvuru.Bal.Managers.Workflow.Interfaces;
using Lore.Basvuru.Common.Configuration;
using Lore.Basvuru.Common.Helpers;
using Lore.Basvuru.Common.Logging;
using Lore.Basvuru.Common.Logging.Interfaces;
using Lore.Basvuru.Common.Logging.Models;
using Lore.Basvuru.Common.Middlewares;
using Lore.Basvuru.Dal.Repository;
using Lore.Basvuru.Service.Filters;
using Minio;
using Newtonsoft.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

CoreConfig.Configure(builder.Configuration);

var logConfig = builder.Configuration
    .GetSection("AppLogConfig")
    .Get<AppLogConfig>() ?? new AppLogConfig
    {
        ProjectName = CoreConfig.ProjectName,
        LogDirectory = "Logs"
    };
var appLogger = new AppLogger(logConfig);
AppLog.Configure(appLogger);
builder.Services.AddSingleton<IAppLogger>(appLogger);

builder.Services.AddControllers(options =>
{
    options.Filters.Add<SecurityFilter>();
})
.AddNewtonsoftJson(options =>
{
    options.SerializerSettings.ContractResolver = new DefaultContractResolver();
    options.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
    options.SerializerSettings.DateFormatString = "yyyy-MM-dd HH:mm:ss";
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddAutoMapper(typeof(MappingProfile));
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));

builder.Services.AddScoped<IAuthManager, AuthManager>();
builder.Services.AddScoped<IYetkiManager, YetkiManager>();
builder.Services.AddScoped<ITenantManager, TenantManager>();
builder.Services.AddScoped<IFormBuildManager, FormBuildManager>();
builder.Services.AddScoped<IFormRespondentManager, FormRespondentManager>();
builder.Services.AddScoped<IKuralManager, KuralManager>();
builder.Services.AddScoped<IWorkflowManager, WorkflowManager>();
builder.Services.AddScoped<IRaporManager, RaporManager>();
builder.Services.AddScoped<IDosyaManager, DosyaManager>();
builder.Services.AddScoped<IDisServisManager, DisServisManager>();

builder.Services.AddScoped<SecurityFilter>();

builder.Services.AddSingleton<IMinioClient>(_ =>
    new MinioClient()
        .WithEndpoint(CoreConfig.MinioEndpoint)
        .WithCredentials(CoreConfig.MinioAccessKey, CoreConfig.MinioSecretKey)
        .WithSSL(CoreConfig.MinioUseSsl)
        .Build());

builder.Services.AddHttpClient("DisServis");

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "LoreBasvuru API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new()
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "Token",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "LoreBasvuru token: Bearer {token}"
    });
    c.AddSecurityRequirement(new()
    {
        {
            new() { Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

// CORS — SetIsOriginAllowed kullanilmali; AllowAnyOrigin + AllowCredentials birlikte calismaz
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
        policy
            .WithOrigins(
                "http://localhost:4200",
                "https://localhost:4200",
                "http://localhost:4201",
                "https://localhost:4201")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());

    options.AddPolicy("AllowAll", policy =>
        policy
            .SetIsOriginAllowed(_ => true)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

var app = builder.Build();

var httpContextAccessor = app.Services.GetRequiredService<IHttpContextAccessor>();
HttpContextHelper.Configure(httpContextAccessor);

// MIDDLEWARE SIRASI
app.UseMiddleware<ExceptionMiddleware>();
app.UseHttpsRedirection();
app.UseMiddleware<RequestResponseLoggingMiddleware>();

app.UseRouting();

// CORS: UseRouting SONRASI, MapControllers ONCESI olmali
app.UseCors(app.Environment.IsDevelopment() ? "AllowAngularDev" : "AllowAll");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "LoreBasvuru API v1"));
}

app.MapControllers();

app.Run();
