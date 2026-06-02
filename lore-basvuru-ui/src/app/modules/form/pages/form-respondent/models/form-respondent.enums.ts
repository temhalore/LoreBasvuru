export enum QuestionType {
    KISA_METIN       = 1050001,
    UZUN_METIN       = 1050002,
    TEK_SECIM        = 1050003,
    COK_SECIM        = 1050004,
    ACILIR_LISTE     = 1050005,
    OLCEK            = 1050006,
    DERECELENDIRME   = 1050007,
    MATRIS_TEK_SECIM = 1050008,
    MATRIS_COK_SECIM = 1050009,
    TARIH            = 1050010,
    SAAT             = 1050011,
    SAYI             = 1050012,
    DOSYA_YUKLEME    = 1050013,
    SIRALAMA         = 1050014,
    TEKRARLI_GRUP    = 1050015,
}

export enum FormPublishStatus {
    TASLAK       = 1060001,
    YAYINDA      = 1060002,
    GERI_CEKILDI = 1060003,
    ARSIV        = 1060004,
}

export enum SessionStatus {
    BASLADI      = 1070001,
    TAMAMLANDI   = 1070002,
    SURESI_DOLDU = 1070003,
    IPTAL_EDILDI = 1070004,
    DEVAM_EDIYOR = 1070005,
}

export enum RuleType {
    SORU_GORUNURLUK  = 1080001,
    SORU_ZORUNLULUK  = 1080002,
    SORU_KILITLEME   = 1080003,
    SAYFA_ATLAMA     = 1080004,
    SECIM_FILTRELEME = 1080005,
}
