import { BaseModel } from 'app/base/models/general/base.model';
import { EidModel } from 'app/base/models/general/eid.model';

export class RuleDto extends BaseModel {
    formKokEidDto?: EidModel | null = null;
    soruKokEidDto?: EidModel | null = null;
    kuralAdi?: string | null = null;
    kuralTipKID?: number | null = null;
    kuralJsonEidDto?: EidModel | null = null;
    jsonData?: string | null = null;
    sira?: number | null = null;
    isAktif?: boolean | null = null;
}
