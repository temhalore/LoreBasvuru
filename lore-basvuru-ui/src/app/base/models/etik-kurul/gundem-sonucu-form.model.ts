import { ApplicationModel } from '../application-operations/application.model';
import { BaseModel } from '../general/base.model';
import { KodDTO } from '../personal-operations/kod-dto.model';
import { GundemModel } from './gundem.model';

export class GundemSonucuFormModel extends BaseModel {
  gundemDto: GundemModel | null = null;
  applicationDto: ApplicationModel | null = null;
  gundemAsamaKodDto:KodDTO | null = null;
}
