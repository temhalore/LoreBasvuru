using Lore.Basvuru.Common.DTO.Base;
using Lore.Basvuru.Common.DTO.Security.Ekran;

namespace Lore.Basvuru.Common.DTO.Security.Widget
{
    public class WidgetDTO : BaseDTO
    {
        public long ekranId { get; set; }
        public string? ekranEid { get; set; }
        public string? ad { get; set; }
        public string? kod { get; set; }
        public string? aciklama { get; set; }
        public int siraNo { get; set; }
        public bool aktifMi { get; set; } = true;
    }

    public class ControllerMethodDTO : BaseDTO
    {
        public string? controllerAd { get; set; }
        public string? methodAd { get; set; }
        public string? httpTip { get; set; }
        public string? aciklama { get; set; }
    }

    public class WidgetCMBaglaReqDTO
    {
        public string? widgetEid { get; set; }
        public List<string>? controllerMethodEidler { get; set; }
    }

    public class KullaniciYetkiDTO
    {
        public List<EkranDTO>? ekranlar { get; set; }
        public List<string>? widgetKodlari { get; set; }
    }
}
