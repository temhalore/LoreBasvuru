using Lore.Basvuru.Common.DTO.Base;
using Lore.Basvuru.Common.DTO.Security.Ekran;

namespace Lore.Basvuru.Common.DTO.Security.Auth
{
    public class KisiTokenDTO
    {
        public bool isLogin { get; set; }
        public string? appToken { get; set; }
        public DateTime expireDate { get; set; }
        public KisiDTO? kisiDto { get; set; }
        public List<EkranDTO>? ekranDtoList { get; set; }
        public List<string>? widgetKodlari { get; set; }
    }

    public class KisiDTO : BaseDTO
    {
        public string? ad { get; set; }
        public string? soyad { get; set; }
        public string? adSoyad => $"{ad} {soyad}".Trim();
        public string? email { get; set; }
        public string? telefon { get; set; }
        public long? tenantId { get; set; }
        public string? tenantAdi { get; set; }
    }

    public class LoginRequestDTO
    {
        public string? kullaniciAdi { get; set; }
        public string? parola { get; set; }
        public string? tenantKod { get; set; }
    }

    public class SSOLoginRequestDTO
    {
        public string? code { get; set; }
        public string? redirectUri { get; set; }
        public string? tenantKod { get; set; }
        public long tenantId { get; set; }
    }

    public class TalendTokenValidateResult
    {
        public bool IsValid { get; set; }
        public string? Email { get; set; }
        public string? Ad { get; set; }
        public string? Soyad { get; set; }
        public string? ExternalId { get; set; }
    }
}
