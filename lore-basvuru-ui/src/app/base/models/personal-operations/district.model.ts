import { BaseModel } from '../general/base.model';

export class DistrictModel extends BaseModel {
  code: number = 0;
  name: string = '';
  provinceCode: number = 0;

  constructor(init?: Partial<DistrictModel>) {
    super();
    Object.assign(this, init);
  }
}
