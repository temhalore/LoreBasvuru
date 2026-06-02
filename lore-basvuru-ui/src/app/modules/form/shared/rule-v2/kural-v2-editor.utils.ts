import {
    KosulSatirCase,
    KuralEditorConfigModel,
    KosulTipKuralEditorConfigModel,
    SoruTipKuralEditorConfigModel,
} from 'app/base/models/form/kuralV2';

export const KURAL_TIPI_VALIDASYON = 2010001;
export const KURAL_TIPI_SAYFA = 2010002;
export const KURAL_TIPI_SORU = 2010003;

export const KURAL_TIPI_KOD_ID = 201;
export const KOSUL_TIPI_KOD_ID = 202;
export const OPERATOR_KOD_ID = 203;
export const JOIN_KOD_ID = 204;
export const DEGER_TIPI_KOD_ID = 205;
export const DOSYA_UZANTI_TIPI_KOD_ID = 206;

export const KOSUL_TIPI_DEGER_KARSILASTIRMA = 2020001;
export const KOSUL_TIPI_SECENEK_SECIMI = 2020002;
export const KOSUL_TIPI_DOSYA_KISITI = 2020003;
export const KOSUL_TIPI_MINNMAX_KARAKTER = 2020007;

export const OPERATOR_ARASINDA = 2030010;

export const DEGER_TIPI_SAYI = 2050001;
export const DEGER_TIPI_METIN = 2050002;
export const DEGER_TIPI_TARIH = 2050003;

export const SORU_TIP_KISA_METIN = 1050001;
export const SORU_TIP_UZUN_METIN = 1050002;
export const SORU_TIP_TEK_SECIM = 1050003;
export const SORU_TIP_COK_SECIM = 1050004;
export const SORU_TIP_ACILIR_LISTE = 1050005;
export const SORU_TIP_OLCEK = 1050006;
export const SORU_TIP_DERECELENDIRME = 1050007;
export const SORU_TIP_MATRIS_TEK_SECIM = 1050008;
export const SORU_TIP_MATRIS_COK_SECIM = 1050009;
export const SORU_TIP_TARIH = 1050010;
export const SORU_TIP_SAAT = 1050011;
export const SORU_TIP_SAYI = 1050012;
export const SORU_TIP_DOSYA_YUKLEME = 1050013;
export const SORU_TIP_SIRALAMA = 1050014;
export const SORU_TIP_TEKRARLI_GRUP = 1050015;
export const SORU_TIP_ACIKLAMA = 1050016;

export interface SoruTipValidationSupportState {
    supported: boolean;
    unsupportedMessage: string;
    config: SoruTipKuralEditorConfigModel | null;
}

const DEFAULT_UNSUPPORTED_MESSAGE = 'Bu soru tipi icin validasyon tanimlanamaz.';

/**
 * Backend tek kaynak; bu fonksiyon yalnızca config'i okur, kendi izin matrisini tutmaz.
 * editorConfig camelCase tipli model — backend artık birebir camelCase JSON döndürür.
 */
export function hesaplaKosulSatirCase(
    kosulTipId: number,
    operatorId: number,
    degerTipiId: number,
    soruTipKID: number,
    editorConfig: KuralEditorConfigModel | null,
): KosulSatirCase {
    const satirCase = new KosulSatirCase();
    satirCase.showOperator = false;
    satirCase.showDegerTipi = false;
    satirCase.showDeger = false;

    const items = editorConfig?.items ?? [];
    if (!items.length) {
        return satirCase;
    }

    const soruConfig = items.find((x) => sameId(x.soruTipId, soruTipKID));
    if (!soruConfig) {
        satirCase.showKuralDesteklenmezUyarisi = true;
        satirCase.kuralDesteklenmezMesaj = DEFAULT_UNSUPPORTED_MESSAGE;
        return satirCase;
    }

    if (!soruConfig.supportsValidation) {
        satirCase.showKuralDesteklenmezUyarisi = true;
        satirCase.kuralDesteklenmezMesaj = soruConfig.unsupportedMessage || DEFAULT_UNSUPPORTED_MESSAGE;
        return satirCase;
    }

    const kosulTipleri = soruConfig.kosulTipleri ?? [];
    satirCase.izinVerilenKosulTipIdleri = kosulTipleri
        .map((x) => normalizeId(x.kosulTipId))
        .filter((x) => x > 0);

    const kosulConfig = kosulTipleri.find((x) => sameId(x.kosulTipId, kosulTipId));
    if (!kosulConfig) {
        return satirCase;
    }

    applyKosulConfigToCase(satirCase, kosulConfig, operatorId, degerTipiId);
    return satirCase;
}

