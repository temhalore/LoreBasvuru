using Lore.Basvuru.Common.DTO.Security.Ekran;
using Lore.Basvuru.Common.DTO.Security.Rol;
using Lore.Basvuru.Common.DTO.Security.Widget;

namespace Lore.Basvuru.Bal.Managers.Security.Interfaces
{
    public interface IYetkiManager
    {
        // Ekran
        List<EkranDTO> TumEkranlariGetir();
        EkranDTO EkranKaydet(EkranDTO dto);
        void EkranSil(long ekranId);

        // Widget
        List<WidgetDTO> EkranWidgetlariniGetir(long ekranId);
        WidgetDTO WidgetKaydet(WidgetDTO dto);
        void WidgetSil(long widgetId);

        // ControllerMethod
        List<ControllerMethodDTO> ControllerMethodleriGetir();
        void ControllerMethodleriTara();
        void WidgetControllerMethodBagla(long widgetId, List<long> methodIds);

        // Rol
        List<RolDTO> TenantRolleriniGetir(long tenantId);
        RolDTO RolKaydet(RolDTO dto);
        void RolSil(long rolId);
        void RolEkranYetkisiKaydet(long rolId, List<long> ekranIds);
        void RolWidgetYetkisiKaydet(long rolId, List<long> widgetIds);

        // Kullanıcı-Rol
        void KullaniciRolAta(long userId, long rolId, long tenantId);
        void KullaniciRolKaldir(long userId, long rolId);

        // Yetki kontrol
        bool ControllerMethodYetkisiVarMi(long userId, string controller, string method);
        List<EkranDTO> KullaniciEkranlariniGetir(long userId, long tenantId);
        List<string> KullaniciWidgetKodlariniGetir(long userId, long tenantId);
    }
}
