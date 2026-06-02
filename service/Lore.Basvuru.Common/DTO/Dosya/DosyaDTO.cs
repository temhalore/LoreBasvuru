using Lore.Basvuru.Common.DTO.Base;
using Newtonsoft.Json;

namespace Lore.Basvuru.Common.DTO.Dosya
{
    public class DosyaYuklemeResponseDTO
    {
        public long dosyaId { get; set; }
        public string dosyaEid { get; set; } = "";
        public string orijinalAd { get; set; } = "";
        public long dosyaBoyutu { get; set; }
        public string? mimeType { get; set; }
    }

    public class DosyaListeDTO : BaseDTO
    {
        [JsonIgnore]
        public long rawId { get; set; }
        public string OrijinalAd { get; set; } = "";
        public long DosyaBoyu { get; set; }
        public string? MimeType { get; set; }
        public DateTime YuklemeTarihi { get; set; }
        public long SoruId { get; set; }
        public string BoyutGoster => DosyaBoyu switch
        {
            < 1024 => $"{DosyaBoyu} B",
            < 1024 * 1024 => $"{DosyaBoyu / 1024.0:F1} KB",
            _ => $"{DosyaBoyu / (1024.0 * 1024):F1} MB"
        };
    }

    public class DosyaIndirmeDTO
    {
        public Stream stream { get; set; } = Stream.Null;
        public string orijinalAd { get; set; } = "";
        public string mimeType { get; set; } = "application/octet-stream";
    }
}
