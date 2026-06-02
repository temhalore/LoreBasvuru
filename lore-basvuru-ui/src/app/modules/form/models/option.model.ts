import { BaseModel } from 'app/base/models/general/base.model';
import { EidModel } from 'app/base/models/general/eid.model';

export class OptionDto extends BaseModel {
    soruKokEidDto?: EidModel | null = null;
    secenekMetni?: string | null = null;
    secenekDegeri?: string | null = null;
    sira?: number | null = null;
    isDiger?: boolean | null = null;
    isAciklamaIsteniyor?: boolean | null = null;
    isAciklamaZorunlu?: boolean | null = null;
}
