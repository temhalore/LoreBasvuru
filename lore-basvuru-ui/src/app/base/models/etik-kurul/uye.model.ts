import { BaseModel } from '../general/base.model';
import { GundemModel } from './gundem.model';
import { KisiModel } from '../security/user/kisi.model';

export class UyeModel extends BaseModel {
  gundemDto: GundemModel | null = null;
  kisiDto: KisiModel | null = null;
}
