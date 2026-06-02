import { KodModel } from '../common/kod.model';
import { BaseModel } from '../general/base.model';
import { KisiModel } from '../security/user/kisi.model';

export class BasvuruTarihceModel extends BaseModel {
  basvuruId: number;
  eskiAsamaKodDto: KodModel;
  yeniAsamaKodDto: KodModel;
  islemYapanKisiDto: KisiModel;
  islemTarihi: string | null;
  islemDetay: string;

  constructor() {
    super();
    this.basvuruId = 0;
    this.eskiAsamaKodDto = new KodModel();
    this.yeniAsamaKodDto = new KodModel();
    this.islemYapanKisiDto = new KisiModel();
    this.islemTarihi = null;
    this.islemDetay = '';
  }
}
