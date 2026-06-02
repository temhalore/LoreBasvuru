using Lore.Basvuru.Common.DTO.Base;

namespace Lore.Basvuru.Common.DTO.Form.Common
{
    public class BasvuruFormDTO : BaseDTO
    {
        public string? ad { get; set; }
        public string? aciklama { get; set; }
        public DateTime? baslamaTarihi { get; set; }
        public DateTime? bitisTarihi { get; set; }
        public int durum { get; set; }
        public string? durumAdi { get; set; }
        public bool loginGerekliMi { get; set; } = true;
        public bool anonymousIzinliMi { get; set; }
        public bool cokluBasvuruIzinliMi { get; set; }
        public string? kopyalandiFormEid { get; set; }
        public string? workflowEid { get; set; }
        public bool bildirimAktifMi { get; set; }
        public bool aktifMi { get; set; }
        public long tenantId { get; set; }
        public List<BasvuruSayfaDTO>? sayfalar { get; set; }
    }

    public class BasvuruSayfaDTO : BaseDTO
    {
        public string? formEid { get; set; }
        public string? ad { get; set; }
        public string? aciklama { get; set; }
        public int siraNo { get; set; }
        public bool aktifMi { get; set; } = true;
        public List<BasvuruSoruDTO>? sorular { get; set; }
    }

    public class BasvuruSoruDTO : BaseDTO
    {
        public string? sayfaEid { get; set; }
        public string? etiket { get; set; }
        public string? altMetin { get; set; }
        public int soruTipi { get; set; }
        public string? soruTipiAdi { get; set; }
        public bool zorunluMu { get; set; }
        public int siraNo { get; set; }
        public string? grupKodu { get; set; }
        public int? grupMin { get; set; }
        public int? grupMax { get; set; }
        public int kaynakTipi { get; set; } = 1;
        public string? kaynakEid { get; set; }
        public string? degerValidasyonuJson { get; set; }
        public bool gizliMi { get; set; }
        public bool readOnlyMi { get; set; }
        public string? ekBilgiJson { get; set; }
        public List<BasvuruSecenekDTO>? secenekler { get; set; }
    }

    public class BasvuruSecenekDTO : BaseDTO
    {
        public string? soruEid { get; set; }
        public string? etiketTr { get; set; }
        public string? etiketEn { get; set; }
        public string? deger { get; set; }
        public int siraNo { get; set; }
        public bool aktifMi { get; set; } = true;
    }

    public class BasvuruFormListDTO : BaseDTO
    {
        public string? ad { get; set; }
        public int durum { get; set; }
        public string? durumAdi { get; set; }
        public DateTime? baslamaTarihi { get; set; }
        public DateTime? bitisTarihi { get; set; }
        public DateTime createdDate { get; set; }
        public int basvuruSayisi { get; set; }
    }
}
