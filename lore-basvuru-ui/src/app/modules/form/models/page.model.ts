import { BaseModel } from 'app/base/models/general/base.model';
import { EidModel } from 'app/base/models/general/eid.model';
import { QuestionDto } from './question.model';

export class PageDto extends BaseModel {
    formKokEidDto?: EidModel | null = null;
    sayfaNo?: number | null = null;
    sayfaBaslik?: string | null = null;
    sayfaAciklama?: string | null = null;
    sira?: number | null = null;
    sorular?: QuestionDto[] | null = [];
}
