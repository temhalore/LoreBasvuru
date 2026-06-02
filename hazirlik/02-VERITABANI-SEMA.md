# 02 — Veritabanı Şema Tasarımı

## Tablo Prefix Sözleşmesi
| Prefix | Domain |
|--------|--------|
| `t_sis_` | Sistem (kullanıcı, rol, tenant, token) |
| `t_frm_` | Form Builder (form, sayfa, soru, seçenek) |
| `t_wf_` | Workflow (akış, adım, rol) |
| `t_bsv_` | Başvuru (kullanıcı başvurusu, cevaplar, dosyalar) |
| `t_lnk_` | Çakışma/bağlantı kuralları |
| `t_log_` | İşlem logları |

---

## Ortak Alan Kuralı (Her Tabloda Bulunması Zorunlu)

```sql
Id           BIGINT         IDENTITY(1,1) PRIMARY KEY,
TenantId     BIGINT         NOT NULL,   -- (Auth tablolarında yoktur)
CreatedUser  BIGINT         NOT NULL,
CreatedDate  DATETIME       NOT NULL,
CreatedIP    NVARCHAR(50)   NOT NULL,
ModifiedUser BIGINT         NULL,
ModifiedDate DATETIME       NULL,
ModifiedIP   NVARCHAR(50)   NULL,
IsDeleted    BIT            NOT NULL DEFAULT 0
```

> **Not**: `t_sis_tenant` ve `t_sis_user` gibi sistem tablolarında `TenantId` olmayabilir veya kendilerine özel bir kullanım söz konusu olabilir.

---

## 1. SİSTEM TABLOLARI (t_sis_)

