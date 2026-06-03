import { KisiModel } from "../user/kisi.model";
import { PageModel } from "../page/page.model";

export class KisiTokenModel {
  isLogin: boolean = false;
  appToken: string = '';
  expireDate: Date;
  kisiDto: KisiModel;

  // Ekran (sayfa) yetkileri — backend: ekranDtoList
  ekranDtoList: PageModel[] = [];

  // Widget yetkileri — backend: widgetKodlari (sadece kod stringleri)
  widgetKodlari: string[] = [];

  /**
   * @deprecated Eski layout bileşenleriyle TypeScript uyumluluğu için tutuldu.
   */
  userTypes?: string[];
  language?: string;
}
