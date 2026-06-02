import { BaseKuralModel } from './base-kural.model';
import { KodModel } from '../../common/kod.model';

/**
 * Soru Revizyon Davranış Kuralı (2020008)
 * Backend SoruRevizyonDavranisKuralDto ile birebir eşleşir
 */
export class SoruRevizyonDavranisKuralModel extends BaseKuralModel {
  DavranisTipKodDto: KodModel | null;
  BilgilendirmeMesaji: string;

  constructor() {
    super();
    this.DavranisTipKodDto = null;
    this.BilgilendirmeMesaji = '';
  }
}
