import type { QuestionAnswerModel } from './question-answer.model';

export type FormSchemaSource = 'build' | 'draft-preview' | 'session-preview' | 'respondent';

export enum QuestionTypeId {
    KISA_METIN       = 1050001,
    UZUN_METIN       = 1050002,
    TEK_SECIM        = 1050003,
    COK_SECIM        = 1050004,
    ACILIR_LISTE     = 1050005,
    OLCEK            = 1050006,
    DERECELENDIRME   = 1050007,
    MATRIS_TEK_SECIM = 1050008,
    MATRIS_COK_SECIM = 1050009,
    TARIH            = 1050010,
    SAAT             = 1050011,
    SAYI             = 1050012,
    DOSYA_YUKLEME    = 1050013,
    SIRALAMA         = 1050014,
    TEKRARLI_GRUP    = 1050015,
    ACIKLAMA         = 1050016,
}

export interface QuestionOptionSchema {
    eid: string;
    label: string;
    value: string;
    order: number;
    isOther: boolean;
    asksForDescription: boolean;
    descriptionRequired: boolean;
}

export interface QuestionMatrixRowSchema {
    eid: string;
    label: string;
    order: number;
}

export interface QuestionMatrixColumnSchema {
    eid: string;
    label: string;
    order: number;
}

export interface GroupInstanceSchema {
    eid?: string | null;
    index: number;
    questions: QuestionSchema[];
    childAnswers?: Record<string, QuestionAnswerModel>;
    childGroupInstances?: Record<string, GroupInstanceSchema[]>;
}

export interface QuestionSchema {
    eid: string;
    questionTypeId: number;
    label: string;
    helpText: string;
    placeholder: string;
    order: number;
    required: boolean;
    minValue: number | null;
    maxValue: number | null;
    minLabel: string;
    maxLabel: string;
    options: QuestionOptionSchema[];
    matrixRows: QuestionMatrixRowSchema[];
    matrixColumns: QuestionMatrixColumnSchema[];
    children: QuestionSchema[];
}

export interface PageSchema {
    eid: string;
    order: number;
    title: string;
    description: string;
    questions: QuestionSchema[];
}

export interface FormSchema {
    title: string;
    description: string;
    source: FormSchemaSource;
    pages: PageSchema[];
}
