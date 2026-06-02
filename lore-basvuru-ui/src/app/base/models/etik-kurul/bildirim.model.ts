import { RoleModel } from './../security/role/role.model';
import { KodModel } from '../common/kod.model';
import { EtikKurulModel } from '../definition-operations/etik-kurul.model';
import { BaseModel } from '../general/base.model';
import { ApplicationModel } from '../application-operations/application.model';
import { KisiModel } from '../security/user/kisi.model';

export class BildirimModel extends BaseModel {
  etikKurulDto: EtikKurulModel | null = null;
  bildirimTipKodDto: KodModel | null = null;
  applicationDto: ApplicationModel | null = null;
  gonderimTurKodDto: KodModel | null = null;
  gonderimTarihi: Date | string | null = null;
  gonderilenKisiDto: KisiModel | null = null;
  gonderimAdres: string = '';
  aciklama: string = '';
  kipSuccess: boolean | null = null;
  kipReturn: string = '';
  aliciRolDto: RoleModel | null = null;
}
