import { BaseKuralModel } from './base-kural.model';

/**
 * Tarih Aralığı Kuralı (2020003)
 * Backend TarihAraligiKuralDto ile birebir eşleşir
 */
export class TarihAraligiKuralModel extends BaseKuralModel {
  BaslangicTarihi: Date | null;
  BitisTarihi: Date | null;

  constructor() {
    super();
    this.BaslangicTarihi = null;
    this.BitisTarihi = null;
  }
}
