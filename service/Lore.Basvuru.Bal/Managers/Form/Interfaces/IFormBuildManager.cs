using Lore.Basvuru.Common.DTO.Base.Datatable;
using Lore.Basvuru.Common.DTO.Form.Common;
using Lore.Basvuru.Common.DTO.Form.FormBuild;

namespace Lore.Basvuru.Bal.Managers.Form.Interfaces
{
    public interface IFormBuildManager
    {
        // Form
        DatatableResponseDTO<BasvuruFormListDTO> FormListesiGetir(int pageNumber, int pageSize, long tenantId, string? aramaMetni);
        BasvuruFormDTO FormGetir(long formId);
        BasvuruFormDTO FormKaydet(BasvuruFormDTO dto);
        void FormSil(long formId);
        void FormYayinla(long formId);
        void FormKopyala(long formId, long tenantId);

        // Sayfa
        List<SayfaDTO> SayfaListesiGetir(long formId);
        SayfaDTO SayfaKaydet(SayfaDTO dto);
        void SayfaSil(long sayfaId);

        // Soru
        List<SoruDTO> SoruListesiGetir(long sayfaId);
        SoruDTO SoruKaydet(SoruDTO dto);
        void SoruSil(long soruId);
        void SoruSiraGuncelle(List<SiraGuncelleDTO> req);
    }
}
