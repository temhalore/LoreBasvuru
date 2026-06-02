import { BaseModel } from '../../general/base.model';
import { KodModel } from '../../common/kod.model';
import { EidModel } from '../../general/eid.model';

/**
 * Yönlendirme Koşulu
 * Backend YonlendirmeKosulDto ile birebir eşleşir
 */
export class YonlendirmeKosulModel extends BaseModel {
  KosulTipKodDto: KodModel | null;
  SoruKokEIdDto: EidModel | null;
  SecenekEIdDto: EidModel | null;
  MatrisSatirEIdDto: EidModel | null;
  MatrisSutunEIdDto: EidModel | null;
  OperatorKodDto: KodModel | null;
  KarsilastirmaDegeri: string;
  AramaMetni: string;

  constructor() {
    super();
    this.KosulTipKodDto = null;
    this.SoruKokEIdDto = null;
    this.SecenekEIdDto = null;
    this.MatrisSatirEIdDto = null;
    this.MatrisSutunEIdDto = null;
    this.OperatorKodDto = null;
    this.KarsilastirmaDegeri = '';
    this.AramaMetni = '';
  }
}
