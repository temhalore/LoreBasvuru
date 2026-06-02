using Lore.Basvuru.Bal.Managers.Security.Interfaces;
using Lore.Basvuru.Common.Configuration;
using Lore.Basvuru.Common.Helpers;
using Lore.Basvuru.Common.Logging;
using Lore.Basvuru.Common.Models;
using Lore.Basvuru.Common.Models.ServiceResponse;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Newtonsoft.Json;

namespace Lore.Basvuru.Service.Filters
{
    public class SecurityFilter : IActionFilter
    {
        private readonly IAuthManager _authManager;
        private readonly IYetkiManager _yetkiManager;

        public SecurityFilter(IAuthManager authManager, IYetkiManager yetkiManager)
        {
            _authManager = authManager;
            _yetkiManager = yetkiManager;
        }

        public void OnActionExecuting(ActionExecutingContext context)
        {
            var descriptor = context.ActionDescriptor as ControllerActionDescriptor;
            if (descriptor == null) return;

            // [DirectAccess] → token kontrolü yok, doğrudan geç
            if (descriptor.MethodInfo.GetCustomAttributes(typeof(DirectAccessAttribute), true).Any()
                || descriptor.ControllerTypeInfo.GetCustomAttributes(typeof(DirectAccessAttribute), true).Any())
                return;

            // Token al
            var token = context.HttpContext.Request.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(token) && token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                token = token["Bearer ".Length..].Trim();

            // SuperToken desteği (geliştiriciler için)
            if (!string.IsNullOrWhiteSpace(CoreConfig.superToken) && token == CoreConfig.superToken)
            {
                HttpContextHelper.SetUserInfo(1, GetClientIp(context.HttpContext), 1);
                return;
            }

            if (string.IsNullOrWhiteSpace(token))
            {
                SetUnauthorized(context, "Token bulunamadı");
                return;
            }

            try
            {
                var tokenData = _authManager.TokenDogrula(token);
                var userId = tokenData.kisiDto?.id ?? 0;
                var tenantId = tokenData.kisiDto?.tenantId ?? 0;
                HttpContextHelper.SetUserInfo(userId, GetClientIp(context.HttpContext), tenantId );

                // [NoPermissionCheck] → sadece token doğrulaması yeterli
                if (descriptor.MethodInfo.GetCustomAttributes(typeof(NoPermissionCheckAttribute), true).Any()
                    || descriptor.ControllerTypeInfo.GetCustomAttributes(typeof(NoPermissionCheckAttribute), true).Any())
                    return;

                // Controller method yetki kontrolü
                var controllerAd = descriptor.ControllerName;
                var methodAd = descriptor.ActionName;

                if (!_yetkiManager.ControllerMethodYetkisiVarMi(userId, controllerAd, methodAd))
                {
                    SetForbidden(context, $"Bu işlem için yetkiniz bulunmamaktadır: {controllerAd}/{methodAd}");
                }
            }
            catch (AppException appEx)
            {
                SetUnauthorized(context, appEx.message);
            }
            catch (Exception ex)
            {
                AppLog.Error("[SecurityFilter] Token doğrulama hatası", ex);
                SetUnauthorized(context, "Kimlik doğrulama hatası");
            }
        }

        public void OnActionExecuted(ActionExecutedContext context) { }

        private static void SetUnauthorized(ActionExecutingContext context, string message)
        {
            var response = new ServiceResponse<object>
            {
                isSuccess = false,
                message = ServiceResponseMessageType.Error,
                error_message = new AppExceptionModel
                {
                    code = 401,
                    message = message,
                    messageHeader = "Yetkisiz Erişim"
                }
            };
            context.Result = new JsonResult(response) { StatusCode = 200 };
        }

        private static void SetForbidden(ActionExecutingContext context, string message)
        {
            var response = new ServiceResponse<object>
            {
                isSuccess = false,
                message = ServiceResponseMessageType.Error,
                error_message = new AppExceptionModel
                {
                    code = 403,
                    message = message,
                    messageHeader = "Erişim Engellendi"
                }
            };
            context.Result = new JsonResult(response) { StatusCode = 200 };
        }

        private static string GetClientIp(HttpContext context)
        {
            return context.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
        }
    }
}
