import { BaseModel } from 'app/base/models/general/base.model';

export class RespondentProjection extends BaseModel {
    baslik: string;
    aciklama: string;
    sayfalar: RespondentPage[];
    kurallar: RespondentRule[];
}

export class RespondentPage extends BaseModel {
    sayfaNo: number;
    sayfaBaslik: string;
    sayfaAciklama: string;
    sira: number;
    sorular: RespondentQuestion[];
}

export class RespondentQuestion extends BaseModel {
    soruMetni: string;
    soruTipKID: number;
    isZorunlu: boolean;
    yardimMetni: string;
    placeholder: string;
    sira: number;
    olcekMinDeger: number | null;
    olcekMaxDeger: number | null;
    olcekMinEtiket: string;
    olcekMaxEtiket: string;
    secenekler: RespondentOption[];
    matrisSatirlar: RespondentMatrisRow[];
    matrisSutunlar: RespondentMatrisCol[];
    altSorular: RespondentQuestion[];
}

export class RespondentOption extends BaseModel {
    secenekMetni: string;
    secenekDegeri: string;
    sira: number;
    isDiger: boolean;
    isAciklamaIsteniyor: boolean;
    isAciklamaZorunlu: boolean;
}

export class RespondentMatrisRow extends BaseModel {
    satirMetni: string;
    sira: number;
}

export class RespondentMatrisCol extends BaseModel {
    sutunMetni: string;
    sira: number;
}

export class RespondentRule extends BaseModel {
    kuralTipKID: number;
    kaynakSoruKokId: number | null;
    jsonData: string;
    sira: number;
}
