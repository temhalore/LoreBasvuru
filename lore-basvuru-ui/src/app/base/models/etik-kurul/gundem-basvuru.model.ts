import { BaseModel } from '../general/base.model';
import { GundemModel } from './gundem.model';
import { ApplicationModel } from '../application-operations/application.model';
import { KodModel } from '../common/kod.model';

export class GundemBasvuruModel extends BaseModel {
  gundemDto: GundemModel | null = null;
  applicationDto: ApplicationModel | null = null;
  applicationDtoList: BaseModel[] = [];
  gundemAsamaDto: KodModel | null = null;
  atamaTarihi: Date | string | null = null;
  atayanKisiAdSoyad: string = '';
  isSonucGirildi: boolean = false;
}
