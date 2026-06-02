import { BaseModel } from '../../../../../base/models/general/base.model';

export class FormCreateReqModel extends BaseModel {
	baslik = '';
	aciklama = '';
	isPublic = false;
}
