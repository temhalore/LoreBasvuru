import { EtikKurulModel } from 'app/base/models/definition-operations/etik-kurul.model';
import { BaseModel } from '../general/base.model';
import { KodModel } from '../common/kod.model';
import { NotificationTemplatesModel } from './notification-templates.model';
import { RoleModel } from '../security/role/role.model';

export class NotificationPermissionModel extends BaseModel {
  etikKurulDto: EtikKurulModel | null = null;
  aliciRolDto: RoleModel | null = null;
  gonderilsinMi: boolean = false;
  templateDto: NotificationTemplatesModel | null = null;
  asamaKodDto: KodModel | null = null;
}
