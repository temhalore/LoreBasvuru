using Lore.Basvuru.Common.DTO.Base;

namespace Lore.Basvuru.Common.DTO.Form.FormRespondent
{
    public class BasvuruBaslatResponseDTO
    {
        /// <summary>Backend: id set et → eid otomatik şifrelenir. Frontend sadece eid okur.</summary>
        public EidDTO basvuruEid { get; set; } = new();
        public string formAd { get; set; } = "";
        public int sayfaSayisi { get; set; }
    }

    public class CevapKaydetReqDTO
    {
        /// <summary>Frontend: { "eid": "abc123" } gönderir → id otomatik decrypt edilir.</summary>
        public EidDTO basvuruEid { get; set; } = new();
        public int sayfaNo { get; set; }
        public List<CevapItemDTO> cevaplar { get; set; } = new();
    }

    public class CevapItemDTO
    {
        public long soruId { get; set; }
        public string? cevapMetin { get; set; }         // text, select, date, vb.
        public decimal? cevapSayi { get; set; }          // number tipi sorular
        public DateTime? cevapTarih { get; set; }        // date/datetime tipi
        public string? cevapJson { get; set; }           // multiselect, address, table vb.
    }

    public class KopyalaReqDTO
    {
        public EidDTO basvuruEid { get; set; } = new();
        public EidDTO kaynakBasvuruEid { get; set; } = new();
    }

    public class DisServisSecenekReqDTO
    {
        public EidDTO soruEid { get; set; } = new();
        public string? aramaMetni { get; set; }
        public Dictionary<string, string>? ekParametreler { get; set; }
    }

    public class KullaniciBasvuruListDTO : BaseDTO
    {
        public int Durum { get; set; }
        public DateTime? BasvuruTarihi { get; set; }
        public DateTime? TamamlanmaTarih { get; set; }
        public string FormAd { get; set; } = "";
    }

    public class BasvuruDetayDTO : BaseDTO
    {
        public int Durum { get; set; }
        public DateTime? BasvuruTarihi { get; set; }
        public DateTime? TamamlanmaTarih { get; set; }
        public string FormAd { get; set; } = "";
        public string? FormAciklama { get; set; }
        public List<CevapDetayDTO>? cevaplar { get; set; }
    }

    public class CevapDetayDTO
    {
        public long SoruId { get; set; }
        public string? CevapMetin { get; set; }
        public decimal? CevapSayi { get; set; }
        public DateTime? CevapTarih { get; set; }
        public string? CevapJson { get; set; }
        public string SoruEtiket { get; set; } = "";
        public int SoruTipi { get; set; }
        // Görüntülenecek değer (frontend'e de gönderilir, sorun yok)
        public string GosterilecekDeger => CevapMetin
            ?? CevapSayi?.ToString()
            ?? CevapTarih?.ToString("dd.MM.yyyy")
            ?? CevapJson
            ?? "";
    }
}
