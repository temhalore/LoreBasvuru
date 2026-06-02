using Lore.Basvuru.Bal.Managers.Form.Interfaces;
using Lore.Basvuru.Common.DTO.Form.FormBuild;
using Lore.Basvuru.Common.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace Lore.Basvuru.Service.Controllers.Form
{
    public class KuralController : BaseController
    {
        private readonly IKuralManager _kuralManager;

        public KuralController(IKuralManager kuralManager)
        {
            _kuralManager = kuralManager;
        }

        [HttpGet]
        public IActionResult FormKurallariniGetir([FromQuery] string formEid)
            => Ok(_kuralManager.FormKurallariniGetir(CryptoHelper.DecryptLong(formEid)));

        [HttpPost]
        public IActionResult KuralKaydet([FromBody] KuralDTO dto)
            => Ok(_kuralManager.KuralKaydet(dto));

        [HttpDelete]
        public IActionResult KuralSil([FromQuery] string eid)
        {
            _kuralManager.KuralSil(CryptoHelper.DecryptLong(eid));
            return OkEmpty();
        }
    }
}
