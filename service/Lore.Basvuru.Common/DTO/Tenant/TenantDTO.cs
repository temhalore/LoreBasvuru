using Lore.Basvuru.Common.DTO.Base;
using Newtonsoft.Json;

namespace Lore.Basvuru.Common.DTO.Tenant
{
    public class TenantDTO : BaseDTO
    {
        public string ad { get; set; } = "";
        public string kod { get; set; } = "";
        public string? aciklama { get; set; }
        public bool aktifMi { get; set; } = true;
        public string? logoUrl { get; set; }
        public string? temaRengi { get; set; }
        public string? iletisimEmail { get; set; }
        public string? iletisimTelefon { get; set; }
        public string? webSitesi { get; set; }
    }

    public class TenantListDTO : BaseDTO
    {
        public string ad { get; set; } = "";
        public string kod { get; set; } = "";
        public bool aktifMi { get; set; }
        public int kullaniciSayisi { get; set; }
        public int formSayisi { get; set; }
        public DateTime? createdDate { get; set; }
    }

    public class KullaniciDTO : BaseDTO
    {
        public long? tenantId { get; set; }
        public string? tenantEid { get; set; }
        public string ad { get; set; } = "";
        public string soyad { get; set; } = "";
        public string? email { get; set; }
        public string? telefon { get; set; }
        public string? tcKimlik { get; set; }
        public bool aktifMi { get; set; } = true;
        public string? kullaniciAdi { get; set; }
        public int dogrulamaTipi { get; set; }
    }

    public class KullaniciKaydetReqDTO
    {
        public string? eid { get; set; }
        public long? tenantId { get; set; }
        public string ad { get; set; } = "";
        public string soyad { get; set; } = "";
        public string? email { get; set; }
        public string? telefon { get; set; }
        public string kullaniciAdi { get; set; } = "";
        public string? parola { get; set; }
        public bool aktifMi { get; set; } = true;
        public int dogrulamaTipi { get; set; } = 1;
    }

    public class SifreSifirlaReqDTO
    {
        public string kullaniciEid { get; set; } = "";
        public string yeniParola { get; set; } = "";
    }
}
