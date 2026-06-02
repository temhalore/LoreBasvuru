using Lore.Basvuru.Bal.Managers.Security.Interfaces;
using Lore.Basvuru.Common.DTO.Security.Auth;
using Lore.Basvuru.Service.Filters;
using Microsoft.AspNetCore.Mvc;

namespace Lore.Basvuru.Service.Controllers.Security
{
    public class AuthController : BaseController
    {
        private readonly IAuthManager _authManager;

        public AuthController(IAuthManager authManager)
        {
            _authManager = authManager;
        }

        [HttpPost]
        [DirectAccess]
        public IActionResult Login([FromBody] LoginRequestDTO request)
        {
            var result = _authManager.Login(request);
            return Ok(result);
        }

        [HttpPost]
        [NoPermissionCheck]
        public IActionResult Logout()
        {
            var token = Request.Headers["Authorization"].FirstOrDefault() ?? "";
            if (token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                token = token["Bearer ".Length..].Trim();
            _authManager.Logout(token);
            return OkEmpty();
        }

        [HttpGet]
        [NoPermissionCheck]
        public IActionResult TokenDogrula()
        {
            var token = Request.Headers["Authorization"].FirstOrDefault() ?? "";
            if (token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                token = token["Bearer ".Length..].Trim();
            var result = _authManager.TokenDogrula(token);
            return Ok(result);
        }
    }
}
