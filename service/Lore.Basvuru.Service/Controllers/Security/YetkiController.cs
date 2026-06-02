using Lore.Basvuru.Bal.Managers.Security.Interfaces;
using Lore.Basvuru.Common.DTO.Base;
using Lore.Basvuru.Common.DTO.Security.Ekran;
using Lore.Basvuru.Common.DTO.Security.Rol;
using Lore.Basvuru.Common.DTO.Security.Widget;
using Lore.Basvuru.Common.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace Lore.Basvuru.Service.Controllers.Security
{
    public class YetkiController : BaseController
    {
        private readonly IYetkiManager _yetkiManager;

        public YetkiController(IYetkiManager yetkiManager)
        {
            _yetkiManager = yetkiManager;
        }

        // ── EKRAN ─────────────────────────────────────────────────

        [HttpGet]
        public IActionResult TumEkranlariGetir()
            => Ok(_yetkiManager.TumEkranlariGetir());

        [HttpPost]
        public IActionResult EkranKaydet([FromBody] EkranDTO dto)
            => Ok(_yetkiManager.EkranKaydet(dto));

        [HttpDelete]
        public IActionResult EkranSil([FromQuery] string eid)
        {
            _yetkiManager.EkranSil(CryptoHelper.DecryptLong(eid));
            return OkEmpty();
        }

        // ── WIDGET ────────────────────────────────────────────────

        [HttpGet]
        public IActionResult EkranWidgetlariniGetir([FromQuery] string ekranEid)
        {
            var ekranId = CryptoHelper.DecryptLong(ekranEid);
            return Ok(_yetkiManager.EkranWidgetlariniGetir(ekranId));
        }

        [HttpPost]
        public IActionResult WidgetKaydet([FromBody] WidgetDTO dto)
            => Ok(_yetkiManager.WidgetKaydet(dto));

        [HttpDelete]
        public IActionResult WidgetSil([FromQuery] string eid)
        {
            _yetkiManager.WidgetSil(CryptoHelper.DecryptLong(eid));
            return OkEmpty();
        }

        // ── CONTROLLER METHOD ─────────────────────────────────────

        [HttpGet]
        public IActionResult ControllerMethodleriGetir()
            => Ok(_yetkiManager.ControllerMethodleriGetir());

        [HttpPost]
        public IActionResult ControllerMethodleriTara()
        {
            _yetkiManager.ControllerMethodleriTara();
            return OkEmpty();
        }

        [HttpPost]
        public IActionResult WidgetControllerMethodBagla([FromBody] WidgetMethodBaglaReqDTO req)
        {
            _yetkiManager.WidgetControllerMethodBagla(req.widgetId, req.methodIds);
            return OkEmpty();
        }

        // ── ROL ───────────────────────────────────────────────────

        [HttpGet]
        public IActionResult TenantRolleriniGetir()
            => Ok(_yetkiManager.TenantRolleriniGetir(CurrentTenantId));

        [HttpPost]
        public IActionResult RolKaydet([FromBody] RolDTO dto)
            => Ok(_yetkiManager.RolKaydet(dto));

        [HttpDelete]
        public IActionResult RolSil([FromQuery] string eid)
        {
            _yetkiManager.RolSil(CryptoHelper.DecryptLong(eid));
            return OkEmpty();
        }

        [HttpPost]
        public IActionResult RolEkranYetkisiKaydet([FromBody] RolYetkiReqDTO req)
        {
            _yetkiManager.RolEkranYetkisiKaydet(req.rolId, req.idler);
            return OkEmpty();
        }

        [HttpPost]
        public IActionResult RolWidgetYetkisiKaydet([FromBody] RolYetkiReqDTO req)
        {
            _yetkiManager.RolWidgetYetkisiKaydet(req.rolId, req.idler);
            return OkEmpty();
        }

        [HttpPost]
        public IActionResult KullaniciRolAta([FromBody] KullaniciRolReqDTO req)
        {
            _yetkiManager.KullaniciRolAta(req.userId, req.rolId, CurrentTenantId);
            return OkEmpty();
        }

        [HttpDelete]
        public IActionResult KullaniciRolKaldir([FromQuery] long userId, [FromQuery] long rolId)
        {
            _yetkiManager.KullaniciRolKaldir(userId, rolId);
            return OkEmpty();
        }
    }

    // ── İstek DTO'ları ─────────────────────────────────────────────
    public class WidgetMethodBaglaReqDTO
    {
        public long widgetId { get; set; }
        public List<long> methodIds { get; set; } = new();
    }

    public class RolYetkiReqDTO
    {
        public long rolId { get; set; }
        public List<long> idler { get; set; } = new();
    }

    public class KullaniciRolReqDTO
    {
        public long userId { get; set; }
        public long rolId { get; set; }
    }
}
