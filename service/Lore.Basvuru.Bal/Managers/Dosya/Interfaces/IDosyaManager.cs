using Lore.Basvuru.Common.DTO.Dosya;
using Microsoft.AspNetCore.Http;

namespace Lore.Basvuru.Bal.Managers.Dosya.Interfaces
{
    public interface IDosyaManager
    {
        Task<DosyaYuklemeResponseDTO> DosyaYukle(IFormFile dosya, long basvuruId, long soruId);
        Task<DosyaIndirmeDTO> DosyaIndir(long dosyaId);
        void DosyaSil(long dosyaId);
        List<DosyaListeDTO> BasvuruDosyalariniGetir(long basvuruId);
    }
}
