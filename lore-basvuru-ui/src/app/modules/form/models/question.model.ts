import { BaseModel } from 'app/base/models/general/base.model';
import { EidModel } from 'app/base/models/general/eid.model';
import { KodModel } from 'app/base/models/common/kod.model';
import { OptionDto } from './option.model';
import { MatrixRowDto } from './matrix-row.model';
import { MatrixColumnDto } from './matrix-column.model';

export class QuestionDto extends BaseModel {
    formKokEidDto?: EidModel | null = null;
    sayfaKokEidDto?: EidModel | null = null;
    soruKokEidDto?: EidModel | null = null;
    parentSoruKokEidDto?: EidModel | null = null;
    soruMetni?: string | null = null;
    soruTipKID?: number | null = null;
    soruTipKodDto?: KodModel | null = null;
    isZorunlu?: boolean | null = null;
    yardimMetni?: string | null = null;
    placeholder?: string | null = null;
    sira?: number | null = null;
    olcekMinDeger?: number | null = null;
    olcekMaxDeger?: number | null = null;
    olcekMinEtiket?: string | null = null;
    olcekMaxEtiket?: string | null = null;
    secenekler?: OptionDto[] | null = [];
    matrisSatirlar?: MatrixRowDto[] | null = [];
    matrisSutunlar?: MatrixColumnDto[] | null = [];
    altSorular?: QuestionDto[] | null = [];
}
