import { MenuModel } from "../menu/menu.model";
import { PageModel } from "../page/page.model";
import { PermissionModel } from "../permission/permission.model";
import { WidgetModel } from "../widget/widget.model";
import { KisiTokenModel } from "./kisi-token.model";

export class LoginResponseModel {
    kisiTokenDto:KisiTokenModel;
    menuListDto: MenuModel[] = [];
    widgetListDto: WidgetModel[] = [];
    permissionListDto: PermissionModel[] = [];
    pageListDto: PageModel[] = [];
    ekranListDto: PageModel[] = [];  // LoreBaşvuru alias

    isDogrulamaGerekli: boolean = false;
    isEmailDogrulandi: boolean = false;
    isCepTelDogrulandi: boolean = false;
    isEdevletDogrulandi: boolean = false;
  }
