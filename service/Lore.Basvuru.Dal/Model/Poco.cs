using Dapper.Contrib.Extensions;
using System.ComponentModel.DataAnnotations;
using KeyAttribute = Dapper.Contrib.Extensions.KeyAttribute;

namespace Lore.Basvuru.Dal.Model
{
    // ═══════════════════════════════════════════════════════════
    // SİSTEM TABLOLARI (t_sis_)
    // ═══════════════════════════════════════════════════════════

    [Table("t_sis_tenant")]
    public partial class t_sis_tenant : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public string Ad { get; set; } = string.Empty;
        [Required] public string Kod { get; set; } = string.Empty;
        public string? Aciklama { get; set; }
        public string? LogoUrl { get; set; }
        public string? WebSiteUrl { get; set; }
        [Required] public bool AktifMi { get; set; } = true;
        [Required] public int PaketTipi { get; set; } = 1;
        public DateTime? PaketBitisTarih { get; set; }
        public string? TalendAuthUrl { get; set; }
        public string? TalendClientId { get; set; }
        public string? TalendClientSecret { get; set; }
        public string? TalendIssuer { get; set; }
        public string? TalendJwksUrl { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_sis_tenant_properties { Id, Ad, Kod, AktifMi, PaketTipi, CreatedUser, CreatedDate, CreatedIP, IsDeleted }

    [Table("t_sis_user")]
    public partial class t_sis_user : ModelBase
    {
        [Key]
        public long Id { get; set; }
        public long? TenantId { get; set; }
        [Required] public string Ad { get; set; } = string.Empty;
        [Required] public string Soyad { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Telefon { get; set; }
        public string? TcKimlik { get; set; }
        public string? KullaniciAdi { get; set; }
        public string? ParolaHash { get; set; }
        public string? ParolaTuz { get; set; }
        [Required] public bool AktifMi { get; set; } = true;
        public DateTime? SonGirisTarih { get; set; }
        [Required] public int DogrulamaTipi { get; set; } = 1;
        public string? DogrulamaKodu { get; set; }
        public DateTime? DogrulamaExpiry { get; set; }
        public string? DisKullaniciId { get; set; }
        public string? SSOProviderKod { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_sis_user_properties { Id, TenantId, Ad, Soyad, Email, Telefon, TcKimlik, KullaniciAdi, AktifMi, SonGirisTarih, DisKullaniciId, SSOProviderKod, CreatedUser, CreatedDate, CreatedIP, IsDeleted }

    [Table("t_sis_user_token")]
    public partial class t_sis_user_token : ModelBase
    {
        [Key]
        public long Id { get; set; }
        public long? TenantId { get; set; }
        [Required] public long UserId { get; set; }
        [Required] public string Token { get; set; } = string.Empty;
        public string? RefreshToken { get; set; }
        [Required] public DateTime TokenExpiry { get; set; }
        public string? IpAdresi { get; set; }
        public string? UserAgent { get; set; }
        [Required] public bool AktifMi { get; set; } = true;
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_sis_user_token_properties { Id, TenantId, UserId, Token, RefreshToken, TokenExpiry, AktifMi, CreatedUser, CreatedDate, CreatedIP, IsDeleted }

    [Table("t_sis_rol")]
    public partial class t_sis_rol : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public string Ad { get; set; } = string.Empty;
        public string? Kod { get; set; }
        public long? UstRolId { get; set; }
        public string? Aciklama { get; set; }
        [Required] public bool AktifMi { get; set; } = true;
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_sis_rol_properties { Id, TenantId, Ad, Kod, UstRolId, AktifMi, CreatedUser, CreatedDate, CreatedIP, IsDeleted }

    [Table("t_sis_user_rol")]
    public partial class t_sis_user_rol : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long UserId { get; set; }
        [Required] public long RolId { get; set; }
        [Required] public bool AktifMi { get; set; } = true;
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_sis_user_rol_properties { Id, TenantId, UserId, RolId, AktifMi, CreatedUser, CreatedDate, CreatedIP, IsDeleted }

    [Table("t_sis_login_provider")]
    public partial class t_sis_login_provider : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public int ProviderTip { get; set; }
        [Required] public string ProviderAd { get; set; } = string.Empty;
        public string? ClientId { get; set; }
        public string? ClientSecret { get; set; }
        public string? AuthorityUrl { get; set; }
        public string? RedirectUrl { get; set; }
        public string? TokenValidateUrl { get; set; }
        public string? EkParametreler { get; set; }
        [Required] public bool AktifMi { get; set; } = true;
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_sis_login_provider_properties { Id, TenantId, ProviderTip, ProviderAd, AktifMi, CreatedUser, CreatedDate, CreatedIP, IsDeleted }

    [Table("t_sis_otp")]
    public partial class t_sis_otp : ModelBase
    {
        [Key]
        public long Id { get; set; }
        public long? TenantId { get; set; }
        public long? UserId { get; set; }
        public string? Email { get; set; }
        public string? Telefon { get; set; }
        [Required] public string Kod { get; set; } = string.Empty;
        [Required] public int OtpTip { get; set; } = 1;
        [Required] public DateTime Expiry { get; set; }
        [Required] public bool KullanildiMi { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_sis_otp_properties { Id, TenantId, UserId, Email, Telefon, Kod, OtpTip, Expiry, KullanildiMi, CreatedUser, CreatedDate, CreatedIP, IsDeleted }

    // ── YETKİLENDİRME TABLOLARI ────────────────────────────────

    [Table("t_sis_ekran")]
    public partial class t_sis_ekran : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public string Ad { get; set; } = string.Empty;
        public string? Yol { get; set; }
        [Required] public string Kod { get; set; } = string.Empty;
        public long? UstEkranId { get; set; }
        [Required] public int SiraNo { get; set; }
        public string? Ikon { get; set; }
        [Required] public bool AktifMi { get; set; } = true;
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIpAdress { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIpAdress { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_sis_ekran_properties { Id, Ad, Yol, Kod, UstEkranId, SiraNo, AktifMi, CreatedUser, CreatedDate, CreatedIpAdress, IsDeleted }

    [Table("t_sis_widget")]
    public partial class t_sis_widget : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long EkranId { get; set; }
        [Required] public string Ad { get; set; } = string.Empty;
        [Required] public string Kod { get; set; } = string.Empty;
        public string? Aciklama { get; set; }
        [Required] public int SiraNo { get; set; }
        [Required] public bool AktifMi { get; set; } = true;
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIpAdress { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIpAdress { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_sis_widget_properties { Id, EkranId, Ad, Kod, Aciklama, SiraNo, AktifMi, CreatedUser, CreatedDate, CreatedIpAdress, IsDeleted }

    [Table("t_sis_controller_method")]
    public partial class t_sis_controller_method : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public string ControllerAd { get; set; } = string.Empty;
        [Required] public string MethodAd { get; set; } = string.Empty;
        public string? HttpTip { get; set; }
        public string? Aciklama { get; set; }
        [Required] public bool AktifMi { get; set; } = true;
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIpAdress { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIpAdress { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_sis_controller_method_properties { Id, ControllerAd, MethodAd, HttpTip, AktifMi, CreatedUser, CreatedDate, CreatedIpAdress, IsDeleted }

    [Table("t_sis_widget_controller_method")]
    public partial class t_sis_widget_controller_method : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long WidgetId { get; set; }
        [Required] public long ControllerMethodId { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIpAdress { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIpAdress { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    [Table("t_sis_rol_ekran")]
    public partial class t_sis_rol_ekran : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long RolId { get; set; }
        [Required] public long EkranId { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIpAdress { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIpAdress { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    [Table("t_sis_rol_widget")]
    public partial class t_sis_rol_widget : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long RolId { get; set; }
        [Required] public long WidgetId { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIpAdress { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIpAdress { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    // ═══════════════════════════════════════════════════════════
    // FORM BUILDER TABLOLARI (t_frm_)
    // ═══════════════════════════════════════════════════════════

    [Table("t_frm_basvuru_form")]
    public partial class t_frm_basvuru_form : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public string Ad { get; set; } = string.Empty;
        public string? Aciklama { get; set; }
        public DateTime? BaslamaTarihi { get; set; }
        public DateTime? BitisTarihi { get; set; }
        [Required] public int Durum { get; set; } = 1;
        [Required] public bool LoginGerekliMi { get; set; } = true;
        [Required] public bool AnonymousIzinliMi { get; set; }
        [Required] public bool CokluBasvuruIzinliMi { get; set; }
        public long? KopyalandiFormId { get; set; }
        public long? WorkflowId { get; set; }
        [Required] public bool BildirimAktifMi { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_frm_basvuru_form_properties { Id, TenantId, Ad, Aciklama, BaslamaTarihi, BitisTarihi, Durum, LoginGerekliMi, AnonymousIzinliMi, CokluBasvuruIzinliMi, KopyalandiFormId, WorkflowId, BildirimAktifMi, CreatedUser, CreatedDate, CreatedIP, IsDeleted }

    [Table("t_frm_basvuru_form_login_provider")]
    public partial class t_frm_basvuru_form_login_provider : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long BasvuruFormId { get; set; }
        [Required] public long LoginProviderId { get; set; }
        [Required] public int SiraNo { get; set; } = 1;
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    [Table("t_frm_sayfa")]
    public partial class t_frm_sayfa : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long BasvuruFormId { get; set; }
        [Required] public string Ad { get; set; } = string.Empty;
        public string? Aciklama { get; set; }
        [Required] public int SiraNo { get; set; } = 1;
        [Required] public bool AktifMi { get; set; } = true;
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_frm_sayfa_properties { Id, TenantId, BasvuruFormId, Ad, Aciklama, SiraNo, AktifMi, CreatedUser, CreatedDate, CreatedIP, IsDeleted }

    [Table("t_frm_soru")]
    public partial class t_frm_soru : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long SayfaId { get; set; }
        [Required] public long BasvuruFormId { get; set; }
        [Required] public string Etiket { get; set; } = string.Empty;
        public string? AltMetin { get; set; }
        [Required] public int SoruTipi { get; set; }
        [Required] public bool ZorunluMu { get; set; }
        [Required] public int SiraNo { get; set; } = 1;
        public string? GrupKodu { get; set; }
        public int? GrupMin { get; set; }
        public int? GrupMax { get; set; }
        [Required] public int KaynakTipi { get; set; } = 1;
        public long? KaynakId { get; set; }
        public string? DegerValidasyonu { get; set; }
        [Required] public bool GizliMi { get; set; }
        [Required] public bool ReadOnlyMi { get; set; }
        public string? EkBilgi { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_frm_soru_properties { Id, TenantId, SayfaId, BasvuruFormId, Etiket, SoruTipi, ZorunluMu, SiraNo, GrupKodu, KaynakTipi, KaynakId, GizliMi, ReadOnlyMi, CreatedUser, CreatedDate, CreatedIP, IsDeleted }

    [Table("t_frm_soru_secenek")]
    public partial class t_frm_soru_secenek : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long SoruId { get; set; }
        [Required] public string EtiketTr { get; set; } = string.Empty;
        public string? EtiketEn { get; set; }
        [Required] public string Deger { get; set; } = string.Empty;
        [Required] public int SiraNo { get; set; } = 1;
        [Required] public bool AktifMi { get; set; } = true;
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_frm_soru_secenek_properties { Id, TenantId, SoruId, EtiketTr, Deger, SiraNo, AktifMi, CreatedUser, CreatedDate, CreatedIP, IsDeleted }

    [Table("t_frm_soru_kaynak")]
    public partial class t_frm_soru_kaynak : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public string Ad { get; set; } = string.Empty;
        [Required] public string ServisUrl { get; set; } = string.Empty;
        [Required] public string HttpMetodu { get; set; } = "GET";
        public string? HeaderlerJson { get; set; }
        public string? RequestBodyJson { get; set; }
        [Required] public string EtiketAlan { get; set; } = "ad";
        [Required] public string DegerAlan { get; set; } = "id";
        [Required] public bool CacheAktifMi { get; set; }
        public int? CacheSureDk { get; set; }
        [Required] public bool AktifMi { get; set; } = true;
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    [Table("t_frm_kural")]
    public partial class t_frm_kural : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long BasvuruFormId { get; set; }
        [Required] public long HedefSoruId { get; set; }
        [Required] public int KuralTipi { get; set; }
        [Required] public string KosulJson { get; set; } = string.Empty;
        [Required] public string EylemJson { get; set; } = string.Empty;
        [Required] public bool AktifMi { get; set; } = true;
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    // ═══════════════════════════════════════════════════════════
    // WORKFLOW TABLOLARI (t_wf_)
    // ═══════════════════════════════════════════════════════════

    [Table("t_wf_workflow")]
    public partial class t_wf_workflow : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public string Ad { get; set; } = string.Empty;
        public string? Aciklama { get; set; }
        [Required] public bool AktifMi { get; set; } = true;
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_wf_workflow_properties { Id, TenantId, Ad, Aciklama, AktifMi, CreatedUser, CreatedDate, CreatedIP, IsDeleted }

    [Table("t_wf_adim")]
    public partial class t_wf_adim : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long WorkflowId { get; set; }
        [Required] public string Ad { get; set; } = string.Empty;
        public string? Aciklama { get; set; }
        [Required] public int SiraNo { get; set; } = 1;
        [Required] public int AdimTipi { get; set; } = 1;
        [Required] public bool IlkAdimMi { get; set; }
        [Required] public bool SonAdimMi { get; set; }
        [Required] public bool OtomatikGecMi { get; set; }
        [Required] public bool BildirimGonderMi { get; set; } = true;
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_wf_adim_properties { Id, TenantId, WorkflowId, Ad, SiraNo, AdimTipi, IlkAdimMi, SonAdimMi, OtomatikGecMi, CreatedUser, CreatedDate, CreatedIP, IsDeleted }

    [Table("t_wf_adim_rol")]
    public partial class t_wf_adim_rol : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long WorkflowAdimId { get; set; }
        [Required] public long RolId { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    [Table("t_wf_adim_rol_filtre")]
    public partial class t_wf_adim_rol_filtre : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long WorkflowAdimRolId { get; set; }
        [Required] public long SoruId { get; set; }
        [Required] public string Operator { get; set; } = string.Empty;
        [Required] public string FiltreJson { get; set; } = string.Empty;
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    // ═══════════════════════════════════════════════════════════
    // BAŞVURU TABLOLARI (t_bsv_)
    // ═══════════════════════════════════════════════════════════

    [Table("t_bsv_user_basvuru")]
    public partial class t_bsv_user_basvuru : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long BasvuruFormId { get; set; }
        [Required] public long UserId { get; set; }
        [Required] public int Durum { get; set; } = 1;
        public long? AktifAdimId { get; set; }
        public DateTime? BasvuruTarihi { get; set; }
        public DateTime? TamamlanmaTarih { get; set; }
        public string? IpAdresi { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_bsv_user_basvuru_properties { Id, TenantId, BasvuruFormId, UserId, Durum, AktifAdimId, BasvuruTarihi, TamamlanmaTarih, CreatedUser, CreatedDate, CreatedIP, IsDeleted }

    [Table("t_bsv_cevap")]
    public partial class t_bsv_cevap : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long UserBasvuruId { get; set; }
        [Required] public long SoruId { get; set; }
        public int? GrupNo { get; set; }
        public string? CevapMetin { get; set; }
        public decimal? CevapSayi { get; set; }
        public DateTime? CevapTarih { get; set; }
        public string? CevapJson { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
    public enum t_bsv_cevap_properties { Id, TenantId, UserBasvuruId, SoruId, GrupNo, CevapMetin, CevapSayi, CevapTarih, CevapJson, CreatedUser, CreatedDate, CreatedIP, IsDeleted }

    [Table("t_bsv_dosya")]
    public partial class t_bsv_dosya : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long UserBasvuruId { get; set; }
        [Required] public long SoruId { get; set; }
        public int? GrupNo { get; set; }
        [Required] public string OrijinalAd { get; set; } = string.Empty;
        [Required] public string MinioObjectKey { get; set; } = string.Empty;
        [Required] public long DosyaBoyu { get; set; }
        public string? MimeType { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    [Table("t_bsv_wf_adim_durum")]
    public partial class t_bsv_wf_adim_durum : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long UserBasvuruId { get; set; }
        [Required] public long WorkflowAdimId { get; set; }
        [Required] public int Durum { get; set; }
        public long? IslemYapanId { get; set; }
        public DateTime? IslemTarihi { get; set; }
        public string? Yorum { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    // ═══════════════════════════════════════════════════════════
    // BAĞLANTI TABLOLARI (t_lnk_)
    // ═══════════════════════════════════════════════════════════

    [Table("t_lnk_basvuru_link")]
    public partial class t_lnk_basvuru_link : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long HedefFormId { get; set; }
        [Required] public long KaynakFormId { get; set; }
        [Required] public int LinkTipi { get; set; }
        public string? AciklamaMetni { get; set; }
        [Required] public bool AktifMi { get; set; } = true;
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    [Table("t_lnk_basvuru_link_kural")]
    public partial class t_lnk_basvuru_link_kural : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long BasvuruLinkId { get; set; }
        [Required] public long SoruId { get; set; }
        [Required] public string Operator { get; set; } = string.Empty;
        [Required] public string KosulJson { get; set; } = string.Empty;
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    // ═══════════════════════════════════════════════════════════
    // LOG TABLOSU (t_log_)
    // ═══════════════════════════════════════════════════════════

    [Table("t_log_islem")]
    public partial class t_log_islem : ModelBase
    {
        [Key]
        public long Id { get; set; }
        public long? TenantId { get; set; }
        public long? UserId { get; set; }
        public string? Modul { get; set; }
        public string? Aksiyon { get; set; }
        public string? EntityTip { get; set; }
        public long? EntityId { get; set; }
        public string? Detay { get; set; }
        public string? IpAdresi { get; set; }
        [Required] public bool SonucBasariliMi { get; set; } = true;
        public string? HataMetni { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; } = string.Empty;
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }
}
