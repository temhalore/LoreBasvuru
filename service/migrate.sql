-- ============================================================
-- LoreBasvuru — PostgreSQL Migration Script
-- Oluşturma Tarihi: 2026-05-22
-- Dialect: PostgreSQL 15+
-- ============================================================

-- ============================================================
-- 1. SİSTEM TABLOLARI (t_sis_)
-- ============================================================

CREATE TABLE IF NOT EXISTS t_sis_tenant (
    "Id"                BIGSERIAL       PRIMARY KEY,
    "Ad"                VARCHAR(200)    NOT NULL,
    "Kod"               VARCHAR(50)     NOT NULL UNIQUE,
    "Aciklama"          VARCHAR(500),
    "LogoUrl"           VARCHAR(500),
    "WebSiteUrl"        VARCHAR(500),
    "AktifMi"           BOOLEAN         NOT NULL DEFAULT TRUE,
    "PaketTipi"         INTEGER         NOT NULL DEFAULT 1,
    "PaketBitisTarih"   TIMESTAMP,
    -- Talend SSO alanları
    "TalendAuthUrl"     VARCHAR(500),
    "TalendClientId"    VARCHAR(200),
    "TalendClientSecret" VARCHAR(500),
    "TalendIssuer"      VARCHAR(500),
    "TalendJwksUrl"     VARCHAR(500),
    -- Audit alanları
    "CreatedUser"       BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"         VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIP"        VARCHAR(50),
    "IsDeleted"         BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_sis_user (
    "Id"                BIGSERIAL       PRIMARY KEY,
    "TenantId"          BIGINT,
    "Ad"                VARCHAR(100)    NOT NULL,
    "Soyad"             VARCHAR(100)    NOT NULL,
    "Email"             VARCHAR(200),
    "Telefon"           VARCHAR(20),
    "TcKimlik"          VARCHAR(11),
    "KullaniciAdi"      VARCHAR(100),
    "ParolaHash"        VARCHAR(500),
    "ParolaTuz"         VARCHAR(100),
    "AktifMi"           BOOLEAN         NOT NULL DEFAULT TRUE,
    "SonGirisTarih"     TIMESTAMP,
    "DogrulamaTipi"     INTEGER         NOT NULL DEFAULT 1,
    "DogrulamaKodu"     VARCHAR(10),
    "DogrulamaExpiry"   TIMESTAMP,
    "DisKullaniciId"    VARCHAR(200),
    "SSOProviderKod"    VARCHAR(50),
    "CreatedUser"       BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"         VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIP"        VARCHAR(50),
    "IsDeleted"         BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_sis_user_token (
    "Id"            BIGSERIAL       PRIMARY KEY,
    "TenantId"      BIGINT,
    "UserId"        BIGINT          NOT NULL,
    "Token"         VARCHAR(500)    NOT NULL,
    "RefreshToken"  VARCHAR(500),
    "TokenExpiry"   TIMESTAMP       NOT NULL,
    "IpAdresi"      VARCHAR(50),
    "UserAgent"     VARCHAR(500),
    "AktifMi"       BOOLEAN         NOT NULL DEFAULT TRUE,
    "CreatedUser"   BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"   TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"     VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"  BIGINT,
    "ModifiedDate"  TIMESTAMP,
    "ModifiedIP"    VARCHAR(50),
    "IsDeleted"     BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_sis_rol (
    "Id"            BIGSERIAL       PRIMARY KEY,
    "TenantId"      BIGINT          NOT NULL,
    "Ad"            VARCHAR(200)    NOT NULL,
    "Kod"           VARCHAR(100),
    "UstRolId"      BIGINT,
    "Aciklama"      VARCHAR(500),
    "AktifMi"       BOOLEAN         NOT NULL DEFAULT TRUE,
    "CreatedUser"   BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"   TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"     VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"  BIGINT,
    "ModifiedDate"  TIMESTAMP,
    "ModifiedIP"    VARCHAR(50),
    "IsDeleted"     BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_sis_user_rol (
    "Id"            BIGSERIAL       PRIMARY KEY,
    "TenantId"      BIGINT          NOT NULL,
    "UserId"        BIGINT          NOT NULL,
    "RolId"         BIGINT          NOT NULL,
    "AktifMi"       BOOLEAN         NOT NULL DEFAULT TRUE,
    "CreatedUser"   BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"   TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"     VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"  BIGINT,
    "ModifiedDate"  TIMESTAMP,
    "ModifiedIP"    VARCHAR(50),
    "IsDeleted"     BOOLEAN         NOT NULL DEFAULT FALSE,
    UNIQUE ("UserId", "RolId")
);

CREATE TABLE IF NOT EXISTS t_sis_login_provider (
    "Id"                BIGSERIAL       PRIMARY KEY,
    "TenantId"          BIGINT          NOT NULL,
    "ProviderTip"       INTEGER         NOT NULL,
    "ProviderAd"        VARCHAR(100)    NOT NULL,
    "ClientId"          VARCHAR(500),
    "ClientSecret"      VARCHAR(500),
    "AuthorityUrl"      VARCHAR(500),
    "RedirectUrl"       VARCHAR(500),
    "TokenValidateUrl"  VARCHAR(500),
    "EkParametreler"    TEXT,
    "AktifMi"           BOOLEAN         NOT NULL DEFAULT TRUE,
    "CreatedUser"       BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"         VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIP"        VARCHAR(50),
    "IsDeleted"         BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_sis_otp (
    "Id"            BIGSERIAL       PRIMARY KEY,
    "TenantId"      BIGINT,
    "UserId"        BIGINT,
    "Email"         VARCHAR(200),
    "Telefon"       VARCHAR(20),
    "Kod"           VARCHAR(10)     NOT NULL,
    "OtpTip"        INTEGER         NOT NULL DEFAULT 1,
    "Expiry"        TIMESTAMP       NOT NULL,
    "KullanildiMi"  BOOLEAN         NOT NULL DEFAULT FALSE,
    "CreatedUser"   BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"   TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"     VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"  BIGINT,
    "ModifiedDate"  TIMESTAMP,
    "ModifiedIP"    VARCHAR(50),
    "IsDeleted"     BOOLEAN         NOT NULL DEFAULT FALSE
);

-- ── YETKİLENDİRME TABLOLARI ────────────────────────────────

CREATE TABLE IF NOT EXISTS t_sis_ekran (
    "Id"                BIGSERIAL       PRIMARY KEY,
    "Ad"                VARCHAR(200)    NOT NULL,
    "Yol"               VARCHAR(500),
    "Kod"               VARCHAR(100)    NOT NULL,
    "UstEkranId"        BIGINT,
    "SiraNo"            INTEGER         NOT NULL DEFAULT 0,
    "Ikon"              VARCHAR(100),
    "AktifMi"           BOOLEAN         NOT NULL DEFAULT TRUE,
    "CreatedUser"       BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIpAdress"   VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIpAdress"  VARCHAR(50),
    "IsDeleted"         BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_sis_widget (
    "Id"                BIGSERIAL       PRIMARY KEY,
    "EkranId"           BIGINT          NOT NULL,
    "Ad"                VARCHAR(200)    NOT NULL,
    "Kod"               VARCHAR(100)    NOT NULL,
    "Aciklama"          VARCHAR(500),
    "SiraNo"            INTEGER         NOT NULL DEFAULT 0,
    "AktifMi"           BOOLEAN         NOT NULL DEFAULT TRUE,
    "CreatedUser"       BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIpAdress"   VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIpAdress"  VARCHAR(50),
    "IsDeleted"         BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_sis_controller_method (
    "Id"                BIGSERIAL       PRIMARY KEY,
    "ControllerAd"      VARCHAR(200)    NOT NULL,
    "MethodAd"          VARCHAR(200)    NOT NULL,
    "HttpTip"           VARCHAR(10),
    "Aciklama"          VARCHAR(500),
    "AktifMi"           BOOLEAN         NOT NULL DEFAULT TRUE,
    "CreatedUser"       BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIpAdress"   VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIpAdress"  VARCHAR(50),
    "IsDeleted"         BOOLEAN         NOT NULL DEFAULT FALSE,
    UNIQUE ("ControllerAd", "MethodAd")
);

CREATE TABLE IF NOT EXISTS t_sis_widget_controller_method (
    "Id"                    BIGSERIAL   PRIMARY KEY,
    "WidgetId"              BIGINT      NOT NULL,
    "ControllerMethodId"    BIGINT      NOT NULL,
    "CreatedUser"           BIGINT      NOT NULL DEFAULT 0,
    "CreatedDate"           TIMESTAMP   NOT NULL DEFAULT NOW(),
    "CreatedIpAdress"       VARCHAR(50) NOT NULL DEFAULT '',
    "ModifiedUser"          BIGINT,
    "ModifiedDate"          TIMESTAMP,
    "ModifiedIpAdress"      VARCHAR(50),
    "IsDeleted"             BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_sis_rol_ekran (
    "Id"                BIGSERIAL   PRIMARY KEY,
    "TenantId"          BIGINT      NOT NULL,
    "RolId"             BIGINT      NOT NULL,
    "EkranId"           BIGINT      NOT NULL,
    "CreatedUser"       BIGINT      NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP   NOT NULL DEFAULT NOW(),
    "CreatedIpAdress"   VARCHAR(50) NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIpAdress"  VARCHAR(50),
    "IsDeleted"         BOOLEAN     NOT NULL DEFAULT FALSE,
    UNIQUE ("RolId", "EkranId")
);

CREATE TABLE IF NOT EXISTS t_sis_rol_widget (
    "Id"                BIGSERIAL   PRIMARY KEY,
    "TenantId"          BIGINT      NOT NULL,
    "RolId"             BIGINT      NOT NULL,
    "WidgetId"          BIGINT      NOT NULL,
    "CreatedUser"       BIGINT      NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP   NOT NULL DEFAULT NOW(),
    "CreatedIpAdress"   VARCHAR(50) NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIpAdress"  VARCHAR(50),
    "IsDeleted"         BOOLEAN     NOT NULL DEFAULT FALSE,
    UNIQUE ("RolId", "WidgetId")
);

-- ============================================================
-- 2. FORM BUILDER TABLOLARI (t_frm_)
-- ============================================================

CREATE TABLE IF NOT EXISTS t_frm_basvuru_form (
    "Id"                    BIGSERIAL   PRIMARY KEY,
    "TenantId"              BIGINT      NOT NULL,
    "Ad"                    VARCHAR(300) NOT NULL,
    "Aciklama"              TEXT,
    "BaslamaTarihi"         TIMESTAMP,
    "BitisTarihi"           TIMESTAMP,
    "Durum"                 INTEGER     NOT NULL DEFAULT 1,
    "LoginGerekliMi"        BOOLEAN     NOT NULL DEFAULT TRUE,
    "AnonymousIzinliMi"     BOOLEAN     NOT NULL DEFAULT FALSE,
    "CokluBasvuruIzinliMi"  BOOLEAN     NOT NULL DEFAULT FALSE,
    "KopyalandiFormId"      BIGINT,
    "WorkflowId"            BIGINT,
    "BildirimAktifMi"       BOOLEAN     NOT NULL DEFAULT FALSE,
    "CreatedUser"           BIGINT      NOT NULL DEFAULT 0,
    "CreatedDate"           TIMESTAMP   NOT NULL DEFAULT NOW(),
    "CreatedIP"             VARCHAR(50) NOT NULL DEFAULT '',
    "ModifiedUser"          BIGINT,
    "ModifiedDate"          TIMESTAMP,
    "ModifiedIP"            VARCHAR(50),
    "IsDeleted"             BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_frm_basvuru_form_login_provider (
    "Id"                BIGSERIAL   PRIMARY KEY,
    "TenantId"          BIGINT      NOT NULL,
    "BasvuruFormId"     BIGINT      NOT NULL,
    "LoginProviderId"   BIGINT      NOT NULL,
    "SiraNo"            INTEGER     NOT NULL DEFAULT 1,
    "CreatedUser"       BIGINT      NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP   NOT NULL DEFAULT NOW(),
    "CreatedIP"         VARCHAR(50) NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIP"        VARCHAR(50),
    "IsDeleted"         BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_frm_sayfa (
    "Id"            BIGSERIAL       PRIMARY KEY,
    "TenantId"      BIGINT          NOT NULL,
    "BasvuruFormId" BIGINT          NOT NULL,
    "Ad"            VARCHAR(200)    NOT NULL,
    "Aciklama"      TEXT,
    "SiraNo"        INTEGER         NOT NULL DEFAULT 1,
    "AktifMi"       BOOLEAN         NOT NULL DEFAULT TRUE,
    "CreatedUser"   BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"   TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"     VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"  BIGINT,
    "ModifiedDate"  TIMESTAMP,
    "ModifiedIP"    VARCHAR(50),
    "IsDeleted"     BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_frm_soru (
    "Id"                BIGSERIAL       PRIMARY KEY,
    "TenantId"          BIGINT          NOT NULL,
    "SayfaId"           BIGINT          NOT NULL,
    "BasvuruFormId"     BIGINT          NOT NULL,
    "Etiket"            VARCHAR(500)    NOT NULL,
    "AltMetin"          VARCHAR(500),
    "SoruTipi"          INTEGER         NOT NULL,
    "ZorunluMu"         BOOLEAN         NOT NULL DEFAULT FALSE,
    "SiraNo"            INTEGER         NOT NULL DEFAULT 1,
    "GrupKodu"          VARCHAR(50),
    "GrupMin"           INTEGER,
    "GrupMax"           INTEGER,
    "KaynakTipi"        INTEGER         NOT NULL DEFAULT 1,
    "KaynakId"          BIGINT,
    "DegerValidasyonu"  TEXT,
    "GizliMi"           BOOLEAN         NOT NULL DEFAULT FALSE,
    "ReadOnlyMi"        BOOLEAN         NOT NULL DEFAULT FALSE,
    "EkBilgi"           TEXT,
    "CreatedUser"       BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"         VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIP"        VARCHAR(50),
    "IsDeleted"         BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_frm_soru_secenek (
    "Id"            BIGSERIAL       PRIMARY KEY,
    "TenantId"      BIGINT          NOT NULL,
    "SoruId"        BIGINT          NOT NULL,
    "EtiketTr"      VARCHAR(200)    NOT NULL,
    "EtiketEn"      VARCHAR(200),
    "Deger"         VARCHAR(200)    NOT NULL,
    "SiraNo"        INTEGER         NOT NULL DEFAULT 1,
    "AktifMi"       BOOLEAN         NOT NULL DEFAULT TRUE,
    "CreatedUser"   BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"   TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"     VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"  BIGINT,
    "ModifiedDate"  TIMESTAMP,
    "ModifiedIP"    VARCHAR(50),
    "IsDeleted"     BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_frm_soru_kaynak (
    "Id"                BIGSERIAL       PRIMARY KEY,
    "TenantId"          BIGINT          NOT NULL,
    "Ad"                VARCHAR(200)    NOT NULL,
    "ServisUrl"         VARCHAR(500)    NOT NULL,
    "HttpMetodu"        VARCHAR(10)     NOT NULL DEFAULT 'GET',
    "HeaderlerJson"     TEXT,
    "RequestBodyJson"   TEXT,
    "EtiketAlan"        VARCHAR(100)    NOT NULL DEFAULT 'ad',
    "DegerAlan"         VARCHAR(100)    NOT NULL DEFAULT 'id',
    "CacheAktifMi"      BOOLEAN         NOT NULL DEFAULT FALSE,
    "CacheSureDk"       INTEGER         DEFAULT 60,
    "AktifMi"           BOOLEAN         NOT NULL DEFAULT TRUE,
    "CreatedUser"       BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"         VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIP"        VARCHAR(50),
    "IsDeleted"         BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_frm_kural (
    "Id"            BIGSERIAL   PRIMARY KEY,
    "TenantId"      BIGINT      NOT NULL,
    "BasvuruFormId" BIGINT      NOT NULL,
    "HedefSoruId"   BIGINT      NOT NULL,
    "KuralTipi"     INTEGER     NOT NULL,
    "KosulJson"     TEXT        NOT NULL,
    "EylemJson"     TEXT        NOT NULL,
    "AktifMi"       BOOLEAN     NOT NULL DEFAULT TRUE,
    "CreatedUser"   BIGINT      NOT NULL DEFAULT 0,
    "CreatedDate"   TIMESTAMP   NOT NULL DEFAULT NOW(),
    "CreatedIP"     VARCHAR(50) NOT NULL DEFAULT '',
    "ModifiedUser"  BIGINT,
    "ModifiedDate"  TIMESTAMP,
    "ModifiedIP"    VARCHAR(50),
    "IsDeleted"     BOOLEAN     NOT NULL DEFAULT FALSE
);

-- ============================================================
-- 3. WORKFLOW TABLOLARI (t_wf_)
-- ============================================================

CREATE TABLE IF NOT EXISTS t_wf_workflow (
    "Id"            BIGSERIAL       PRIMARY KEY,
    "TenantId"      BIGINT          NOT NULL,
    "Ad"            VARCHAR(200)    NOT NULL,
    "Aciklama"      VARCHAR(500),
    "AktifMi"       BOOLEAN         NOT NULL DEFAULT TRUE,
    "CreatedUser"   BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"   TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"     VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"  BIGINT,
    "ModifiedDate"  TIMESTAMP,
    "ModifiedIP"    VARCHAR(50),
    "IsDeleted"     BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_wf_adim (
    "Id"                BIGSERIAL       PRIMARY KEY,
    "TenantId"          BIGINT          NOT NULL,
    "WorkflowId"        BIGINT          NOT NULL,
    "Ad"                VARCHAR(200)    NOT NULL,
    "Aciklama"          VARCHAR(500),
    "SiraNo"            INTEGER         NOT NULL DEFAULT 1,
    "AdimTipi"          INTEGER         NOT NULL DEFAULT 1,
    "IlkAdimMi"         BOOLEAN         NOT NULL DEFAULT FALSE,
    "SonAdimMi"         BOOLEAN         NOT NULL DEFAULT FALSE,
    "OtomatikGecMi"     BOOLEAN         NOT NULL DEFAULT FALSE,
    "BildirimGonderMi"  BOOLEAN         NOT NULL DEFAULT TRUE,
    "CreatedUser"       BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"         VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIP"        VARCHAR(50),
    "IsDeleted"         BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_wf_adim_rol (
    "Id"                BIGSERIAL   PRIMARY KEY,
    "TenantId"          BIGINT      NOT NULL,
    "WorkflowAdimId"    BIGINT      NOT NULL,
    "RolId"             BIGINT      NOT NULL,
    "CreatedUser"       BIGINT      NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP   NOT NULL DEFAULT NOW(),
    "CreatedIP"         VARCHAR(50) NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIP"        VARCHAR(50),
    "IsDeleted"         BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_wf_adim_rol_filtre (
    "Id"                    BIGSERIAL       PRIMARY KEY,
    "TenantId"              BIGINT          NOT NULL,
    "WorkflowAdimRolId"     BIGINT          NOT NULL,
    "SoruId"                BIGINT          NOT NULL,
    "Operator"              VARCHAR(20)     NOT NULL,
    "FiltreJson"            TEXT            NOT NULL,
    "CreatedUser"           BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"           TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"             VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"          BIGINT,
    "ModifiedDate"          TIMESTAMP,
    "ModifiedIP"            VARCHAR(50),
    "IsDeleted"             BOOLEAN         NOT NULL DEFAULT FALSE
);

-- ============================================================
-- 4. BAŞVURU TABLOLARI (t_bsv_)
-- ============================================================

CREATE TABLE IF NOT EXISTS t_bsv_user_basvuru (
    "Id"                BIGSERIAL   PRIMARY KEY,
    "TenantId"          BIGINT      NOT NULL,
    "BasvuruFormId"     BIGINT      NOT NULL,
    "UserId"            BIGINT      NOT NULL,
    "Durum"             INTEGER     NOT NULL DEFAULT 1,
    "AktifAdimId"       BIGINT,
    "BasvuruTarihi"     TIMESTAMP,
    "TamamlanmaTarih"   TIMESTAMP,
    "IpAdresi"          VARCHAR(50),
    "CreatedUser"       BIGINT      NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP   NOT NULL DEFAULT NOW(),
    "CreatedIP"         VARCHAR(50) NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIP"        VARCHAR(50),
    "IsDeleted"         BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_bsv_cevap (
    "Id"                BIGSERIAL       PRIMARY KEY,
    "TenantId"          BIGINT          NOT NULL,
    "UserBasvuruId"     BIGINT          NOT NULL,
    "SoruId"            BIGINT          NOT NULL,
    "GrupNo"            INTEGER         DEFAULT 0,
    "CevapMetin"        TEXT,
    "CevapSayi"         DECIMAL(18,4),
    "CevapTarih"        TIMESTAMP,
    "CevapJson"         TEXT,
    "CreatedUser"       BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"         VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIP"        VARCHAR(50),
    "IsDeleted"         BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_bsv_dosya (
    "Id"                BIGSERIAL       PRIMARY KEY,
    "TenantId"          BIGINT          NOT NULL,
    "UserBasvuruId"     BIGINT          NOT NULL,
    "SoruId"            BIGINT          NOT NULL,
    "GrupNo"            INTEGER         DEFAULT 0,
    "OrijinalAd"        VARCHAR(500)    NOT NULL,
    "MinioObjectKey"    VARCHAR(500)    NOT NULL,
    "DosyaBoyu"         BIGINT          NOT NULL,
    "MimeType"          VARCHAR(200),
    "CreatedUser"       BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"         VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIP"        VARCHAR(50),
    "IsDeleted"         BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_bsv_wf_adim_durum (
    "Id"                BIGSERIAL   PRIMARY KEY,
    "TenantId"          BIGINT      NOT NULL,
    "UserBasvuruId"     BIGINT      NOT NULL,
    "WorkflowAdimId"    BIGINT      NOT NULL,
    "Durum"             INTEGER     NOT NULL,
    "IslemYapanId"      BIGINT,
    "IslemTarihi"       TIMESTAMP,
    "Yorum"             TEXT,
    "CreatedUser"       BIGINT      NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP   NOT NULL DEFAULT NOW(),
    "CreatedIP"         VARCHAR(50) NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIP"        VARCHAR(50),
    "IsDeleted"         BOOLEAN     NOT NULL DEFAULT FALSE
);

-- ============================================================
-- 5. BAĞLANTI/ÇAKIŞMA TABLOLARI (t_lnk_)
-- ============================================================

CREATE TABLE IF NOT EXISTS t_lnk_basvuru_link (
    "Id"                BIGSERIAL       PRIMARY KEY,
    "TenantId"          BIGINT          NOT NULL,
    "HedefFormId"       BIGINT          NOT NULL,
    "KaynakFormId"      BIGINT          NOT NULL,
    "LinkTipi"          INTEGER         NOT NULL,
    "AciklamaMetni"     TEXT,
    "AktifMi"           BOOLEAN         NOT NULL DEFAULT TRUE,
    "CreatedUser"       BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"         VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIP"        VARCHAR(50),
    "IsDeleted"         BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_lnk_basvuru_link_kural (
    "Id"                BIGSERIAL       PRIMARY KEY,
    "TenantId"          BIGINT          NOT NULL,
    "BasvuruLinkId"     BIGINT          NOT NULL,
    "SoruId"            BIGINT          NOT NULL,
    "Operator"          VARCHAR(20)     NOT NULL,
    "KosulJson"         TEXT            NOT NULL,
    "CreatedUser"       BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"         VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIP"        VARCHAR(50),
    "IsDeleted"         BOOLEAN         NOT NULL DEFAULT FALSE
);

-- ============================================================
-- 6. LOG TABLOSU (t_log_)
-- ============================================================

CREATE TABLE IF NOT EXISTS t_log_islem (
    "Id"                BIGSERIAL       PRIMARY KEY,
    "TenantId"          BIGINT,
    "UserId"            BIGINT,
    "Modul"             VARCHAR(100),
    "Aksiyon"           VARCHAR(200),
    "EntityTip"         VARCHAR(100),
    "EntityId"          BIGINT,
    "Detay"             TEXT,
    "IpAdresi"          VARCHAR(50),
    "SonucBasariliMi"   BOOLEAN         NOT NULL DEFAULT TRUE,
    "HataMetni"         TEXT,
    "CreatedUser"       BIGINT          NOT NULL DEFAULT 0,
    "CreatedDate"       TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedIP"         VARCHAR(50)     NOT NULL DEFAULT '',
    "ModifiedUser"      BIGINT,
    "ModifiedDate"      TIMESTAMP,
    "ModifiedIP"        VARCHAR(50),
    "IsDeleted"         BOOLEAN         NOT NULL DEFAULT FALSE
);

-- ============================================================
-- İNDEKSLER
-- ============================================================

CREATE INDEX IF NOT EXISTS IX_t_frm_basvuru_form_TenantId    ON t_frm_basvuru_form ("TenantId", "IsDeleted");
CREATE INDEX IF NOT EXISTS IX_t_bsv_user_basvuru_UserId       ON t_bsv_user_basvuru ("UserId", "BasvuruFormId");
CREATE INDEX IF NOT EXISTS IX_t_bsv_cevap_UserBasvuruId       ON t_bsv_cevap ("UserBasvuruId");
CREATE INDEX IF NOT EXISTS IX_t_sis_user_token                ON t_sis_user_token ("Token", "AktifMi");
CREATE INDEX IF NOT EXISTS IX_t_sis_user_Email                ON t_sis_user ("Email", "TenantId", "IsDeleted");
CREATE INDEX IF NOT EXISTS IX_t_sis_user_rol_UserId           ON t_sis_user_rol ("UserId", "TenantId", "IsDeleted");
CREATE INDEX IF NOT EXISTS IX_t_sis_rol_ekran_RolId           ON t_sis_rol_ekran ("RolId", "IsDeleted");
CREATE INDEX IF NOT EXISTS IX_t_sis_rol_widget_RolId          ON t_sis_rol_widget ("RolId", "IsDeleted");

-- ============================================================
-- SEED DATA — SuperAdmin + Temel Ekranlar
-- ============================================================

-- SuperAdmin tenant (varsa güncelleme yapma)
INSERT INTO t_sis_tenant ("Ad", "Kod", "AktifMi", "IsDeleted", "CreatedUser", "CreatedDate", "CreatedIP")
SELECT 'SuperAdmin', 'superadmin', TRUE, FALSE, 0, NOW(), '127.0.0.1'
WHERE NOT EXISTS (SELECT 1 FROM t_sis_tenant WHERE "Kod" = 'superadmin');

-- Temel ekranlar
INSERT INTO t_sis_ekran ("Ad", "Yol", "Kod", "SiraNo", "AktifMi", "IsDeleted", "CreatedUser", "CreatedDate", "CreatedIpAdress")
SELECT * FROM (VALUES
    ('Formlar', '/admin/formlar', 'FORM_LIST', 1, TRUE, FALSE, 0, NOW(), '127.0.0.1'),
    ('Form Oluştur', '/admin/form-editor', 'FORM_EDITOR', 2, TRUE, FALSE, 0, NOW(), '127.0.0.1'),
    ('Başvurular', '/admin/basvurular', 'BASVURU_LIST', 3, TRUE, FALSE, 0, NOW(), '127.0.0.1'),
    ('Workflow', '/admin/workflow', 'WORKFLOW', 4, TRUE, FALSE, 0, NOW(), '127.0.0.1'),
    ('Raporlar', '/admin/raporlar', 'RAPOR', 5, TRUE, FALSE, 0, NOW(), '127.0.0.1'),
    ('Yetki Yönetimi', '/admin/yetki', 'YETKI', 10, TRUE, FALSE, 0, NOW(), '127.0.0.1')
) AS v("Ad", "Yol", "Kod", "SiraNo", "AktifMi", "IsDeleted", "CreatedUser", "CreatedDate", "CreatedIpAdress")
WHERE NOT EXISTS (SELECT 1 FROM t_sis_ekran WHERE "Kod" = v."Kod");

-- ============================================================
-- KULLANIM NOTLARI:
-- psql -h localhost -U postgres -d lorebasvuru -f migrate.sql
-- ============================================================
