import { BaseModel } from 'app/base/models/general/base.model';
import { PageDto } from './page.model';
import { RuleDto } from './rule.model';
import { DiagnosticDto } from './diagnostic.model';

export class FormDto extends BaseModel {
    baslik?: string | null = null;
    aciklama?: string | null = null;
    isPublic?: boolean | null = null;
    yayinDurumKID?: number | null = null;
    sayfalar?: PageDto[] | null = [];
    kurallar?: RuleDto[] | null = [];
    tanilamalar?: DiagnosticDto[] | null = [];
}
