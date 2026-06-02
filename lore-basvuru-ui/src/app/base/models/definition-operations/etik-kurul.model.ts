import { BaseModel } from "../general/base.model";
import { FormListItemModel } from "../form/form-list-item.model";

export class EtikKurulModel extends BaseModel {
  name: string;
  description: string;
  basvuruFormKokId: number | null;
  basvuruFormu: FormListItemModel | null;
}



