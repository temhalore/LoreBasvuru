import { BaseModel } from "../../general/base.model";
import { PageModel } from "../page/page.model";

export class WidgetModel extends BaseModel {
  name: string;
  selector: string;
  pageDto: PageModel;
  orderNo: number;
  isRoleWidget: boolean;
  // LoreBaşvuru alanları (optional)
  widgetAdi?: string;
  widgetKodu?: string;
  ekranEid?: string;
}
