using Lore.Basvuru.Bal.Managers.Dosya.Interfaces;
using Lore.Basvuru.Common.Helpers;
using Lore.Basvuru.Service.Filters;
using Microsoft.AspNetCore.Mvc;

namespace Lore.Basvuru.Service.Controllers.Dosya
{
    public class DosyaController : BaseController
    {
        private readonly IDosyaManager _dosyaManager;

        public DosyaController(IDosyaManager dosyaManager)
        {
            _dosyaManager = dosyaManager;
        }

        [HttpPost]
        [NoPermissionCheck]
        public async Task<IActionResult> DosyaYukle(
            IFormFile dosya,
            [FromQuery] string basvuruEid,
            [FromQuery] string soruEid)
        {
            var basvuruId = CryptoHelper.DecryptLong(basvuruEid);
            var soruId = CryptoHelper.DecryptLong(soruEid);
            var result = await _dosyaManager.DosyaYukle(dosya, basvuruId, soruId);
            return Ok(result);
        }

        [HttpGet]
        [NoPermissionCheck]
        public async Task<IActionResult> DosyaIndir([FromQuery] string dosyaEid)
        {
            var dosyaId = CryptoHelper.DecryptLong(dosyaEid);
            var result = await _dosyaManager.DosyaIndir(dosyaId);
            return File(result.stream, result.mimeType,
                result.orijinalAd ?? "dosya");
        }

        [HttpDelete]
        [NoPermissionCheck]
        public IActionResult DosyaSil([FromQuery] string dosyaEid)
        {
            _dosyaManager.DosyaSil(CryptoHelper.DecryptLong(dosyaEid));
            return OkEmpty();
        }

        [HttpGet]
        [NoPermissionCheck]
        public IActionResult BasvuruDosyalariniGetir([FromQuery] string basvuruEid)
            => Ok(_dosyaManager.BasvuruDosyalariniGetir(
                CryptoHelper.DecryptLong(basvuruEid)));
    }
}
