import { BaseModel } from '../../../base/models/general/base.model';

/** Backend: KullaniciBasvuruListDTO */
export class UserBasvuruModel extends BaseModel {
  basvuruFormId: number;
  formAd: string;
  formAciklama: string;
  durum: number;         // 1=Taslak, 2=Gonderildi, 3=Incelemede, 4=Tamamlandi
  durumAd: string;
  baslamaTarihi: Date;
  tamamlamaTarihi: Date;
  mevcutSayfaNo: number;
}

/** Backend: BasvuruBaslatResponseDTO */
export class BasvuruBaslatResponseDTO {
  basvuruId: number;
  basvuruEid: string;
  formAd: string;
  sayfaSayisi: number;
}

/** Backend: BasvuruDetayDTO */
export class BasvuruDetayModel extends BaseModel {
  basvuruFormId: number;
  durum: number;
  baslamaTarihi: Date;
  tamamlamaTarihi: Date;
  mevcutSayfaNo: number;
  formAd: string;
  formAciklama: string;
  cevaplar: CevapDetayModel[] = [];
}

/** Backend: CevapDetayDTO */
export class CevapDetayModel {
  soruId: number;
  deger: string;
  degerJson: string;
  soruEtiket: string;
  soruTipi: number;
}

/** Backend: CevapKaydetReqDTO */
export class CevapKaydetReqDTO {
  basvuruEid: string;
  sayfaNo: number;
  cevaplar: CevapItemDTO[] = [];
}

export class CevapItemDTO {
  soruId: number;
  deger: string;
  degerJson: string;
}

/** Listele filtresi (frontend sadece) */
export class BasvuruListeFiltresi {
  durum?: number;
  basvuruFormEid?: string;
  sayfa: number = 1;
  sayfaBoyutu: number = 20;
}
