using Lore.Basvuru.Common.DTO.Base;
using Lore.Basvuru.Common.DTO.Security.Ekran;

namespace Lore.Basvuru.Common.DTO.Security.Rol
{
    public class RolDTO : BaseDTO
    {
        public long tenantId { get; set; }
        public string? ad { get; set; }
        public string? kod { get; set; }
        public long? ustRolId { get; set; }
        public string? aciklama { get; set; }
        public bool aktifMi { get; set; } = true;
        public List<EkranDTO>? ekranlar { get; set; }
        public List<string>? widgetKodlari { get; set; }
    }

    public class RolEkranYetkisiReqDTO
    {
        public string? rolEid { get; set; }
        public List<string>? ekranEidler { get; set; }
    }

    public class RolWidgetYetkisiReqDTO
    {
        public string? rolEid { get; set; }
        public List<string>? widgetEidler { get; set; }
    }

    public class KullaniciRolAtaReqDTO
    {
        public string? kullaniciEid { get; set; }
        public string? rolEid { get; set; }
        public long tenantId { get; set; }
    }
}
