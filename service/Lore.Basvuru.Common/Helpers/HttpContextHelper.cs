using Microsoft.AspNetCore.Http;

namespace Lore.Basvuru.Common.Helpers
{
    public static class HttpContextHelper
    {
        private static IHttpContextAccessor? _httpContextAccessor;

        public static void Configure(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public static long GetUserId()
        {
            var context = _httpContextAccessor?.HttpContext;
            if (context == null) return 0;
            if (context.Items.TryGetValue("UserId", out var userId))
                return Convert.ToInt64(userId);
            return 0;
        }

        public static string GetClientIP()
        {
            var context = _httpContextAccessor?.HttpContext;
            if (context == null) return string.Empty;
            if (context.Items.TryGetValue("ClientIP", out var ip))
                return ip?.ToString() ?? string.Empty;
            return context.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
        }

        public static long GetTenantId()
        {
            var context = _httpContextAccessor?.HttpContext;
            if (context == null) return 0;
            if (context.Items.TryGetValue("TenantId", out var tenantId))
                return Convert.ToInt64(tenantId);
            return 0;
        }

        public static void SetUserInfo(long userId, string ip, long tenantId)
        {
            var context = _httpContextAccessor?.HttpContext;
            if (context == null) return;
            context.Items["UserId"] = userId;
            context.Items["ClientIP"] = ip;
            context.Items["TenantId"] = tenantId;
        }
    }
}
