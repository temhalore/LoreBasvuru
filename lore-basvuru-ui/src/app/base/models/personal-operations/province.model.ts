import { BaseModel } from '../general/base.model';

export class ProvinceModel extends BaseModel {
  code: number = 0;
  name: string = '';
  countryCode: number = 0;

  constructor(init?: Partial<ProvinceModel>) {
    super();
    Object.assign(this, init);
  }
}
