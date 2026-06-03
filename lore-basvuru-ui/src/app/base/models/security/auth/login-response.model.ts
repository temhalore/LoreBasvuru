import { PageModel } from "../page/page.model";
import { KisiTokenModel } from "./kisi-token.model";

export class LoginResponseModel {
    kisiTokenDto: KisiTokenModel = new KisiTokenModel();

    // Kolaylık için proxy getter'lar
    get ekranListDto(): PageModel[] { return this.kisiTokenDto?.ekranDtoList ?? []; }
    get widgetKodlari(): string[] { return this.kisiTokenDto?.widgetKodlari ?? []; }

    /**
     * @deprecated Eski sistemden kalma uyumluluk getter'ları — ekranDtoList kullanın
     */
    get menuListDto(): PageModel[] { return this.ekranListDto; }
    get pageListDto(): PageModel[] { return this.ekranListDto; }
  }
