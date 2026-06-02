import { BaseModel } from '../general/base.model';
import { KodModel } from '../common/kod.model';

export class NotificationTemplatesModel extends BaseModel {
  tanim: string = '';
  konu: string = '';
  icerik: string = '';
  gonderimSekliKodDto: KodModel | null = null;
  bildirimTipKodDto: KodModel | null = null;
}
