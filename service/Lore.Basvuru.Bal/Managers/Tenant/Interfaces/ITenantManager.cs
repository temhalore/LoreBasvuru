using Lore.Basvuru.Common.DTO.Base.Datatable;
using Lore.Basvuru.Common.DTO.Tenant;

namespace Lore.Basvuru.Bal.Managers.Tenant.Interfaces
{
    public interface ITenantManager
    {
        // Tenant
        List<TenantListDTO> TenantListesiGetir();
        TenantDTO TenantGetir(long tenantId);
        TenantDTO TenantKaydet(TenantDTO dto);
        void TenantSil(long tenantId);

        // Kullanıcı
        DatatableResponseDTO<KullaniciDTO> KullaniciListesiGetir(long tenantId, int pageNumber, int pageSize, string? aramaMetni);
        KullaniciDTO KullaniciKaydet(KullaniciKaydetReqDTO dto);
        void KullaniciSil(long userId);
        void SifreSifirla(SifreSifirlaReqDTO req);
        void KullaniciAktifPasif(long userId, bool aktifMi);
    }
}