function applyKosulConfigToCase(
    satirCase: KosulSatirCase,
    kosulConfig: KosulTipKuralEditorConfigModel,
    operatorId: number,
    degerTipiId: number,
): void {
    satirCase.izinVerilenOperatorIdleri = normalizeIdList(kosulConfig.operatorIdList);
    satirCase.izinVerilenDegerTipiIdleri = normalizeIdList(kosulConfig.selectableDegerTipiIdList);
    satirCase.degerTipiMode = kosulConfig.degerTipiMode ?? 'hidden';
    satirCase.fixedDegerTipiId = normalizeId(kosulConfig.fixedDegerTipiId) > 0
        ? normalizeId(kosulConfig.fixedDegerTipiId)
        : null;
    satirCase.showOperator = satirCase.izinVerilenOperatorIdleri.length > 0;
    satirCase.showDegerTipi = satirCase.degerTipiMode === 'selectable';
    satirCase.showDeger = kosulConfig.showDeger === true;
    satirCase.showSecenek = kosulConfig.showSecenek === true;
    satirCase.showDosyaKisitAlanlari = kosulConfig.showDosyaKisitAlanlari === true;
    satirCase.degerInputTip = resolveDegerInputTip(kosulConfig, degerTipiId);
    satirCase.showDeger2 = normalizeIdList(kosulConfig.secondValueOperatorIdList).some((id) => sameId(id, operatorId));
    satirCase.degerLabel = kosulConfig.degerLabel || 'Deger';
    satirCase.deger2Label = kosulConfig.deger2Label || 'Deger 2';

    if (sameId(kosulConfig.kosulTipId, KOSUL_TIPI_MINNMAX_KARAKTER) && satirCase.showDeger2) {
        satirCase.degerLabel = 'Min Karakter';
    }
}

function resolveDegerInputTip(
    kosulConfig: KosulTipKuralEditorConfigModel,
    degerTipiId: number,
): 'sayi' | 'metin' | 'tarih' {
    if (kosulConfig.degerInputTip) {
        return kosulConfig.degerInputTip;
    }

    switch (normalizeId(degerTipiId) || normalizeId(kosulConfig.fixedDegerTipiId)) {
        case DEGER_TIPI_SAYI:
            return 'sayi';
        case DEGER_TIPI_TARIH:
            return 'tarih';
        default:
            return 'metin';
    }
}

export function getSoruTipEditorConfig(
    editorConfig: KuralEditorConfigModel | null,
    soruTipKID: number,
): SoruTipKuralEditorConfigModel | null {
    return (editorConfig?.items ?? []).find((x) => sameId(x.soruTipId, soruTipKID)) ?? null;
}

export function getSoruTipValidationSupportState(
    editorConfig: KuralEditorConfigModel | null,
    soruTipKID: number,
): SoruTipValidationSupportState {
    const soruConfig = getSoruTipEditorConfig(editorConfig, soruTipKID);
    if (!soruConfig) {
        return {
            supported: false,
            unsupportedMessage: DEFAULT_UNSUPPORTED_MESSAGE,
            config: null,
        };
    }

    if (soruConfig.supportsValidation) {
        return {
            supported: true,
            unsupportedMessage: '',
            config: soruConfig,
        };
    }

    return {
        supported: false,
        unsupportedMessage: soruConfig.unsupportedMessage || DEFAULT_UNSUPPORTED_MESSAGE,
        config: soruConfig,
    };
}

export function isSoruTipValidationSupported(
    editorConfig: KuralEditorConfigModel | null,
    soruTipKID: number,
): boolean {
    return getSoruTipValidationSupportState(editorConfig, soruTipKID).supported;
}

function normalizeId(value: unknown): number {
    const id = Number(value ?? 0);
    return Number.isFinite(id) ? id : 0;
}

function normalizeIdList(values: Array<number | null | undefined> | null | undefined): number[] {
    return (values ?? [])
        .map((value) => normalizeId(value))
        .filter((value) => value > 0);
}

function sameId(left: unknown, right: unknown): boolean {
    const leftId = normalizeId(left);
    const rightId = normalizeId(right);
    return leftId > 0 && rightId > 0 && leftId === rightId;
}
