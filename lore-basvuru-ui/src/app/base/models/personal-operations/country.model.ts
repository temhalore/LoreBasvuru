import { BaseModel } from '../general/base.model';

export class CountryModel extends BaseModel {
  code: number = 0;
  name: string = '';
  nameEn: string = '';
  globalCode: string = '';
  yokCode: number = 0;

  constructor(init?: Partial<CountryModel>) {
    super();
    Object.assign(this, init);
  }
}
