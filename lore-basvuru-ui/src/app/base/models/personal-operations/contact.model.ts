import { BaseModel } from '../general/base.model';
import { KisiModel } from '../security/user/kisi.model';
import { KodDTO } from './kod-dto.model';

export class ContactModel extends BaseModel {
  userDto: KisiModel | null = null;
  contactTypeCodeDto: KodDTO | null = null;
  value: string = '';
  isActive: boolean = true;
  isPrefered: boolean = false;

  constructor(init?: Partial<ContactModel>) {
    super();
    Object.assign(this, init);
  }
}
