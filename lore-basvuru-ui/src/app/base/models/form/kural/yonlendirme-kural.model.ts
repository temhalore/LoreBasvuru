import { BaseKuralModel } from './base-kural.model';
import { KodModel } from '../../common/kod.model';
import { EidModel } from '../../general/eid.model';
import { YonlendirmeKosulModel } from './yonlendirme-kosul.model';

/**
 * Yönlendirme Kuralı (2010003)
 * Backend YonlendirmeKuralDto ile birebir eşleşir
 */
export class YonlendirmeKuralModel extends BaseKuralModel {
  EylemTipKodDto: KodModel | null;
  HedefSayfaEIdDto: EidModel | null;
  HedefSoruKokEIdDto: EidModel | null;
  Kosullar: YonlendirmeKosulModel[];
  KosulBaglantiTipKodDto: KodModel | null;

  constructor() {
    super();
    this.EylemTipKodDto = null;
    this.HedefSayfaEIdDto = null;
    this.HedefSoruKokEIdDto = null;
    this.Kosullar = [];
    this.KosulBaglantiTipKodDto = null;
  }
}
