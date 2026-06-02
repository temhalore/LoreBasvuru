import { KodModel } from "../../common/kod.model";
import { KisiModel } from "../user/kisi.model";

export class KisiTokenModel {
  loginName: string
  kisiDto: KisiModel;
  isLogin: boolean = false;
  loginAraciUygulamaToken: string;
  loginAraciUygulamaTipKodDto: KodModel;
  appToken: string;
  ip: string;
  userTypes: string[];
  expireDate: Date;
  language: string;
  yerineLoginAdminLoginName: string;
  createdDate: Date;
  updatedate: Date;
  userAgent: string;
  deleteReason: string;


}