### t_sis_tenant
```sql
CREATE TABLE t_sis_tenant (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    Ad              NVARCHAR(200) NOT NULL,
    Kod             NVARCHAR(50)  NOT NULL UNIQUE,    -- URL prefix veya sistem kodu
    Aciklama        NVARCHAR(500) NULL,
    LogoUrl         NVARCHAR(500) NULL,
    WebSiteUrl      NVARCHAR(500) NULL,
    AktifMi         BIT           NOT NULL DEFAULT 1,
    PaketTipi       INT           NOT NULL DEFAULT 1, -- 1=Demo, 2=Basic, 3=Pro (gelecek)
    PaketBitisTarih DATETIME      NULL,
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

### t_sis_user
```sql
CREATE TABLE t_sis_user (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NULL,      -- NULL = süper admin
    Ad              NVARCHAR(100) NOT NULL,
    Soyad           NVARCHAR(100) NOT NULL,
    Email           NVARCHAR(200) NULL,
    Telefon         NVARCHAR(20)  NULL,
    TcKimlik        NVARCHAR(11)  NULL,      -- e-Devlet entegrasyonu için
    KullaniciAdi    NVARCHAR(100) NULL,
    ParolaHash      NVARCHAR(500) NULL,
    ParolaTuz       NVARCHAR(100) NULL,
    AktifMi         BIT           NOT NULL DEFAULT 1,
    SonGirisTarih   DATETIME      NULL,
    DogrulamaTipi   INT           NOT NULL DEFAULT 1, -- 1=Email, 2=SMS, 3=YOK
    DogrulamaKodu   NVARCHAR(10)  NULL,
    DogrulamaExpiry DATETIME      NULL,
    DışKullanicıId  NVARCHAR(200) NULL,      -- SSO sağlayıcısından gelen harici id
    SSOProviderKod  NVARCHAR(50)  NULL,      -- google, edevlet, custom vb.
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

### t_sis_user_token
```sql
CREATE TABLE t_sis_user_token (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NULL,
    UserId          BIGINT        NOT NULL,
    Token           NVARCHAR(500) NOT NULL,
    RefreshToken    NVARCHAR(500) NULL,
    TokenExpiry     DATETIME      NOT NULL,
    IpAdresi        NVARCHAR(50)  NULL,
    UserAgent       NVARCHAR(500) NULL,
    AktifMi         BIT           NOT NULL DEFAULT 1,
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

### t_sis_rol
```sql
CREATE TABLE t_sis_rol (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NOT NULL,
    Ad              NVARCHAR(200) NOT NULL,
    Kod             NVARCHAR(100) NOT NULL,
    Aciklama        NVARCHAR(500) NULL,
    AktifMi         BIT           NOT NULL DEFAULT 1,
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

### t_sis_rol_kullanici
```sql
CREATE TABLE t_sis_rol_kullanici (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NOT NULL,
    RolId           BIGINT        NOT NULL,
    UserId          BIGINT        NOT NULL,
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

### t_sis_login_provider
```sql
-- Her tenant için hangi login yöntemlerinin aktif olduğu
CREATE TABLE t_sis_login_provider (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NOT NULL,
    ProviderTip     INT           NOT NULL,
    -- 1=KendiSistemi, 2=Google, 3=eDevlet, 4=OzelJWT, 5=OIDC
    ProviderAd      NVARCHAR(100) NOT NULL,
    ClientId        NVARCHAR(500) NULL,
    ClientSecret    NVARCHAR(500) NULL,
    AuthorityUrl    NVARCHAR(500) NULL,      -- OIDC authority URL
    RedirectUrl     NVARCHAR(500) NULL,
    TokenValidateUrl NVARCHAR(500) NULL,     -- JWT doğrulama endpoint'i
    EkParametreler  NVARCHAR(MAX) NULL,      -- JSON: ek provider-özel ayarlar
    AktifMi         BIT           NOT NULL DEFAULT 1,
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

---

## 2. FORM BUILDER TABLOLARI (t_frm_)

### t_frm_basvuru_form
```sql
CREATE TABLE t_frm_basvuru_form (
    Id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId            BIGINT        NOT NULL,
    Ad                  NVARCHAR(300) NOT NULL,
    Aciklama            NVARCHAR(MAX) NULL,
    BaslamaTarihi       DATETIME      NULL,
    BitisTarihi         DATETIME      NULL,
    Durum               INT           NOT NULL DEFAULT 1,
    -- 1=Taslak, 2=Yayinda, 3=Tamamlandi, 4=Iptal
    LoginGerekliMi      BIT           NOT NULL DEFAULT 1,
    AnonymousIzinliMi   BIT           NOT NULL DEFAULT 0,
    CokluBasvuruIzinliMi BIT          NOT NULL DEFAULT 0,
    -- Aynı kullanıcı birden fazla başvuru yapabilir mi?
    KopyalandiFormId    BIGINT        NULL,
    -- Bu form başka bir formdan kopyalandıysa kaynak form ID
    WorkflowId          BIGINT        NULL,      -- FK: t_wf_workflow
    BildirimAktifMi     BIT           NOT NULL DEFAULT 0,
    CreatedUser         BIGINT        NOT NULL,
    CreatedDate         DATETIME      NOT NULL,
    CreatedIP           NVARCHAR(50)  NOT NULL,
    ModifiedUser        BIGINT        NULL,
    ModifiedDate        DATETIME      NULL,
    ModifiedIP          NVARCHAR(50)  NULL,
    IsDeleted           BIT           NOT NULL DEFAULT 0
)
```

### t_frm_basvuru_form_login_provider
```sql
-- Bir formun hangi login provider'larına izin verdiği
CREATE TABLE t_frm_basvuru_form_login_provider (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT NOT NULL,
    BasvuruFormId   BIGINT NOT NULL,
    LoginProviderId BIGINT NOT NULL,
    SiraNo          INT    NOT NULL DEFAULT 1,
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

### t_frm_sayfa
```sql
CREATE TABLE t_frm_sayfa (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NOT NULL,
    BasvuruFormId   BIGINT        NOT NULL,
    Ad              NVARCHAR(200) NOT NULL,
    Aciklama        NVARCHAR(MAX) NULL,
    SiraNo          INT           NOT NULL DEFAULT 1,
    AktifMi         BIT           NOT NULL DEFAULT 1,
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

### t_frm_soru
```sql
CREATE TABLE t_frm_soru (
    Id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId            BIGINT        NOT NULL,
    SayfaId             BIGINT        NOT NULL,
    BasvuruFormId       BIGINT        NOT NULL,
    Etiket              NVARCHAR(500) NOT NULL,
    AltMetin            NVARCHAR(500) NULL,      -- Placeholder / yardım metni
    SoruTipi            INT           NOT NULL,
    -- 1=Metin, 2=UzunMetin, 3=Sayi, 4=Tarih, 5=TekSecim(Combo),
    -- 6=CokSecim(Checkbox), 7=Dosya, 8=Matris, 9=Baslik, 10=Ayirici,
    -- 11=Email, 12=Telefon, 13=TcKimlik
    ZorunluMu           BIT           NOT NULL DEFAULT 0,
    SiraNo              INT           NOT NULL DEFAULT 1,
    GrupKodu            NVARCHAR(50)  NULL,      -- Tekrarlanan grup için
    GrupMin             INT           NULL,      -- Min tekrar sayısı
    GrupMax             INT           NULL,      -- Max tekrar sayısı
    KaynakTipi          INT           NOT NULL DEFAULT 1,
    -- 1=Manuel seçenekler, 2=Harici GET servisi, 3=Harici POST servisi
    KaynakId            BIGINT        NULL,      -- FK: t_frm_soru_kaynak
    DegerValidasyonu    NVARCHAR(MAX) NULL,      -- JSON: regex, min, max, vb.
    GizliMi             BIT           NOT NULL DEFAULT 0,
    ReadOnlyMi          BIT           NOT NULL DEFAULT 0,
    EkBilgi             NVARCHAR(MAX) NULL,      -- JSON: soru tipine özel ekstra
    CreatedUser         BIGINT        NOT NULL,
    CreatedDate         DATETIME      NOT NULL,
    CreatedIP           NVARCHAR(50)  NOT NULL,
    ModifiedUser        BIGINT        NULL,
    ModifiedDate        DATETIME      NULL,
    ModifiedIP          NVARCHAR(50)  NULL,
    IsDeleted           BIT           NOT NULL DEFAULT 0
)
```

### t_frm_soru_secenek
```sql
CREATE TABLE t_frm_soru_secenek (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NOT NULL,
    SoruId          BIGINT        NOT NULL,
    EtiketTr        NVARCHAR(200) NOT NULL,
    EtiketEn        NVARCHAR(200) NULL,
    Deger           NVARCHAR(200) NOT NULL,     -- Saklanacak değer
    SiraNo          INT           NOT NULL DEFAULT 1,
    AktifMi         BIT           NOT NULL DEFAULT 1,
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

### t_frm_soru_kaynak
```sql
-- Dış servis tabanlı seçenekler için kaynak tanımı
CREATE TABLE t_frm_soru_kaynak (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NOT NULL,
    Ad              NVARCHAR(200) NOT NULL,
    ServisUrl       NVARCHAR(500) NOT NULL,
    HttpMetodu      NVARCHAR(10)  NOT NULL DEFAULT 'GET',  -- GET veya POST
    HeaderlerJson   NVARCHAR(MAX) NULL,
    -- JSON: {"Authorization": "Bearer xxx", "Content-Type": "application/json"}
    RequestBodyJson NVARCHAR(MAX) NULL,        -- POST için body şablonu
    EtiketAlan      NVARCHAR(100) NOT NULL DEFAULT 'ad',  -- Response'da gösterilecek alan
    DegerAlan       NVARCHAR(100) NOT NULL DEFAULT 'id',  -- Kaydedilecek alan
    CacheAktifMi    BIT           NOT NULL DEFAULT 0,
    CacheSureDk     INT           NULL DEFAULT 60,
    AktifMi         BIT           NOT NULL DEFAULT 1,
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

### t_frm_kural
```sql
-- Soru göster/gizle ve validasyon kuralları
CREATE TABLE t_frm_kural (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NOT NULL,
    BasvuruFormId   BIGINT        NOT NULL,
    HedefSoruId     BIGINT        NOT NULL,      -- Kuralın etkileyeceği soru
    KuralTipi       INT           NOT NULL,
    -- 1=GosterGizle, 2=ZorunluYap, 3=Yonlendir(sonraki sayfa), 4=Deger
    KosulJson       NVARCHAR(MAX) NOT NULL,
    -- Örnek: [{"soruId": 5, "operator": "equals", "deger": "evet"}]
    EylemJson       NVARCHAR(MAX) NOT NULL,
    -- Örnek: {"eylem": "goster"} veya {"eylem": "gizle"} veya {"eylem": "sayfaGit", "sayfaId": 3}
    AktifMi         BIT           NOT NULL DEFAULT 1,
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

---

## 3. WORKFLOW TABLOLARI (t_wf_)

### t_wf_workflow
```sql
CREATE TABLE t_wf_workflow (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NOT NULL,
    Ad              NVARCHAR(200) NOT NULL,
    Aciklama        NVARCHAR(500) NULL,
    AktifMi         BIT           NOT NULL DEFAULT 1,
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

### t_wf_adim
```sql
CREATE TABLE t_wf_adim (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NOT NULL,
    WorkflowId      BIGINT        NOT NULL,
    Ad              NVARCHAR(200) NOT NULL,
    Aciklama        NVARCHAR(500) NULL,
    SiraNo          INT           NOT NULL DEFAULT 1,
    AdimTipi        INT           NOT NULL DEFAULT 1,
    -- 1=Onay, 2=Bilgi, 3=İade
    IlkAdimMi       BIT           NOT NULL DEFAULT 0,
    SonAdimMi       BIT           NOT NULL DEFAULT 0,
    OtomatikGecMi   BIT           NOT NULL DEFAULT 0,  -- Rol yoksa otomatik geç
    BildirimGonderMi BIT          NOT NULL DEFAULT 1,
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

### t_wf_adim_rol
```sql
-- Bir workflow adımını hangi rollerin yönetebileceği
CREATE TABLE t_wf_adim_rol (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT NOT NULL,
    WorkflowAdimId  BIGINT NOT NULL,
    RolId           BIGINT NOT NULL,
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

### t_wf_adim_rol_filtre
```sql
-- Rol bazında dinamik filtre (ör: SoruId=X'in değeri Y ise bu rolün görmesi)
CREATE TABLE t_wf_adim_rol_filtre (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NOT NULL,
    WorkflowAdimRolId BIGINT      NOT NULL,
    SoruId          BIGINT        NOT NULL,      -- Hangi soruya göre filtre
    Operator        NVARCHAR(20)  NOT NULL,
    -- equals, notEquals, greaterThan, lessThan, in, notIn, contains
    FiltreJson      NVARCHAR(MAX) NOT NULL,
    -- Örnek: {"degerler": ["A", "B"]} veya {"deger": "2000-01-01"}
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

---

## 4. BAŞVURU TABLOLARI (t_bsv_)

### t_bsv_user_basvuru
```sql
CREATE TABLE t_bsv_user_basvuru (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NOT NULL,
    BasvuruFormId   BIGINT        NOT NULL,
    UserId          BIGINT        NOT NULL,
    Durum           INT           NOT NULL DEFAULT 1,
    -- 1=Devam, 2=Tamamlandi, 3=OnayBekleniyor, 4=Onaylandi, 5=Reddedildi, 6=Iade
    AktifAdimId     BIGINT        NULL,      -- FK: t_wf_adim
    BasvuruTarihi   DATETIME      NULL,
    TamamlanmaTarih DATETIME      NULL,
    IpAdresi        NVARCHAR(50)  NULL,
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

### t_bsv_cevap
```sql
CREATE TABLE t_bsv_cevap (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NOT NULL,
    UserBasvuruId   BIGINT        NOT NULL,
    SoruId          BIGINT        NOT NULL,
    GrupNo          INT           NULL DEFAULT 0,    -- Tekrarlanan grup için grup index
    CevapMetin      NVARCHAR(MAX) NULL,
    CevapSayi       DECIMAL(18,4) NULL,
    CevapTarih      DATETIME      NULL,
    CevapJson       NVARCHAR(MAX) NULL,
    -- Çok seçim, matris vb. için JSON dizi
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

### t_bsv_dosya
```sql
CREATE TABLE t_bsv_dosya (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NOT NULL,
    UserBasvuruId   BIGINT        NOT NULL,
    SoruId          BIGINT        NOT NULL,
    GrupNo          INT           NULL DEFAULT 0,
    OrijinalAd      NVARCHAR(500) NOT NULL,
    MinioObjectKey  NVARCHAR(500) NOT NULL,      -- MinIO bucket/key
    DosyaBoyu       BIGINT        NOT NULL,
    MimeType        NVARCHAR(200) NULL,
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

### t_bsv_wf_adim_durum
```sql
-- Başvurunun workflow adım geçmişi
CREATE TABLE t_bsv_wf_adim_durum (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NOT NULL,
    UserBasvuruId   BIGINT        NOT NULL,
    WorkflowAdimId  BIGINT        NOT NULL,
    Durum           INT           NOT NULL,
    -- 1=Bekliyor, 2=Onaylandi, 3=Reddedildi, 4=Iade, 5=Atland
    IslemYapanId    BIGINT        NULL,
    IslemTarihi     DATETIME      NULL,
    Yorum           NVARCHAR(MAX) NULL,
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

---

## 5. BAĞLANTI/ÇAKIŞMA TABLOLARI (t_lnk_)

### t_lnk_basvuru_link
```sql
-- Başvurular arası çakışma/bağlantı tanımı
-- "Başvuru Y'ye başvurmak için Başvuru X'e başvurmuş olmalı / olmamamalı"
CREATE TABLE t_lnk_basvuru_link (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NOT NULL,
    HedefFormId     BIGINT        NOT NULL,    -- Başvurulmak istenen form
    KaynakFormId    BIGINT        NOT NULL,    -- Referans alınan form
    LinkTipi        INT           NOT NULL,
    -- 1=MutlakaBasvurmuşOlmali (IN), 2=BasvurmamisOlmali (NOT IN)
    AciklamaMetni   NVARCHAR(MAX) NULL,        -- Kullanıcıya gösterilecek mesaj
    AktifMi         BIT           NOT NULL DEFAULT 1,
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

### t_lnk_basvuru_link_kural
```sql
-- Bağlantıya ek alan bazlı kural
-- "X başvurusundaki Y sorusunun değeri Z ise..."
CREATE TABLE t_lnk_basvuru_link_kural (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NOT NULL,
    BasvuruLinkId   BIGINT        NOT NULL,
    SoruId          BIGINT        NOT NULL,    -- Kaynak formun hangi sorusu
    Operator        NVARCHAR(20)  NOT NULL,
    -- equals, notEquals, greaterThan, lessThan, in, notIn
    KosulJson       NVARCHAR(MAX) NOT NULL,
    -- {"degerler": ["A", "B"]} veya {"deger": "2020-01-01"}
    CreatedUser     BIGINT        NOT NULL,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL,
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

---

## 6. LOG TABLOSU (t_log_)

### t_log_islem
```sql
CREATE TABLE t_log_islem (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        BIGINT        NULL,
    UserId          BIGINT        NULL,
    Modul           NVARCHAR(100) NULL,
    Aksiyon         NVARCHAR(200) NULL,
    EntityTip       NVARCHAR(100) NULL,
    EntityId        BIGINT        NULL,
    Detay           NVARCHAR(MAX) NULL,
    IpAdresi        NVARCHAR(50)  NULL,
    SonucBasariliMi BIT           NOT NULL DEFAULT 1,
    HataMetni       NVARCHAR(MAX) NULL,
    CreatedUser     BIGINT        NOT NULL DEFAULT 0,
    CreatedDate     DATETIME      NOT NULL,
    CreatedIP       NVARCHAR(50)  NOT NULL DEFAULT '',
    ModifiedUser    BIGINT        NULL,
    ModifiedDate    DATETIME      NULL,
    ModifiedIP      NVARCHAR(50)  NULL,
    IsDeleted       BIT           NOT NULL DEFAULT 0
)
```

---

## İndeksler (Önemli)

```sql
-- Sık sorgulanan alanlar
CREATE INDEX IX_t_frm_basvuru_form_TenantId ON t_frm_basvuru_form(TenantId, IsDeleted);
CREATE INDEX IX_t_bsv_user_basvuru_UserId ON t_bsv_user_basvuru(UserId, BasvuruFormId);
CREATE INDEX IX_t_bsv_cevap_UserBasvuruId ON t_bsv_cevap(UserBasvuruId);
CREATE INDEX IX_t_sis_user_token ON t_sis_user_token(Token, AktifMi);
CREATE INDEX IX_t_sis_user_Email ON t_sis_user(Email, TenantId, IsDeleted);
```

---

## PostgreSQL Uyumu Notları

SQL Server yerine PostgreSQL kullanılacaksa:
- `BIGINT IDENTITY(1,1)` → `BIGSERIAL`
- `NVARCHAR(n)` → `VARCHAR(n)` (PostgreSQL unicode destekli)
- `DATETIME` → `TIMESTAMP`
- `BIT` → `BOOLEAN`
- `NVARCHAR(MAX)` → `TEXT`
- `(nolock)` hint'leri kaldırılmalı
- Table attribute'larda schema prefix değişebilir: `dbo.` → `public.`

`CoreConfig`'deki `SqlDialect` property ile çalışma zamanında dialect belirlenir:
```json
"CoreConfig": {
  "SqlDialect": "SqlServer"  // veya "PostgreSql"
}
```
