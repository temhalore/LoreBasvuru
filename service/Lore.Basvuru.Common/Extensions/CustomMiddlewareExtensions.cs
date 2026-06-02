using Lore.Basvuru.Common.Middlewares;
using Microsoft.AspNetCore.Builder;

namespace Lore.Basvuru.Common.Extensions
{
    public static class CustomMiddlewareExtensions
    {
        public static IApplicationBuilder ConfigureCustomMiddleware(this IApplicationBuilder app)
        {
            app.UseMiddleware<ExceptionMiddleware>();
            app.UseMiddleware<RequestResponseLoggingMiddleware>();
            return app;
        }
    }
}
