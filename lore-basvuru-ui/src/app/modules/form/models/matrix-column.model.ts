import { BaseModel } from 'app/base/models/general/base.model';
import { EidModel } from 'app/base/models/general/eid.model';

export class MatrixColumnDto extends BaseModel {
    soruKokEidDto?: EidModel | null = null;
    sutunMetni?: string | null = null;
    sira?: number | null = null;
}
