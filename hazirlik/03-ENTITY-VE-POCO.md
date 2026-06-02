# 03 — Entity ve Poco Katmanı

## Genel Kural
- Tüm entity'ler `Lore.Basvuru.Dal/Model/Poco.cs` dosyasında tanımlanır
- Her entity `ModelBase`'den türer
- Dapper.Contrib `[Table]` attribute'u ile tablo adı belirtilir
- PK alan `[Key]` attribute'u alır
- Her property için enum tanımlanır (sort/where için güvenli erişim)

---

## ModelBase

```csharp
// Lore.Basvuru.Dal/Model/ModelBase.cs
using Lore.Basvuru.Common.Configuration;

namespace Lore.Basvuru.Dal.Model
{
    public class ModelBase
    {
        public bool IsNull()
        {
            var ID = (long)GetType().GetProperty(CoreConfig.IDProperty).GetValue(this);
            return ID == 0;
        }
    }
}
```

---

## Poco.cs — Tüm Entity'ler

```csharp
// Lore.Basvuru.Dal/Model/Poco.cs
// Bu dosya tüm entity'leri barındırır.
// Her entity için aynı pattern uygulanır.

using System;
using System.ComponentModel.DataAnnotations;
using Dapper.Contrib.Extensions;

namespace Lore.Basvuru.Dal.Model
{

    // ═══════════════════════════════════════
    // SİSTEM TABLOLARI
    // ═══════════════════════════════════════

    [Table("dbo.t_sis_tenant")]
    public partial class t_sis_tenant : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public string Ad { get; set; }
        [Required] public string Kod { get; set; }
        public string Aciklama { get; set; }
        public string LogoUrl { get; set; }
        public string WebSiteUrl { get; set; }
        [Required] public bool AktifMi { get; set; }
        [Required] public int PaketTipi { get; set; }
        public DateTime? PaketBitisTarih { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_sis_tenant_properties
    {
        Id, Ad, Kod, Aciklama, AktifMi, PaketTipi,
        CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

    // ─────────────────────────────────────────

    [Table("dbo.t_sis_user")]
    public partial class t_sis_user : ModelBase
    {
        [Key]
        public long Id { get; set; }
        public long? TenantId { get; set; }
        [Required] public string Ad { get; set; }
        [Required] public string Soyad { get; set; }
        public string Email { get; set; }
        public string Telefon { get; set; }
        public string TcKimlik { get; set; }
        public string KullaniciAdi { get; set; }
        public string ParolaHash { get; set; }
        public string ParolaTuz { get; set; }
        [Required] public bool AktifMi { get; set; }
        public DateTime? SonGirisTarih { get; set; }
        [Required] public int DogrulamaTipi { get; set; }
        public string DogrulamaKodu { get; set; }
        public DateTime? DogrulamaExpiry { get; set; }
        public string DisKullaniciId { get; set; }
        public string SSOProviderKod { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_sis_user_properties
    {
        Id, TenantId, Ad, Soyad, Email, Telefon, TcKimlik,
        KullaniciAdi, AktifMi, SonGirisTarih, DisKullaniciId, SSOProviderKod,
        CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

    // ─────────────────────────────────────────

    [Table("dbo.t_sis_user_token")]
    public partial class t_sis_user_token : ModelBase
    {
        [Key]
        public long Id { get; set; }
        public long? TenantId { get; set; }
        [Required] public long UserId { get; set; }
        [Required] public string Token { get; set; }
        public string RefreshToken { get; set; }
        [Required] public DateTime TokenExpiry { get; set; }
        public string IpAdresi { get; set; }
        public string UserAgent { get; set; }
        [Required] public bool AktifMi { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_sis_user_token_properties
    {
        Id, TenantId, UserId, Token, RefreshToken, TokenExpiry,
        AktifMi, CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

    // ─────────────────────────────────────────

    [Table("dbo.t_sis_rol")]
    public partial class t_sis_rol : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public string Ad { get; set; }
        [Required] public string Kod { get; set; }
        public string Aciklama { get; set; }
        [Required] public bool AktifMi { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_sis_rol_properties
    {
        Id, TenantId, Ad, Kod, Aciklama, AktifMi,
        CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

    // ─────────────────────────────────────────

    [Table("dbo.t_sis_login_provider")]
    public partial class t_sis_login_provider : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public int ProviderTip { get; set; }
        [Required] public string ProviderAd { get; set; }
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }
        public string AuthorityUrl { get; set; }
        public string RedirectUrl { get; set; }
        public string TokenValidateUrl { get; set; }
        public string EkParametreler { get; set; }
        [Required] public bool AktifMi { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_sis_login_provider_properties
    {
        Id, TenantId, ProviderTip, ProviderAd, AktifMi,
        CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

    // ═══════════════════════════════════════
    // FORM BUILDER TABLOLARI
    // ═══════════════════════════════════════

    [Table("dbo.t_frm_basvuru_form")]
    public partial class t_frm_basvuru_form : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public string Ad { get; set; }
        public string Aciklama { get; set; }
        public DateTime? BaslamaTarihi { get; set; }
        public DateTime? BitisTarihi { get; set; }
        [Required] public int Durum { get; set; }
        [Required] public bool LoginGerekliMi { get; set; }
        [Required] public bool AnonymousIzinliMi { get; set; }
        [Required] public bool CokluBasvuruIzinliMi { get; set; }
        public long? KopyalandiFormId { get; set; }
        public long? WorkflowId { get; set; }
        [Required] public bool BildirimAktifMi { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_frm_basvuru_form_properties
    {
        Id, TenantId, Ad, Aciklama, BaslamaTarihi, BitisTarihi, Durum,
        LoginGerekliMi, AnonymousIzinliMi, CokluBasvuruIzinliMi,
        KopyalandiFormId, WorkflowId, BildirimAktifMi,
        CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

    // ─────────────────────────────────────────

    [Table("dbo.t_frm_sayfa")]
    public partial class t_frm_sayfa : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long BasvuruFormId { get; set; }
        [Required] public string Ad { get; set; }
        public string Aciklama { get; set; }
        [Required] public int SiraNo { get; set; }
        [Required] public bool AktifMi { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_frm_sayfa_properties
    {
        Id, TenantId, BasvuruFormId, Ad, Aciklama, SiraNo, AktifMi,
        CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

    // ─────────────────────────────────────────

    [Table("dbo.t_frm_soru")]
    public partial class t_frm_soru : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long SayfaId { get; set; }
        [Required] public long BasvuruFormId { get; set; }
        [Required] public string Etiket { get; set; }
        public string AltMetin { get; set; }
        [Required] public int SoruTipi { get; set; }
        [Required] public bool ZorunluMu { get; set; }
        [Required] public int SiraNo { get; set; }
        public string GrupKodu { get; set; }
        public int? GrupMin { get; set; }
        public int? GrupMax { get; set; }
        [Required] public int KaynakTipi { get; set; }
        public long? KaynakId { get; set; }
        public string DegerValidasyonu { get; set; }
        [Required] public bool GizliMi { get; set; }
        [Required] public bool ReadOnlyMi { get; set; }
        public string EkBilgi { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_frm_soru_properties
    {
        Id, TenantId, SayfaId, BasvuruFormId, Etiket, AltMetin, SoruTipi,
        ZorunluMu, SiraNo, GrupKodu, KaynakTipi, KaynakId, GizliMi, ReadOnlyMi,
        CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

    // ─────────────────────────────────────────

    [Table("dbo.t_frm_soru_secenek")]
    public partial class t_frm_soru_secenek : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long SoruId { get; set; }
        [Required] public string EtiketTr { get; set; }
        public string EtiketEn { get; set; }
        [Required] public string Deger { get; set; }
        [Required] public int SiraNo { get; set; }
        [Required] public bool AktifMi { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_frm_soru_secenek_properties
    {
        Id, TenantId, SoruId, EtiketTr, EtiketEn, Deger, SiraNo, AktifMi,
        CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

    // ─────────────────────────────────────────

    [Table("dbo.t_frm_soru_kaynak")]
    public partial class t_frm_soru_kaynak : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public string Ad { get; set; }
        [Required] public string ServisUrl { get; set; }
        [Required] public string HttpMetodu { get; set; }
        public string HeaderlerJson { get; set; }
        public string RequestBodyJson { get; set; }
        [Required] public string EtiketAlan { get; set; }
        [Required] public string DegerAlan { get; set; }
        [Required] public bool CacheAktifMi { get; set; }
        public int? CacheSureDk { get; set; }
        [Required] public bool AktifMi { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_frm_soru_kaynak_properties
    {
        Id, TenantId, Ad, ServisUrl, HttpMetodu, EtiketAlan, DegerAlan,
        CacheAktifMi, AktifMi,
        CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

    // ─────────────────────────────────────────

    [Table("dbo.t_frm_kural")]
    public partial class t_frm_kural : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long BasvuruFormId { get; set; }
        [Required] public long HedefSoruId { get; set; }
        [Required] public int KuralTipi { get; set; }
        [Required] public string KosulJson { get; set; }
        [Required] public string EylemJson { get; set; }
        [Required] public bool AktifMi { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_frm_kural_properties
    {
        Id, TenantId, BasvuruFormId, HedefSoruId, KuralTipi,
        KosulJson, EylemJson, AktifMi,
        CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

    // ═══════════════════════════════════════
    // WORKFLOW TABLOLARI
    // ═══════════════════════════════════════

    [Table("dbo.t_wf_workflow")]
    public partial class t_wf_workflow : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public string Ad { get; set; }
        public string Aciklama { get; set; }
        [Required] public bool AktifMi { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_wf_workflow_properties
    {
        Id, TenantId, Ad, Aciklama, AktifMi,
        CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

    // ─────────────────────────────────────────

    [Table("dbo.t_wf_adim")]
    public partial class t_wf_adim : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long WorkflowId { get; set; }
        [Required] public string Ad { get; set; }
        public string Aciklama { get; set; }
        [Required] public int SiraNo { get; set; }
        [Required] public int AdimTipi { get; set; }
        [Required] public bool IlkAdimMi { get; set; }
        [Required] public bool SonAdimMi { get; set; }
        [Required] public bool OtomatikGecMi { get; set; }
        [Required] public bool BildirimGonderMi { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_wf_adim_properties
    {
        Id, TenantId, WorkflowId, Ad, Aciklama, SiraNo, AdimTipi,
        IlkAdimMi, SonAdimMi, OtomatikGecMi, BildirimGonderMi,
        CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

    // ═══════════════════════════════════════
    // BAŞVURU TABLOLARI
    // ═══════════════════════════════════════

    [Table("dbo.t_bsv_user_basvuru")]
    public partial class t_bsv_user_basvuru : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long BasvuruFormId { get; set; }
        [Required] public long UserId { get; set; }
        [Required] public int Durum { get; set; }
        public long? AktifAdimId { get; set; }
        public DateTime? BasvuruTarihi { get; set; }
        public DateTime? TamamlanmaTarih { get; set; }
        public string IpAdresi { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_bsv_user_basvuru_properties
    {
        Id, TenantId, BasvuruFormId, UserId, Durum, AktifAdimId,
        BasvuruTarihi, TamamlanmaTarih,
        CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

    // ─────────────────────────────────────────

    [Table("dbo.t_bsv_cevap")]
    public partial class t_bsv_cevap : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long UserBasvuruId { get; set; }
        [Required] public long SoruId { get; set; }
        public int? GrupNo { get; set; }
        public string CevapMetin { get; set; }
        public decimal? CevapSayi { get; set; }
        public DateTime? CevapTarih { get; set; }
        public string CevapJson { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_bsv_cevap_properties
    {
        Id, TenantId, UserBasvuruId, SoruId, GrupNo,
        CevapMetin, CevapSayi, CevapTarih, CevapJson,
        CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

    // ─────────────────────────────────────────

    [Table("dbo.t_bsv_dosya")]
    public partial class t_bsv_dosya : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long UserBasvuruId { get; set; }
        [Required] public long SoruId { get; set; }
        public int? GrupNo { get; set; }
        [Required] public string OrijinalAd { get; set; }
        [Required] public string MinioObjectKey { get; set; }
        [Required] public long DosyaBoyu { get; set; }
        public string MimeType { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_bsv_dosya_properties
    {
        Id, TenantId, UserBasvuruId, SoruId, GrupNo,
        OrijinalAd, MinioObjectKey, DosyaBoyu, MimeType,
        CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

    // ─────────────────────────────────────────

    [Table("dbo.t_bsv_wf_adim_durum")]
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
        public string Yorum { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_bsv_wf_adim_durum_properties
    {
        Id, TenantId, UserBasvuruId, WorkflowAdimId, Durum,
        IslemYapanId, IslemTarihi, Yorum,
        CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

    // ═══════════════════════════════════════
    // BAĞLANTI TABLOLARI
    // ═══════════════════════════════════════

    [Table("dbo.t_lnk_basvuru_link")]
    public partial class t_lnk_basvuru_link : ModelBase
    {
        [Key]
        public long Id { get; set; }
        [Required] public long TenantId { get; set; }
        [Required] public long HedefFormId { get; set; }
        [Required] public long KaynakFormId { get; set; }
        [Required] public int LinkTipi { get; set; }
        public string AciklamaMetni { get; set; }
        [Required] public bool AktifMi { get; set; }
        [Required] public long CreatedUser { get; set; }
        [Required] public DateTime CreatedDate { get; set; }
        [Required] public string CreatedIP { get; set; }
        public long? ModifiedUser { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string ModifiedIP { get; set; }
        [Required] public bool IsDeleted { get; set; }
    }

    public enum t_lnk_basvuru_link_properties
    {
        Id, TenantId, HedefFormId, KaynakFormId, LinkTipi, AktifMi,
        CreatedUser, CreatedDate, CreatedIP,
        ModifiedUser, ModifiedDate, ModifiedIP, IsDeleted
    }

} // namespace Lore.Basvuru.Dal.Model
```

---

## Enum Kullanım Örneği

```csharp
// Manager'da sırala/filtrele
var liste = _repo.GetList(
    $"{nameof(t_frm_soru_properties.BasvuruFormId)} = @formId AND {nameof(t_frm_soru_properties.IsDeleted)} = 0",
    new { formId },
    OrderOption.asc,
    t_frm_soru_properties.SiraNo
);
```
