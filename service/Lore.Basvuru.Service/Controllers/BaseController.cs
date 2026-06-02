using Lore.Basvuru.Common.Helpers;
using Lore.Basvuru.Common.Models.ServiceResponse;
using Microsoft.AspNetCore.Mvc;

namespace Lore.Basvuru.Service.Controllers
{
    [ApiController]
    [Route("api/[controller]/[action]")]
    public abstract class BaseController : ControllerBase
    {
        protected long CurrentUserId => HttpContextHelper.GetUserId();
        protected long CurrentTenantId => HttpContextHelper.GetTenantId();

        protected IActionResult Ok<T>(T data)
            => base.Ok(new ServiceResponse<T>(data));

        protected IActionResult OkEmpty()
            => base.Ok(new ServiceResponse<object>(new { }));
    }
}
