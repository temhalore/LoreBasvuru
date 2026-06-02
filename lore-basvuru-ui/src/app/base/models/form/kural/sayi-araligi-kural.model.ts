import { BaseKuralModel } from './base-kural.model';

/**
 * Sayı Aralığı Kuralı (2020002)
 * Backend SayiAraligiKuralDto ile birebir eşleşir
 */
export class SayiAraligiKuralModel extends BaseKuralModel {
  MinDeger: number | null;
  MaxDeger: number | null;

  constructor() {
    super();
    this.MinDeger = null;
    this.MaxDeger = null;
  }
}
