import { BaseKuralModel } from './base-kural.model';
import { KodModel } from '../../common/kod.model';

/**
 * Dosya Kısıtlamaları Kuralı (2020005)
 * Backend DosyaKisitlamariKuralDto ile birebir eşleşir
 */
export class DosyaKisitlamalariKuralModel extends BaseKuralModel {
  IzinVerilenUzantiKodList: KodModel[];
  MaxDosyaBoyutuMB: number | null;
  MinDosyaBoyutuMB: number | null;
  MaxDosyaAdedi: number | null;
  MinDosyaAdedi: number | null;

  constructor() {
    super();
    this.IzinVerilenUzantiKodList = [];
    this.MaxDosyaBoyutuMB = null;
    this.MinDosyaBoyutuMB = null;
    this.MaxDosyaAdedi = null;
    this.MinDosyaAdedi = null;
  }
}
