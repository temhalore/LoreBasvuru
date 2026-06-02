import { BaseModel } from "../../general/base.model";

export class PageModel extends BaseModel {
  name: string;
  menuTree:string;
  routerLink: string;
  ekranYolu: string;  // LoreBaşvuru alias
  ekranAdi: string;
  ekranKodu: string;
  ikon: string;
  ustEkranEid: string;
  altEkranlar: PageModel[] = [];
  orderNo: number;
}

// LoreBaşvuru alias
export { PageModel as EkranModel };
