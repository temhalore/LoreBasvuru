using Lore.Basvuru.Common.DTO.Base;
using Newtonsoft.Json;

namespace Lore.Basvuru.Common.DTO.Workflow
{
    public class WorkflowDTO : BaseDTO
    {
        public string? basvuruFormEid { get; set; }
        public long basvuruFormId { get; set; }
        public string ad { get; set; } = "";
        public string? aciklama { get; set; }
        public bool aktifMi { get; set; } = true;
        public List<WorkflowAdimDTO>? adimlar { get; set; }
    }

    public class WorkflowAdimDTO : BaseDTO
    {
        public string? workflowEid { get; set; }
        public long workflowId { get; set; }
        public string ad { get; set; } = "";
        public string? aciklama { get; set; }
        public int siraNo { get; set; }
        public int adimTipi { get; set; } // 1=Onay, 2=Bilgi, 3=İade
        public bool ilkAdimMi { get; set; }
        public bool sonAdimMi { get; set; }
        public bool otomatikGecMi { get; set; }
        public List<WorkflowAdimRolDTO>? roller { get; set; }
    }

    public class WorkflowAdimRolDTO : BaseDTO
    {
        public long workflowAdimId { get; set; }
        public long rolId { get; set; }
        public string? rolAd { get; set; }
    }

    public class AdimRolAtaReqDTO
    {
        public long adimId { get; set; }
        public List<long> rolIdler { get; set; } = new();
    }

    public class AdimRolFiltreReqDTO
    {
        public long id { get; set; }
        public long adimRolId { get; set; }
        public long soruId { get; set; }
        public string operator_ { get; set; } = "";
        public object? filtreDegerleri { get; set; }
    }

    public class WorkflowAdimIslemReqDTO
    {
        /// <summary>Frontend: { "eid": "abc" } → id otomatik decrypt.</summary>
        public EidDTO userBasvuruEid { get; set; } = new();
        public EidDTO adimEid { get; set; } = new();
        public int islemTipi { get; set; } // 2=Onayla, 3=Reddet, 4=İade
        public string? yorum { get; set; }
    }

    public class BasvuruOnayListDTO : BaseDTO
    {
        // rawId: Dapper SQL map'i için; frontend'e gönderilmez — JsonIgnore korunur
        [JsonIgnore]
        public long rawId { get; set; }
        public long aktifAdimId { get; set; }
        public int Durum { get; set; }
        public DateTime? BasvuruTarihi { get; set; }
        public string FormAdi { get; set; } = "";
        public string BasvuranAdSoyad { get; set; } = "";
        public string? Email { get; set; }
        public string? AktifAdimAdi { get; set; }
    }

    public class BasvuruOnayFiltrDTO
    {
        public long? formId { get; set; }
        public int? durum { get; set; }
        public string? aramaMetni { get; set; }
    }

    public class WorkflowAdimDurumDTO : BaseDTO
    {
        public long WorkflowAdimId { get; set; }
        public int Durum { get; set; }
        public DateTime IslemTarihi { get; set; }
        public string? Yorum { get; set; }
        public string AdimAdi { get; set; } = "";
        public int SiraNo { get; set; }
        public string? IslemYapan { get; set; }
    }
}
