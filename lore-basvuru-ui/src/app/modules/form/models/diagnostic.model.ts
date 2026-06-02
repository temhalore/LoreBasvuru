import { BaseModel } from 'app/base/models/general/base.model';

export class DiagnosticDto extends BaseModel {
    code?: string | null = null;
    severity?: string | null = null;
    message?: string | null = null;
    targetType?: string | null = null;
    targetKey?: string | null = null;
    details?: string | null = null;
}
