import { BaseModel } from "../../general/base.model";

export class KisiModel extends BaseModel {
  // LoreBaşvuru backend KisiDTO alanları
  ad: string = '';
  soyad: string = '';
  email: string = '';
  telefon: string = '';
  tenantId: number | null = null;

  // Geriye dönük uyumluluk için referans alanları
  get name(): string { return this.ad; }
  set name(v: string) { this.ad = v; }

  get lastName(): string { return this.soyad; }
  set lastName(v: string) { this.soyad = v; }

  get adSoyad(): string { return `${this.ad} ${this.soyad}`.trim(); }

  /**
   * @deprecated Eski etik-kurul sistemi — artık kullanılmıyor.
   * Layout bileşenleriyle TypeScript uyumluluğu için tutuldu.
   */
  etikKurulRoleListDto?: any[];
}
