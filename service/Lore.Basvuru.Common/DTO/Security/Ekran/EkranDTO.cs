using Lore.Basvuru.Common.DTO.Base;

namespace Lore.Basvuru.Common.DTO.Security.Ekran
{
    public class EkranDTO : BaseDTO
    {
        public string? ad { get; set; }
        public string? yol { get; set; }
        public string? kod { get; set; }
        public long? ustEkranId { get; set; }
        public int siraNo { get; set; }
        public string? ikon { get; set; }
        public bool aktifMi { get; set; } = true;
        public List<EkranDTO>? altEkranlar { get; set; }
    }
}
