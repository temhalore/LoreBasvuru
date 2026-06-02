import { BaseModel } from 'app/base/models/general/base.model';
import { EidModel } from 'app/base/models/general/eid.model';

export class MatrixRowDto extends BaseModel {
    soruKokEidDto?: EidModel | null = null;
    satirMetni?: string | null = null;
    sira?: number | null = null;
}
