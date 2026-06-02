using Lore.Basvuru.Common.DTO.Form.FormBuild;

namespace Lore.Basvuru.Bal.Managers.Form.Interfaces
{
    public interface IKuralManager
    {
        List<KuralDTO> FormKurallariniGetir(long formId);
        KuralDTO KuralKaydet(KuralDTO dto);
        void KuralSil(long kuralId);
        Dictionary<long, List<KuralDTO>> KuralHaritasiGetir(long formId);
    }
}
