using Lore.Basvuru.Common.DTO.Base.Datatable;
using Lore.Basvuru.Common.DTO.Rapor;

namespace Lore.Basvuru.Bal.Managers.Rapor.Interfaces
{
    public interface IRaporManager
    {
        DatatableResponseDTO<BasvuruRaporSatirDTO> BasvuruListesiGetir(BasvuruRaporFiltreDTO filtre, long tenantId);
        AdminBasvuruDetayDTO AdminBasvuruDetayGetir(long basvuruId, long tenantId);
        byte[] CsvOlustur(BasvuruRaporFiltreDTO filtre, long tenantId);
        byte[] XmlOlustur(BasvuruRaporFiltreDTO filtre, long tenantId);
        FormIstatistikDTO FormIstatistikGetir(long formId, long tenantId);
        void DurumGuncelle(DurumGuncelleReqDTO req, long tenantId);
    }
}
