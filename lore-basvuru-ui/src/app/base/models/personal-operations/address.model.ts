import { BaseModel } from '../general/base.model';
import { KisiModel } from '../security/user/kisi.model';
import { CountryModel } from './country.model';
import { DistrictModel } from './district.model';
import { KodDTO } from './kod-dto.model';
import { ProvinceModel } from './province.model';

export class AddressModel extends BaseModel {
  userDto: KisiModel | null = null;
  addressTypeCodeDto: KodDTO | null = null;
  countryDto: CountryModel | null = null;
  country: string = '';
  provinceDto: ProvinceModel | null = null;
  province: string = '';
  districtDto: DistrictModel | null = null;
  district: string = '';
  address: string = '';
  latitude: string = '';
  longitude: string = '';
  isActive: boolean = true;

  constructor(init?: Partial<AddressModel>) {
    super();
    Object.assign(this, init);
  }
}
