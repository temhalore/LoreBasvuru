import { KodModel } from '../../common/kod.model';
import { EidModel } from '../../general/eid.model';

/**
 * V2 kural kosul modeli.
 * Backend KuralKosulV2Dto ile birebir eslesir.
 * t_form_kural_json.JsonMetni icinde liste elemani olarak serialize edilir.
 */
export class KuralKosulV2Model {
  kosulTipKodDto: KodModel | null;
  soruKokEIdDto: EidModel | null;
  secenekEIdDto: EidModel | null;
  matrisSatirEIdDto: EidModel | null;
  matrisSutunEIdDto: EidModel | null;
  operatorKodDto: KodModel | null;
  degerTipiKodDto: KodModel | null;
  deger: string;
  deger2: string;
  joinKodDto: KodModel | null;
  maxDosyaBoyutuMB: number | null;
  minDosyaSayisi: number | null;
  maxDosyaSayisi: number | null;
  izinVerilenDosyaTipleri: KodModel[] | null;
  hataMesaji: string;

  constructor() {
    this.kosulTipKodDto = null;
    this.soruKokEIdDto = null;
    this.secenekEIdDto = null;
    this.matrisSatirEIdDto = null;
    this.matrisSutunEIdDto = null;
    this.operatorKodDto = null;
    this.degerTipiKodDto = null;
    this.deger = '';
    this.deger2 = '';
    this.joinKodDto = null;
    this.maxDosyaBoyutuMB = null;
    this.minDosyaSayisi = null;
    this.maxDosyaSayisi = null;
    this.izinVerilenDosyaTipleri = null;
    this.hataMesaji = '';
  }
}
