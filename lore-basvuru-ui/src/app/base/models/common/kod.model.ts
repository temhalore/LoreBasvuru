export class KodModel {
    id: number;
    tipId: number;
    kod: string;
    kisaAd: string;
    sira: number;
    isAktif: boolean;
    digerUygEnumAd: string;
    digerUygEnumDeger: string;
    ustKodDTO: KodModel | null;
}