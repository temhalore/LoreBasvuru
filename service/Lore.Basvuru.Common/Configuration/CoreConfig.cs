using Microsoft.Extensions.Configuration;

namespace Lore.Basvuru.Common.Configuration
{
    public class CoreConfig
    {
        // DB
        public static string ConnectionString { get; set; } = string.Empty;
        public static string SqlDialect { get; set; } = "PostgreSql";

        // ORM field names
        public static string IDProperty { get; set; } = "Id";
        public static string CreatedUserProperty { get; set; } = "CreatedUser";
        public static string CreatedDateProperty { get; set; } = "CreatedDate";
        public static string CreatedIpAdressProperty { get; set; } = "CreatedIP";
        public static string ModifiedUserProperty { get; set; } = "ModifiedUser";
        public static string ModifiedDateProperty { get; set; } = "ModifiedDate";
        public static string ModifiedIpAdressProperty { get; set; } = "ModifiedIP";
        public static string IsDeletedProperty { get; set; } = "IsDeleted";

        // Token
        public static string TokenKeyName { get; set; } = "appToken";
        public static string TokenCreateMin { get; set; } = "480";
        public static string TokenExpAddMin { get; set; } = "30";
        public static string TokenExpMin { get; set; } = "480";

        // App hosts
        public static bool IsProd { get; set; } = false;
        public static string UygulamaWebHost { get; set; } = string.Empty;
        public static string UygulamaServiceHost { get; set; } = string.Empty;

        // Encryption
        public static string EncryptionKey { get; set; } = string.Empty;
        public static string superToken { get; set; } = string.Empty;

        // SSO
        public static string GoogleClientId { get; set; } = string.Empty;
        public static string GoogleClientSecret { get; set; } = string.Empty;

        // MinIO
        public static string MinioEndpoint { get; set; } = "localhost:9000";
        public static string MinioAccessKey { get; set; } = "minioadmin";
        public static string MinioSecretKey { get; set; } = "minioadmin";
        public static string MinioBucket { get; set; } = "basvuru";
        public static bool MinioUseSsl { get; set; } = false;

        // Redis
        public static string RedisHost { get; set; } = string.Empty;
        public static string RedisPort { get; set; } = "6379";
        public static string RedisPassword { get; set; } = string.Empty;

        public static string ProjectName { get; set; } = "LoreBasvuru";

        public static void Configure(IConfiguration configuration)
        {
            var section = configuration.GetSection("CoreConfig");
            ConnectionString = section["ConnectionString"] ?? string.Empty;
            SqlDialect = section["SqlDialect"] ?? "PostgreSql";
            IDProperty = section["IDProperty"] ?? "Id";
            CreatedUserProperty = section["CreatedUserProperty"] ?? "CreatedUser";
            CreatedDateProperty = section["CreatedDateProperty"] ?? "CreatedDate";
            CreatedIpAdressProperty = section["CreatedIpAdressProperty"] ?? "CreatedIP";
            ModifiedUserProperty = section["ModifiedUserProperty"] ?? "ModifiedUser";
            ModifiedDateProperty = section["ModifiedDateProperty"] ?? "ModifiedDate";
            ModifiedIpAdressProperty = section["ModifiedIpAdressProperty"] ?? "ModifiedIP";
            IsDeletedProperty = section["IsDeletedProperty"] ?? "IsDeleted";
            TokenKeyName = section["TokenKeyName"] ?? "appToken";
            TokenCreateMin = section["TokenCreateMin"] ?? "480";
            TokenExpAddMin = section["TokenExpAddMin"] ?? "30";
            TokenExpMin = section["TokenExpMin"] ?? "480";
            IsProd = bool.TryParse(section["IsProd"], out var isProd) && isProd;
            UygulamaWebHost = section["UygulamaWebHost"] ?? string.Empty;
            UygulamaServiceHost = section["UygulamaServiceHost"] ?? string.Empty;
            EncryptionKey = section["EncryptionKey"] ?? string.Empty;
            superToken = section["superToken"] ?? string.Empty;
            GoogleClientId = section["GoogleClientId"] ?? string.Empty;
            GoogleClientSecret = section["GoogleClientSecret"] ?? string.Empty;
            MinioEndpoint = section["MinioEndpoint"] ?? "localhost:9000";
            MinioAccessKey = section["MinioAccessKey"] ?? "minioadmin";
            MinioSecretKey = section["MinioSecretKey"] ?? "minioadmin";
            MinioBucket = section["MinioBucket"] ?? "basvuru";
            MinioUseSsl = bool.TryParse(section["MinioUseSsl"], out var mssl) && mssl;
            RedisHost = section["RedisHost"] ?? string.Empty;
            RedisPort = section["RedisPort"] ?? "6379";
            RedisPassword = section["RedisPassword"] ?? string.Empty;
            ProjectName = section["ProjectName"] ?? "LoreBasvuru";
        }
    }
}
