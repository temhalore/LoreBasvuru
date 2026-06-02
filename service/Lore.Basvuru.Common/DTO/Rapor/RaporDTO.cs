using Lore.Basvuru.Common.DTO.Base;
using Lore.Basvuru.Common.Helpers;
using Newtonsoft.Json;

namespace Lore.Basvuru.Common.DTO.Rapor
{
    public class BasvuruRaporFiltreDTO
    {
        public long? formId { get; set; }
        public int? durum { get; set; }
        public DateTime? baslangicTarihi { get; set; }
        public DateTime? bitisTarihi { get; set; }
        public string? aramaMetni { get; set; }
        public int pageNumber { get; set; } = 1;
        public int pageSize { get; set; } = 20;
    }

    public class BasvuruRaporSatirDTO : BaseDTO
    {
        [JsonIgnore]
        public long rawId { get; set; }
        public int Durum { get; set; }
        public DateTime? BaslamaTarihi { get; set; }
        public DateTime? TamamlamaTarihi { get; set; }
        public string FormAd { get; set; } = "";
        public string KullaniciAdSoyad { get; set; } = "";
        public string? KullaniciEmail { get; set; }
        public string? TcKimlik { get; set; }
        public int IslemSayisi { get; set; }
    }

    public class AdminBasvuruDetayDTO : BaseDTO
    {
        public int Durum { get; set; }
        public DateTime? BaslamaTarihi { get; set; }
        public DateTime? TamamlamaTarihi { get; set; }
        public string FormAd { get; set; } = "";
        public string KullaniciAdSoyad { get; set; } = "";
        public string? Email { get; set; }
        public string? Telefon { get; set; }
        public string? TcKimlik { get; set; }
        public List<AdminCevapDTO>? cevaplar { get; set; }
        public List<WorkflowGecmisDTO>? workflowGecmisi { get; set; }
    }

    public class AdminCevapDTO
    {
        public string SoruEtiket { get; set; } = "";
        public int SoruTipi { get; set; }
        public int SiraNo { get; set; }
        public string? Deger { get; set; }
        public string? DegerJson { get; set; }
        public int SayfaSiraNo { get; set; }
        public string? SayfaAd { get; set; }
        // Frontend'e de gönderilir — görüntüleme için hazır değer
        public string GosterilecekDeger => !string.IsNullOrEmpty(Deger) ? Deger : DegerJson ?? "";
    }

    public class FormIstatistikDTO
    {
        public int ToplamBasvuru { get; set; }
        public int Taslak { get; set; }
        public int Tamamlandi { get; set; }
        public int Onaylandi { get; set; }
        public int Reddedildi { get; set; }
        public DateTime? IlkBasvuruTarihi { get; set; }
        public DateTime? SonBasvuruTarihi { get; set; }
    }

    public class DurumGuncelleReqDTO
    {
        public string basvuruEid { get; set; } = "";
        public int yeniDurum { get; set; }
        public string? aciklama { get; set; }
    }

    public class SoruKolonDTO
    {
        public long soruId { get; set; }
        public string etiket { get; set; } = "";
        public int SoruTipi { get; set; }
        public int SiraNo { get; set; }
        public int sayfaSiraNo { get; set; }
    }

    public class WorkflowGecmisDTO
    {
        public int IslemTipi { get; set; }
        public string? Aciklama { get; set; }
        public DateTime IslemTarihi { get; set; }
        public string? IslemYapan { get; set; }
        public string? AdimAd { get; set; }
        public string IslemTipiAd => IslemTipi switch
        {
            1 => "Onaylandı",
            2 => "Reddedildi",
            3 => "İade Edildi",
            _ => "Bilinmiyor"
        };
    }
}
