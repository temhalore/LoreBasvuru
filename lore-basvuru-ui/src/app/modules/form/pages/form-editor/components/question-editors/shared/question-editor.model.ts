import { MatrixColumnDto, MatrixRowDto, OptionDto, QuestionDto } from '../../../../../models';

export interface QuestionEditorFormValue {
    soruMetni: string;
    yardimMetni: string;
    placeholder: string;
    isZorunlu: boolean;
    olcekMinDeger: number | null;
    olcekMaxDeger: number | null;
    olcekMinEtiket: string;
    olcekMaxEtiket: string;
    secenekler: OptionDto[];
    matrisSatirlar: MatrixRowDto[];
    matrisSutunlar: MatrixColumnDto[];
}

export interface QuestionEditorSubmitEvent {
    question: QuestionDto;
}

