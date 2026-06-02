import { BaseModel } from "../../general/base.model";

export interface KisiEtikKurulRoleModel {
  etikKurulDto?: {
    id?: number;
    eid?: string;
    name?: string;
  };
  isSekreter?: boolean;
  isBaskan?: boolean;
  isRaportor?: boolean;
  isSuperAdmin?: boolean;
  isBasvurucu?: boolean;
  isUye?: boolean;

}


export class KisiModel extends BaseModel {
  identificationNumber: string;
  name: string;
  lastName: string;
  fatherName: string;
  motherName: string;
  isUserCanSeeAllUnit: boolean;
  isActive: boolean;

  volumeNo: string;
  familyOrderNo: string;
  orderNo: string;
  userName: string;
  //public CodeDTO languageCodeDto: string;
  isRoleUser: boolean;
  //public FileDTO userImageDto: string;
  loginName: string;
  isPersonel: boolean;
  dilKodu: string;
  dogumTarihi: string;
  mernisSorguYapildi: boolean = false;
  avatar: boolean = false;
  email:string="";
  status:string="online";
  unvanAd:string="";
  etikKurulRoleListDto?: KisiEtikKurulRoleModel[];
}
