import { KodModel } from "app/base/models/common/kod.model";
import { BaseModel } from "app/base/models/general/base.model";
import { KisiModel } from "app/base/models/security/user/kisi.model";

export class DosyaModel extends BaseModel {
  dosyaAd: string = '';
  dosyaData: string = '';
  uzanti: string = '';
  boyut: number = 0;
  dosyaTipKodDto: KodModel = new KodModel();
  kisiDto: KisiModel = new KisiModel();
}
