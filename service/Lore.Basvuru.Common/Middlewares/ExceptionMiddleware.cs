using Lore.Basvuru.Common.Logging;
using Lore.Basvuru.Common.Models;
using Lore.Basvuru.Common.Models.ServiceResponse;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;

namespace Lore.Basvuru.Common.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (AppException appEx)
            {
                AppLog.Warning($"[AppException] {appEx.code}: {appEx.message}");
                await WriteErrorResponse(context, new ServiceResponse<object>(appEx));
            }
            catch (Exception ex)
            {
                AppLog.Error("[Exception] Beklenmedik hata", ex);
                await WriteErrorResponse(context, new ServiceResponse<object>(ex));
            }
        }

        private static async Task WriteErrorResponse(HttpContext context, ServiceResponse<object> response)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = 200; // Hataları da 200 ile dön, frontend kontrol eder
            var json = JsonConvert.SerializeObject(response);
            await context.Response.WriteAsync(json);
        }
    }
}
