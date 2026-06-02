import { BaseModel } from '../general/base.model';
import { KisiModel } from '../security/user/kisi.model';
import { EtikKurulModel } from '../definition-operations/etik-kurul.model';

export class GundemModel extends BaseModel {
  name: string = '';
  description: string = '';
  etikKurulDto: EtikKurulModel | null = null;
  gundemTarihi: Date | string | null = null;
  isTamamlandi: boolean = false;
  isOnaylandi: boolean = false;
  sonuclarOnaylanabilir: boolean = false;
  gundemUyeleriList: KisiModel[] = [];
  uyeSearchValue: string = '';
  gundemBasvuruSayisi: number = 0;
}
