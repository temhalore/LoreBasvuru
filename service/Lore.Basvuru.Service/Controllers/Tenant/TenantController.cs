using Lore.Basvuru.Bal.Managers.Tenant.Interfaces;
using Lore.Basvuru.Common.DTO.Tenant;
using Lore.Basvuru.Common.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace Lore.Basvuru.Service.Controllers.Tenant
{
    public class TenantController : BaseController
    {
        private readonly ITenantManager _tenantManager;

        public TenantController(ITenantManager tenantManager)
        {
            _tenantManager = tenantManager;
        }

        // ── TENANT ────────────────────────────────────────────────

        [HttpGet]
        public IActionResult TenantListesiGetir()
            => Ok(_tenantManager.TenantListesiGetir());

        [HttpGet]
        public IActionResult TenantGetir([FromQuery] string eid)
            => Ok(_tenantManager.TenantGetir(CryptoHelper.DecryptLong(eid)));

        [HttpPost]
        public IActionResult TenantKaydet([FromBody] TenantDTO dto)
            => Ok(_tenantManager.TenantKaydet(dto));

        [HttpDelete]
        public IActionResult TenantSil([FromQuery] string eid)
        {
            _tenantManager.TenantSil(CryptoHelper.DecryptLong(eid));
            return OkEmpty();
        }

        // ── KULLANICI ─────────────────────────────────────────────

        [HttpGet]
        public IActionResult KullaniciListesiGetir(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? aramaMetni = null)
            => Ok(_tenantManager.KullaniciListesiGetir(CurrentTenantId, pageNumber, pageSize, aramaMetni));

        [HttpPost]
        public IActionResult KullaniciKaydet([FromBody] KullaniciKaydetReqDTO req)
        {
            req.tenantId = CurrentTenantId;
            return Ok(_tenantManager.KullaniciKaydet(req));
        }

        [HttpDelete]
        public IActionResult KullaniciSil([FromQuery] string eid)
        {
            _tenantManager.KullaniciSil(CryptoHelper.DecryptLong(eid));
            return OkEmpty();
        }

        [HttpPost]
        public IActionResult SifreSifirla([FromBody] SifreSifirlaReqDTO req)
        {
            _tenantManager.SifreSifirla(req);
            return OkEmpty();
        }

        [HttpPost]
        public IActionResult KullaniciAktifPasif([FromQuery] string eid, [FromQuery] bool aktifMi)
        {
            _tenantManager.KullaniciAktifPasif(CryptoHelper.DecryptLong(eid), aktifMi);
            return OkEmpty();
        }
    }
}
