using Lore.Basvuru.Common.DTO.Form.FormBuild;
using Lore.Basvuru.Common.DTO.Form.FormRespondent;

namespace Lore.Basvuru.Bal.Managers.Form.Interfaces
{
    public interface IFormRespondentManager
    {
        BasvuruBaslatResponseDTO BasvuruBaslat(long formId, long userId);
        void CevapKaydet(CevapKaydetReqDTO req);
        void BasvuruTamamla(long basvuruId);
        List<KullaniciBasvuruListDTO> BasvurularimListele(long userId);
        BasvuruDetayDTO BasvuruDetayGetir(long basvuruId, long userId);
        void OncekiBasvurudanKopyala(long basvuruId, long kaynakBasvuruId);
        List<SelectItemDTO> ManuelSecenekleriGetir(long soruId);
    }
}
