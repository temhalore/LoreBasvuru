// import { TreeNode } from 'primeng/api';
import { TreeNode } from 'app/shared/components';
import { RoleModel } from '../role/role.model';
import { WidgetModel } from '../widget/widget.model';

export class RoleWidgetModel {
  roleDto: RoleModel;
  widgetDto: WidgetModel;
  widgetListDto: WidgetModel[]=[];
  widgetTreeListDto :TreeNode[] =[]
}
