import { BaseModel } from 'app/base/models/general/base.model';
import { UserFormAnswer } from '../../form-respondent/models/form-respondent-canonical-state.model';
import {
    RespondentMatrisCol,
    RespondentMatrisRow,
    RespondentOption,
} from '../../form-respondent/models/form-respondent-projection.model';
import { EidPayload } from '../../../models/question-answer.model';

export type FormPreviewSource = 'draft' | 'session';

export class FormPreviewModel {
    formBaslik: string;
    formAciklama: string;
    bolumler: FormPreviewSection[];
    source: FormPreviewSource;
}

export class FormPreviewSection extends BaseModel {
    sayfaBaslik: string;
    sayfaAciklama: string;
    sira: number;
    sorular: FormPreviewQuestion[];
}

export class FormPreviewQuestion extends BaseModel {
    soruMetni: string;
    soruTipKID: number;
    isZorunlu: boolean;
    yardimMetni: string;
    placeholder: string;
    sira: number;
    olcekMinDeger: number | null;
    olcekMaxDeger: number | null;
    olcekMinEtiket: string;
    olcekMaxEtiket: string;
    secenekler: RespondentOption[];
    matrisSatirlar: RespondentMatrisRow[];
    matrisSutunlar: RespondentMatrisCol[];
    altSorular: FormPreviewQuestion[];
    answer?: UserFormAnswer;
    cevapKayitEidDtoler?: EidPayload[];
    grupInstances?: FormPreviewGroupInstance[];
}

export class FormPreviewGroupInstance extends BaseModel {
    sira: number;
    sorular: FormPreviewQuestion[];
}

