using Lore.Basvuru.Bal.Managers.Rapor.Interfaces;
using Lore.Basvuru.Common.DTO.Rapor;
using Lore.Basvuru.Common.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace Lore.Basvuru.Service.Controllers.Rapor
{
    public class RaporController : BaseController
    {
        private readonly IRaporManager _raporManager;

        public RaporController(IRaporManager raporManager)
        {
            _raporManager = raporManager;
        }

        [HttpPost]
        public IActionResult BasvuruListesiGetir([FromBody] BasvuruRaporFiltreDTO filtre)
            => Ok(_raporManager.BasvuruListesiGetir(filtre, CurrentTenantId));

        [HttpGet]
        public IActionResult AdminBasvuruDetayGetir([FromQuery] string basvuruEid)
            => Ok(_raporManager.AdminBasvuruDetayGetir(
                CryptoHelper.DecryptLong(basvuruEid), CurrentTenantId));

        [HttpPost]
        public IActionResult CsvIndir([FromBody] BasvuruRaporFiltreDTO filtre)
        {
            var bytes = _raporManager.CsvOlustur(filtre, CurrentTenantId);
            return File(bytes, "text/csv;charset=utf-8",
                $"basvurular_{DateTime.Now:yyyyMMdd_HHmm}.csv");
        }

        [HttpPost]
        public IActionResult XmlIndir([FromBody] BasvuruRaporFiltreDTO filtre)
        {
            var bytes = _raporManager.XmlOlustur(filtre, CurrentTenantId);
            return File(bytes, "application/xml",
                $"basvurular_{DateTime.Now:yyyyMMdd_HHmm}.xml");
        }

        [HttpGet]
        public IActionResult FormIstatistikGetir([FromQuery] string formEid)
            => Ok(_raporManager.FormIstatistikGetir(
                CryptoHelper.DecryptLong(formEid), CurrentTenantId));

        [HttpPost]
        public IActionResult DurumGuncelle([FromBody] DurumGuncelleReqDTO req)
        {
            _raporManager.DurumGuncelle(req, CurrentTenantId);
            return OkEmpty();
        }
    }
}
