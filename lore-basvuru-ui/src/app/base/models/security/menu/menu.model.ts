import { BaseModel } from "../../general/base.model";
import { PageModel } from "../page/page.model";

export class MenuModel extends BaseModel {
  id: number;
  title: string;
  subtitle?: string;
  type: string; // 'basic' | 'collapsable' | 'divider' | 'group' | 'spacer'
  icon?: string;
  link?: string;
  pageDto?: PageModel;
  target?: string; // '_blank' | '_self' | '_parent' | '_top'
  exactMatch?: boolean;
  tooltip?: string;
  parentMenuDto?: MenuModel;
  orderIndex: number;
  tree?: string;
  isActive: boolean;
  disabled?: boolean;
  badge?: BadgeModel;
  children?: MenuModel[];
}

export class BadgeModel {
  title?: string;
  classes?: string;
}