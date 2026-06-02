using Lore.Basvuru.Common.Logging;
using Microsoft.AspNetCore.Http;

namespace Lore.Basvuru.Common.Middlewares
{
    public class RequestResponseLoggingMiddleware
    {
        private readonly RequestDelegate _next;

        public RequestResponseLoggingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var method = context.Request.Method;
            var path = context.Request.Path;
            var start = DateTime.Now;

            AppLog.RequestResponse($"→ {method} {path} [{start:HH:mm:ss}]");

            await _next(context);

            var elapsed = (DateTime.Now - start).TotalMilliseconds;
            AppLog.RequestResponse($"← {method} {path} {context.Response.StatusCode} ({elapsed:F0}ms)");
        }
    }
}
