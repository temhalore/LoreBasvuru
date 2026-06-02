import { BaseModel } from '../general/base.model';

export class FormListItemModel extends BaseModel {
  formKokId: number;
  baslik: string;
  olusturulmaTarihi: string | null;
}
// Explanatory comment for Form List Item Model
