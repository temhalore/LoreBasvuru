import { BaseModel } from '../../../base/models/general/base.model';

export class UserBasvuruModel extends BaseModel {
  basvuruFormEid: string;
  basvuruFormAdi: string;
  durum: string;      // Taslak | Gonderildi | Onayda | Onaylandi | Reddedildi
  durumRenk: string;
  olusturmaTarihi: Date;
  guncellemeTarihi: Date;
  tenantEid: string;
}

export class BasvuruFormModel extends BaseModel {
  formAdi: string;
  formAciklama: string;
  aktif: boolean;
  tenantEid: string;
}

export class BasvuruListeFiltresi {
  durum?: string;
  basvuruFormEid?: string;
  sayfa: number = 1;
  sayfaBoyutu: number = 20;
}
