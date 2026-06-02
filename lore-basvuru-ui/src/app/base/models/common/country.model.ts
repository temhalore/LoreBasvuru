import { BaseModel } from '../general/base.model';

export class CountryModel extends BaseModel {
  name: string;
  code: string;
  phoneCode: string;
}
