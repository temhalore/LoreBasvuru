import { BaseKuralModel } from './base-kural.model';

/**
 * Min-Max Karakter Kuralı (2020004)
 * Backend MinMaxKarakterKuralDto ile birebir eşleşir
 */
export class MinMaxKarakterKuralModel extends BaseKuralModel {
  MinKarakter: number | null;
  MaxKarakter: number | null;

  constructor() {
    super();
    this.MinKarakter = null;
    this.MaxKarakter = null;
  }
}
