using Lore.Basvuru.Bal.Managers.Form.Interfaces;
using Lore.Basvuru.Common.DTO.Form.FormRespondent;
using Lore.Basvuru.Common.Helpers;
using Lore.Basvuru.Service.Filters;
using Microsoft.AspNetCore.Mvc;

namespace Lore.Basvuru.Service.Controllers.Form
{
    public class FormRespondentController : BaseController
    {
        private readonly IFormRespondentManager _respondentManager;

        public FormRespondentController(IFormRespondentManager respondentManager)
        {
            _respondentManager = respondentManager;
        }

        [HttpPost]
        [NoPermissionCheck]
        public IActionResult BasvuruBaslat([FromQuery] string formEid)
        {
            var formId = CryptoHelper.DecryptLong(formEid);
            return Ok(_respondentManager.BasvuruBaslat(formId, CurrentUserId));
        }

        [HttpPost]
        [NoPermissionCheck]
        public IActionResult CevapKaydet([FromBody] CevapKaydetReqDTO req)
        {
            // req.basvuruEid.id → EidDTO tarafından otomatik decrypt edildi
            _respondentManager.CevapKaydet(req);
            return OkEmpty();
        }

        [HttpPost]
        [NoPermissionCheck]
        public IActionResult BasvuruTamamla([FromQuery] string basvuruEid)
        {
            _respondentManager.BasvuruTamamla(CryptoHelper.DecryptLong(basvuruEid));
            return OkEmpty();
        }

        [HttpGet]
        [NoPermissionCheck]
        public IActionResult BasvurularimListele()
            => Ok(_respondentManager.BasvurularimListele(CurrentUserId));

        [HttpGet]
        [NoPermissionCheck]
        public IActionResult BasvuruDetayGetir([FromQuery] string basvuruEid)
            => Ok(_respondentManager.BasvuruDetayGetir(
                CryptoHelper.DecryptLong(basvuruEid), CurrentUserId));

        [HttpPost]
        [NoPermissionCheck]
        public IActionResult OncekiBasvurudanKopyala([FromBody] KopyalaReqDTO req)
        {
            // EidDTO implicit long cast → req.basvuruEid.id, req.kaynakBasvuruEid.id
            _respondentManager.OncekiBasvurudanKopyala(
                req.basvuruEid.id,
                req.kaynakBasvuruEid.id);
            return OkEmpty();
        }

        [HttpGet]
        [NoPermissionCheck]
        public IActionResult ManuelSecenekleriGetir([FromQuery] string soruEid)
            => Ok(_respondentManager.ManuelSecenekleriGetir(CryptoHelper.DecryptLong(soruEid)));
    }
}
