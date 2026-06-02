using Lore.Basvuru.Common.DTO.Base;
using Lore.Basvuru.Common.Helpers;
using Newtonsoft.Json;

namespace Lore.Basvuru.Common.DTO.Form.FormBuild
{
    public class SayfaDTO : BaseDTO
    {
        public string? basvuruFormEid { get; set; }
        public long basvuruFormId { get; set; }
        public string ad { get; set; } = "";
        public string? aciklama { get; set; }
        public int siraNo { get; set; }
        public bool aktifMi { get; set; } = true;
        public List<SoruDTO>? sorular { get; set; }
    }

    public class SoruDTO : BaseDTO
    {
        public string? sayfaEid { get; set; }
        public long sayfaId { get; set; }
        public string? basvuruFormEid { get; set; }
        public long basvuruFormId { get; set; }
        public string etiket { get; set; } = "";
        public string? altMetin { get; set; }          // alt açıklama / placeholder
        public int soruTipi { get; set; }
        public int siraNo { get; set; }
        public bool zorunluMu { get; set; }
        public bool gizliMi { get; set; }
        public bool readOnlyMi { get; set; }
        public int kaynakTipi { get; set; } = 1;        // 1=Manuel, 2=GET, 3=POST, 4=DB
        public long? kaynakId { get; set; }
        public string? degerValidasyonu { get; set; }
        public string? ekBilgi { get; set; }
        public string? grupKodu { get; set; }
        public int? grupMin { get; set; }
        public int? grupMax { get; set; }
        public List<SecenekDTO>? secenekler { get; set; }
    }

    public class SecenekDTO : BaseDTO
    {
        public string? soruEid { get; set; }
        public long soruId { get; set; }
        public string deger { get; set; } = "";
        public string etiketTr { get; set; } = "";
        public string? etiketEn { get; set; }
        public int siraNo { get; set; }
        public bool aktifMi { get; set; } = true;
    }

    public class KuralDTO : BaseDTO
    {
        public string? basvuruFormEid { get; set; }
        public long basvuruFormId { get; set; }
        public long hedefSoruId { get; set; }       // bu kuralın tetiklendiği soru
        public int kuralTipi { get; set; }          // 1=Göster/Gizle, 2=Zorunlu/Opsiyonel
        public string kosulJson { get; set; } = "{}";
        public string eylemJson { get; set; } = "{}";
        public bool aktifMi { get; set; } = true;
    }

    public class SiraGuncelleDTO
    {
        public string eid { get; set; } = "";
        public int siraNo { get; set; }
    }

    public class SelectItemDTO
    {
        public string value { get; set; } = "";
        public string label { get; set; } = "";
        public string? group { get; set; }
        public bool disabled { get; set; }
    }

    public class DisServisConfig
    {
        public string url { get; set; } = "";
        public Dictionary<string, string>? headers { get; set; }
        public string? requestBody { get; set; }
        public string? dataPath { get; set; }
        public string? valueField { get; set; }
        public string? labelField { get; set; }
    }
}
