import { PermissionModel } from "../permission/permission.model";
import { WidgetModel } from "../widget/widget.model";

export class WidgetPermissionModel {
  widgetDto: WidgetModel;
  permissionDto: PermissionModel;
  permissionListDto: PermissionModel[] = [];
}
