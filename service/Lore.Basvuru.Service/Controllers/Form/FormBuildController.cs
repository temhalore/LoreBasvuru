using Lore.Basvuru.Bal.Managers.Form.Interfaces;
using Lore.Basvuru.Common.DTO.Form.FormBuild;
using Lore.Basvuru.Common.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace Lore.Basvuru.Service.Controllers.Form
{
    public class FormBuildController : BaseController
    {
        private readonly IFormBuildManager _formBuildManager;

        public FormBuildController(IFormBuildManager formBuildManager)
        {
            _formBuildManager = formBuildManager;
        }

        // ── FORM ──────────────────────────────────────────────────

        [HttpGet]
        public IActionResult FormListesiGetir(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? aramaMetni = null)
            => Ok(_formBuildManager.FormListesiGetir(pageNumber, pageSize, CurrentTenantId, aramaMetni));

        [HttpGet]
        public IActionResult FormGetir([FromQuery] string eid)
            => Ok(_formBuildManager.FormGetir(CryptoHelper.DecryptLong(eid)));

        [HttpPost]
        public IActionResult FormKaydet([FromBody] Lore.Basvuru.Common.DTO.Form.Common.BasvuruFormDTO dto)
            => Ok(_formBuildManager.FormKaydet(dto));

        [HttpDelete]
        public IActionResult FormSil([FromQuery] string eid)
        {
            _formBuildManager.FormSil(CryptoHelper.DecryptLong(eid));
            return OkEmpty();
        }

        [HttpPost]
        public IActionResult FormYayinla([FromQuery] string eid)
        {
            _formBuildManager.FormYayinla(CryptoHelper.DecryptLong(eid));
            return OkEmpty();
        }

        [HttpPost]
        public IActionResult FormKopyala([FromQuery] string eid)
        {
            _formBuildManager.FormKopyala(CryptoHelper.DecryptLong(eid), CurrentTenantId);
            return OkEmpty();
        }

        // ── SAYFA ─────────────────────────────────────────────────

        [HttpGet]
        public IActionResult SayfaListesiGetir([FromQuery] string formEid)
            => Ok(_formBuildManager.SayfaListesiGetir(CryptoHelper.DecryptLong(formEid)));

        [HttpPost]
        public IActionResult SayfaKaydet([FromBody] SayfaDTO dto)
            => Ok(_formBuildManager.SayfaKaydet(dto));

        [HttpDelete]
        public IActionResult SayfaSil([FromQuery] string eid)
        {
            _formBuildManager.SayfaSil(CryptoHelper.DecryptLong(eid));
            return OkEmpty();
        }

        // ── SORU ──────────────────────────────────────────────────

        [HttpGet]
        public IActionResult SoruListesiGetir([FromQuery] string sayfaEid)
            => Ok(_formBuildManager.SoruListesiGetir(CryptoHelper.DecryptLong(sayfaEid)));

        [HttpPost]
        public IActionResult SoruKaydet([FromBody] SoruDTO dto)
            => Ok(_formBuildManager.SoruKaydet(dto));

        [HttpDelete]
        public IActionResult SoruSil([FromQuery] string eid)
        {
            _formBuildManager.SoruSil(CryptoHelper.DecryptLong(eid));
            return OkEmpty();
        }

        [HttpPost]
        public IActionResult SoruSiraGuncelle([FromBody] List<SiraGuncelleDTO> req)
        {
            _formBuildManager.SoruSiraGuncelle(req);
            return OkEmpty();
        }
    }
}
