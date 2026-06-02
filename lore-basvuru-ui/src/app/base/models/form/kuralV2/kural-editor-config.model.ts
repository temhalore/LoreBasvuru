export type DegerTipiMode = 'hidden' | 'fixed' | 'selectable';
export type DegerInputTip = 'metin' | 'sayi' | 'tarih';

export class KuralEditorConfigModel {
    items: SoruTipKuralEditorConfigModel[] = [];
}

export class SoruTipKuralEditorConfigModel {
    soruTipId: number = 0;
    supportsValidation: boolean = false;
    unsupportedMessage: string = '';
    kosulTipleri: KosulTipKuralEditorConfigModel[] = [];
}

export class KosulTipKuralEditorConfigModel {
    kosulTipId: number = 0;
    operatorIdList: number[] = [];
    degerTipiMode: DegerTipiMode = 'hidden';
    fixedDegerTipiId: number | null = null;
    selectableDegerTipiIdList: number[] = [];
    secondValueOperatorIdList: number[] = [];
    degerInputTip: DegerInputTip = 'metin';
    degerLabel: string = 'Deger';
    deger2Label: string = 'Deger 2';
    showDeger: boolean = false;
    showSecenek: boolean = false;
    showDosyaKisitAlanlari: boolean = false;
}
