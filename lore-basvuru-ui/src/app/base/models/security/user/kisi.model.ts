import { BaseModel } from "../../general/base.model";

export class KisiModel extends BaseModel {
  ad: string = '';
  soyad: string = '';
  email: string = '';
  telefon: string = '';
  tenantId: number | null = null;

  get name(): string { return this.ad; }
  set name(v: string) { this.ad = v; }

  get lastName(): string { return this.soyad; }
  set lastName(v: string) { this.soyad = v; }

  get adSoyad(): string { return (this.ad + ' ' + this.soyad).trim(); }

  /** @deprecated Fuse layout uyumlulugu */
  avatar?: string;
  status?: string;
  etikKurulRoleListDto?: any[];
}
