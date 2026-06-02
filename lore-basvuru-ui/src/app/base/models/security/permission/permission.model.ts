import { KodModel } from "../../common/kod.model";
import { BaseModel } from "../../general/base.model";

export class PermissionModel extends BaseModel {
  type: string
  area: string;
  controller: string;
  action: string;
  returnType: string;
  name: string;
  url: string;
  isWidgetPermission: boolean;
  isMenuPermission: boolean;
  permissionTypeCodeDto:KodModel;
}
