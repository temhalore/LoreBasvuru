import { BaseModel } from 'app/base/models/general/base.model';

export interface EidPayload {
    eid: string;
}

export interface QuestionFileModel {
    eid: string;
    label: string;
    url: string;
    extension: string;
    size: number;
}

export interface QuestionMatrixAnswerModel {
    rowEid: string;
    singleColumnEid?: string | null;
    multiColumnEids?: string[];
}

export interface QuestionAnswerModel {
    textValue?: string;
    numericValue?: number | null;
    dateValue?: string | null;
    rawDateValue?: string | null;
    timeValue?: string | null;
    booleanValue?: boolean | null;
    singleOptionEid?: string | null;
    multiOptionEids?: string[];
    extraText?: string | null;
    rankingOrder?: string[];
    matrixAnswers?: QuestionMatrixAnswerModel[];
    files?: QuestionFileModel[];
    deletedFileEids?: string[];
}

export interface MatrixRowSnapshot {
    matrisSatirKokEidDto: EidPayload;
    matrisSutunKokEidDto?: EidPayload;
    secilenSutunKokEidDtoler?: EidPayload[];
}

export interface GroupInstanceSnapshot {
    grupInstanceEidDto?: EidPayload;
    sorular: QuestionSnapshot[];
}

export interface QuestionSnapshot {
    soruKokEidDto: EidPayload;
    cevapMetni?: string;
    cevapSayi?: number;
    cevapTarih?: string;
    cevapMantiksal?: boolean;
    secenekKokEidDto?: EidPayload;
    ekAciklama?: string;
    secilenSecenekKokEidDtoler?: EidPayload[];
    matrisCevaplar?: MatrixRowSnapshot[];
    grupInstances?: GroupInstanceSnapshot[];
    silinecekDosyalar?: EidPayload[];
}

export interface UserFormIssue {
    code: string;
    severity: string;
    message: string;
    targetType: string;
    targetKey: string;
    targetEid?: string | null;
    targetGroupInstanceEid?: string | null;
    details?: string;
}

export interface UserFormSubmitResponse {
    basarili: boolean;
    mesaj: string;
    yeniDurumKID: number;
    tamamlanmaTarih: string | null;
    hatalar: UserFormIssue[] | null;
}

export interface UserFormSavePageRequest {
    eid: string;
    sayfaKokEidDto: EidPayload;
    sorular: QuestionSnapshot[];
}

export interface UserFormPageStateResponse extends BaseModel {
    sayfaKokEidDto: EidPayload;
}

export interface FormIlermeDto {
    toplamGorunurSoru: number;
    tamamlananSoru: number;
    yuzdeOrani: number;
}

export interface UserFormSavePageResponse {
    basarili: boolean;
    mesaj: string;
    sayfaKokEidDto: EidPayload;
    formDurumKID: number;
    sonKayitTarih: string | null;
    hatalar: UserFormIssue[] | null;
    pageState: unknown;
    ilerlemeDurumu?: FormIlermeDto | null;
}

export type ValidationError = UserFormIssue;
export type SubmitFormResponse = UserFormSubmitResponse;
export type SavePageSnapshotRequest = UserFormSavePageRequest;
export type SavePageSnapshotResponse = UserFormSavePageResponse;
