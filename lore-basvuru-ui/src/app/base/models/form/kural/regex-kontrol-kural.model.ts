import { BaseKuralModel } from './base-kural.model';

/**
 * Regex Kontrol Kuralı (2020001)
 * Backend RegexKontrolKuralDto ile birebir eşleşir
 */
export class RegexKontrolKuralModel extends BaseKuralModel {
  RegexPattern: string;

  constructor() {
    super();
    this.RegexPattern = '';
  }
}
