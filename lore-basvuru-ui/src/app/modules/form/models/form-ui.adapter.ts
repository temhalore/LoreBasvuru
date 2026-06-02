import { FormDto, MatrixColumnDto, MatrixRowDto, OptionDto, PageDto, QuestionDto } from './index';
import {
    FormSchema,
    FormSchemaSource,
    GroupInstanceSchema,
    PageSchema,
    QuestionMatrixColumnSchema,
    QuestionMatrixRowSchema,
    QuestionOptionSchema,
    QuestionSchema,
} from './form-schema.model';
import {
    GroupInstanceSnapshot,
    QuestionAnswerModel,
    QuestionFileModel,
    QuestionMatrixAnswerModel,
    QuestionSnapshot,
} from './question-answer.model';
import {
    FormPreviewModel,
    FormPreviewQuestion,
    FormPreviewSection,
} from '../pages/form-preview/models/form-preview.model';
import {
    RespondentMatrisCol,
    RespondentMatrisRow,
    RespondentOption,
    RespondentPage,
    RespondentProjection,
    RespondentQuestion,
} from '../pages/form-respondent/models/form-respondent-projection.model';
import { QuestionType } from '../pages/form-respondent/models/form-respondent.enums';
import { UserFormAnswer, UserFormMatrixRowAnswer, FormDosyaRef } from '../pages/form-respondent/models/form-respondent-canonical-state.model';

export function normalizeDateOnlyValue(value?: string | null): string | null {
    if (!value) {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const datePrefix = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    return datePrefix ? datePrefix[1] : trimmed;
}

export function mapUserFormAnswerToQuestionAnswer(answer?: UserFormAnswer): QuestionAnswerModel | undefined {
    if (!answer) {
        return undefined;
    }

    return {
        textValue: answer.cevapMetni,
        numericValue: answer.cevapSayi ?? null,
        dateValue: normalizeDateOnlyValue(answer.cevapTarih),
        rawDateValue: answer.cevapTarih ?? null,
        booleanValue: answer.cevapMantiksal ?? null,
        singleOptionEid: answer.secenekKokEidDto?.eid ?? null,
        multiOptionEids: (answer.secilenSecenekKokEidDtoler ?? []).map((item) => item.eid),
        extraText: answer.ekAciklama ?? null,
        matrixAnswers: (answer.matrisCevaplar ?? []).map(mapUserFormMatrixAnswerToQuestionMatrixAnswer),
        files: (answer.dosyalar ?? []).map(mapFormDosyaRefToQuestionFile),
    };
}

export function mapQuestionAnswerToSnapshot(
    questionEid: string,
    questionTypeId: number,
    answer?: QuestionAnswerModel,
): QuestionSnapshot {
    const snapshot: QuestionSnapshot = {
        soruKokEidDto: { eid: questionEid },
    };

    if (!answer) {
        return snapshot;
    }

    switch (questionTypeId) {
        case QuestionType.MATRIS_TEK_SECIM:
        case QuestionType.MATRIS_COK_SECIM:
            snapshot.matrisCevaplar = (answer.matrixAnswers ?? []).map((row) => ({
                matrisSatirKokEidDto: { eid: row.rowEid },
                matrisSutunKokEidDto: row.singleColumnEid ? { eid: row.singleColumnEid } : undefined,
                secilenSutunKokEidDtoler: (row.multiColumnEids ?? []).map((eid) => ({ eid })),
            }));
            break;
        case QuestionType.COK_SECIM:
            snapshot.secilenSecenekKokEidDtoler = (answer.multiOptionEids ?? []).map((eid) => ({ eid }));
            snapshot.ekAciklama = answer.extraText ?? undefined;
            break;
        case QuestionType.TEK_SECIM:
        case QuestionType.ACILIR_LISTE:
            snapshot.secenekKokEidDto = answer.singleOptionEid ? { eid: answer.singleOptionEid } : undefined;
            snapshot.ekAciklama = answer.extraText ?? undefined;
            break;
        case QuestionType.SAYI:
        case QuestionType.OLCEK:
        case QuestionType.DERECELENDIRME:
            snapshot.cevapSayi = answer.numericValue ?? undefined;
            break;
        case QuestionType.TARIH:
            snapshot.cevapTarih = normalizeDateOnlyValue(answer.dateValue) ?? undefined;
            break;
        case QuestionType.SAAT:
            snapshot.cevapMetni = answer.timeValue ?? answer.textValue ?? undefined;
            break;
        case QuestionType.DOSYA_YUKLEME:
            snapshot.silinecekDosyalar = (answer.deletedFileEids ?? []).map((eid) => ({ eid }));
            break;
        default:
            snapshot.cevapMetni = resolveTextSnapshotValue(questionTypeId, answer);
            snapshot.cevapMantiksal = answer.booleanValue ?? undefined;
            break;
    }

    return snapshot;
}

export function normalizeQuestionAnswerForType(
    questionTypeId: number,
    answer?: QuestionAnswerModel,
): QuestionAnswerModel | undefined {
    if (!answer) {
        return answer;
    }

    if (questionTypeId === QuestionType.SAAT && answer.timeValue == null && answer.textValue) {
        return {
            ...answer,
            timeValue: answer.textValue,
        };
    }

    if (questionTypeId === QuestionType.SIRALAMA && (answer.rankingOrder ?? []).length === 0 && answer.textValue) {
        return {
            ...answer,
            rankingOrder: answer.textValue
                .split(',')
                .map((item) => item.trim())
                .filter((item) => !!item),
        };
    }

    return answer;
}

// ─── Schema-based adapter functions ───────────────────────────────────────────

export function mapFormDtoToSchema(form: FormDto | null): FormSchema | null {
    if (!form) return null;
    return {
        title: form.baslik?.trim() || '',
        description: form.aciklama?.trim() || '',
        source: 'build',
        pages: (form.sayfalar ?? []).map(mapPageDtoToSchema),
    };
}

export function mapPageDtoToSchema(page: PageDto): PageSchema {
    return {
        eid: page.eid,
        order: page.sira ?? 0,
        title: page.sayfaBaslik?.trim() || '',
        description: page.sayfaAciklama?.trim() || '',
        questions: (page.sorular ?? []).map(mapQuestionDtoToSchema),
    };
}

export function mapQuestionDtoToSchema(question: QuestionDto): QuestionSchema {
    return {
        eid: question.eid,
        questionTypeId: question.soruTipKID ?? 0,
        label: question.soruMetni?.trim() || '',
        helpText: question.yardimMetni?.trim() || '',
        placeholder: question.placeholder?.trim() || '',
        order: question.sira ?? 0,
        required: Boolean(question.isZorunlu),
        minValue: question.olcekMinDeger ?? null,
        maxValue: question.olcekMaxDeger ?? null,
        minLabel: question.olcekMinEtiket?.trim() || '',
        maxLabel: question.olcekMaxEtiket?.trim() || '',
        options: (question.secenekler ?? []).map(mapOptionDtoToOptionSchema),
        matrixRows: (question.matrisSatirlar ?? []).map(mapMatrixRowDtoToRowSchema),
        matrixColumns: (question.matrisSutunlar ?? []).map(mapMatrixColumnDtoToColumnSchema),
        children: (question.altSorular ?? []).map(mapQuestionDtoToSchema),
    };
}

export function mapPreviewFormToSchema(preview: FormPreviewModel | null): FormSchema | null {
    if (!preview) return null;
    return {
        title: preview.formBaslik ?? '',
        description: preview.formAciklama ?? '',
        source: (preview.source === 'draft' ? 'draft-preview' : 'session-preview') as FormSchemaSource,
        pages: (preview.bolumler ?? []).map(mapPreviewSectionToSchema),
    };
}

export function mapPreviewSectionToSchema(section: FormPreviewSection): PageSchema {
    return {
        eid: section.eid,
        order: section.sira ?? 0,
        title: section.sayfaBaslik ?? '',
        description: section.sayfaAciklama ?? '',
        questions: (section.sorular ?? []).map(mapPreviewQuestionToSchema),
    };
}

export function mapPreviewQuestionToSchema(question: FormPreviewQuestion): QuestionSchema {
    return {
        eid: question.eid,
        questionTypeId: question.soruTipKID,
        label: question.soruMetni ?? '',
        helpText: question.yardimMetni ?? '',
        placeholder: question.placeholder ?? '',
        order: question.sira ?? 0,
        required: Boolean(question.isZorunlu),
        minValue: question.olcekMinDeger ?? null,
        maxValue: question.olcekMaxDeger ?? null,
        minLabel: question.olcekMinEtiket ?? '',
        maxLabel: question.olcekMaxEtiket ?? '',
        options: (question.secenekler ?? []).map(mapRespondentOptionToOptionSchema),
        matrixRows: (question.matrisSatirlar ?? []).map(mapRespondentRowToRowSchema),
        matrixColumns: (question.matrisSutunlar ?? []).map(mapRespondentColumnToColumnSchema),
        children: (question.altSorular ?? []).map(mapPreviewQuestionToSchema),
    };
}

export function mapRespondentProjectionToSchema(projection: RespondentProjection): FormSchema {
    return {
        title: projection.baslik ?? '',
        description: projection.aciklama ?? '',
        source: 'respondent',
        pages: (projection.sayfalar ?? []).map(mapRespondentPageToSchema),
    };
}

export function mapRespondentPageToSchema(page: RespondentPage): PageSchema {
    return {
        eid: page.eid,
        order: page.sira ?? 0,
        title: page.sayfaBaslik ?? '',
        description: page.sayfaAciklama ?? '',
        questions: (page.sorular ?? []).map(mapRespondentQuestionToSchema),
    };
}

export function mapRespondentQuestionToSchema(question: RespondentQuestion): QuestionSchema {
    return {
        eid: question.eid,
        questionTypeId: question.soruTipKID,
        label: question.soruMetni ?? '',
        helpText: question.yardimMetni ?? '',
        placeholder: question.placeholder ?? '',
        order: question.sira ?? 0,
        required: Boolean(question.isZorunlu),
        minValue: question.olcekMinDeger ?? null,
        maxValue: question.olcekMaxDeger ?? null,
        minLabel: question.olcekMinEtiket ?? '',
        maxLabel: question.olcekMaxEtiket ?? '',
        options: (question.secenekler ?? []).map(mapRespondentOptionToOptionSchema),
        matrixRows: (question.matrisSatirlar ?? []).map(mapRespondentRowToRowSchema),
        matrixColumns: (question.matrisSutunlar ?? []).map(mapRespondentColumnToColumnSchema),
        children: (question.altSorular ?? []).map(mapRespondentQuestionToSchema),
    };
}

// ─── Schema sub-model converters ──────────────────────────────────────────────

function mapOptionDtoToOptionSchema(option: OptionDto): QuestionOptionSchema {
    return {
        eid: option.eid,
        label: option.secenekMetni?.trim() || '',
        value: option.secenekDegeri?.trim() || '',
        order: option.sira ?? 0,
        isOther: Boolean(option.isDiger),
        asksForDescription: Boolean(option.isAciklamaIsteniyor),
        descriptionRequired: Boolean(option.isAciklamaZorunlu),
    };
}

function mapMatrixRowDtoToRowSchema(row: MatrixRowDto): QuestionMatrixRowSchema {
    return { eid: row.eid, label: row.satirMetni?.trim() || '', order: row.sira ?? 0 };
}

function mapMatrixColumnDtoToColumnSchema(column: MatrixColumnDto): QuestionMatrixColumnSchema {
    return { eid: column.eid, label: column.sutunMetni?.trim() || '', order: column.sira ?? 0 };
}

function mapRespondentOptionToOptionSchema(option: RespondentOption): QuestionOptionSchema {
    return {
        eid: option.eid,
        label: option.secenekMetni ?? '',
        value: option.secenekDegeri ?? '',
        order: option.sira ?? 0,
        isOther: option.isDiger ?? false,
        asksForDescription: option.isAciklamaIsteniyor ?? false,
        descriptionRequired: option.isAciklamaZorunlu ?? false,
    };
}

function mapRespondentRowToRowSchema(row: RespondentMatrisRow): QuestionMatrixRowSchema {
    return { eid: row.eid, label: row.satirMetni ?? '', order: row.sira ?? 0 };
}

function mapRespondentColumnToColumnSchema(column: RespondentMatrisCol): QuestionMatrixColumnSchema {
    return { eid: column.eid, label: column.sutunMetni ?? '', order: column.sira ?? 0 };
}

export function mapGroupInstanceSchemaToSnapshot(instance: GroupInstanceSchema): GroupInstanceSnapshot {
    return {
        grupInstanceEidDto: instance.eid && !instance.eid.startsWith('__local_')
            ? { eid: instance.eid }
            : undefined,
        sorular: instance.questions.map((q) => mapQuestionSchemaToSnapshot(q)),
    };
}

export function mapQuestionSchemaToSnapshot(
    schema: QuestionSchema,
    answer?: QuestionAnswerModel,
    groupInstances?: GroupInstanceSchema[],
): QuestionSnapshot {
    if (schema.questionTypeId === QuestionType.TEKRARLI_GRUP) {
        return {
            soruKokEidDto: { eid: schema.eid },
            grupInstances: (groupInstances ?? []).map(mapGroupInstanceSchemaToSnapshot),
        };
    }
    return mapQuestionAnswerToSnapshot(schema.eid, schema.questionTypeId, answer);
}

/**
 * Extracts initial answers from a FormPreviewModel into a flat keyed map.
 * Group instance answers use the scope key pattern `{instanceEid}:{questionEid}`.
 */
export function extractPreviewAnswers(
    preview: FormPreviewModel | null,
): Record<string, QuestionAnswerModel> {
    const result: Record<string, QuestionAnswerModel> = {};

    if (!preview) {
        return result;
    }

    for (const section of preview.bolumler ?? []) {
        for (const question of section.sorular ?? []) {
            collectPreviewQuestionAnswers(question, result, undefined);
        }
    }

    return result;
}

/**
 * Extracts group instances from a FormPreviewModel, keyed by top-level question eid.
 * Returns a map of questionEid → GroupInstanceSchema[].
 */
export function extractGroupInstancesFromPreview(
    preview: FormPreviewModel | null,
): Record<string, GroupInstanceSchema[]> {
    const result: Record<string, GroupInstanceSchema[]> = {};

    if (!preview) {
        return result;
    }

    for (const section of preview.bolumler ?? []) {
        for (const question of section.sorular ?? []) {
            collectPreviewGroupInstances(question, result);
        }
    }

    return result;
}

function collectPreviewGroupInstances(
    question: FormPreviewQuestion,
    result: Record<string, GroupInstanceSchema[]>,
): void {
    if (question.grupInstances?.length) {
        result[question.eid] = question.grupInstances.map((inst, index) => ({
            eid: inst.eid,
            index: inst.sira ?? (index + 1),
            questions: (inst.sorular ?? []).map(mapPreviewQuestionToSchema),
            childAnswers: buildChildAnswers(inst.sorular ?? []),
            childGroupInstances: buildChildGroupInstances(inst.sorular ?? []),
        }));
    }

    for (const child of question.altSorular ?? []) {
        collectPreviewGroupInstances(child, result);
    }
}

function buildChildAnswers(
    childQuestions: FormPreviewQuestion[],
): Record<string, QuestionAnswerModel> {
    const result: Record<string, QuestionAnswerModel> = {};

    for (const childQ of childQuestions) {
        const answer = mapUserFormAnswerToQuestionAnswer(childQ.answer);
        if (answer) {
            result[childQ.eid] =
                normalizeQuestionAnswerForType(childQ.soruTipKID, answer) ?? answer;
        }
    }

    return result;
}

function buildChildGroupInstances(
    childQuestions: FormPreviewQuestion[],
): Record<string, GroupInstanceSchema[]> {
    const result: Record<string, GroupInstanceSchema[]> = {};

    for (const childQ of childQuestions) {
        if (childQ.grupInstances?.length) {
            result[childQ.eid] = childQ.grupInstances.map((inst, index) => ({
                eid: inst.eid,
                index: inst.sira ?? (index + 1),
                questions: (inst.sorular ?? []).map(mapPreviewQuestionToSchema),
                childAnswers: buildChildAnswers(inst.sorular ?? []),
                childGroupInstances: buildChildGroupInstances(inst.sorular ?? []),
            }));
        }
    }

    return result;
}

function collectPreviewQuestionAnswers(
    question: FormPreviewQuestion,
    result: Record<string, QuestionAnswerModel>,
    instanceScopeKey: string | undefined,
): void {
    const answer = mapUserFormAnswerToQuestionAnswer(question.answer);
    if (answer) {
        const key = instanceScopeKey ? `${instanceScopeKey}:${question.eid}` : question.eid;
        result[key] = normalizeQuestionAnswerForType(question.soruTipKID, answer) ?? answer;
    }

    for (const child of question.altSorular ?? []) {
        collectPreviewQuestionAnswers(child, result, instanceScopeKey);
    }

    for (const instance of question.grupInstances ?? []) {
        const scopeKey = instance.eid ?? `${question.eid}__group_${instance.sira ?? 0}`;
        for (const instanceQuestion of instance.sorular ?? []) {
            collectPreviewQuestionAnswers(instanceQuestion, result, scopeKey);
        }
    }
}

function mapUserFormMatrixAnswerToQuestionMatrixAnswer(answer: UserFormMatrixRowAnswer): QuestionMatrixAnswerModel {
    return {
        rowEid: answer.matrisSatirKokEidDto.eid,
        singleColumnEid: answer.matrisSutunKokEidDto?.eid ?? null,
        multiColumnEids: (answer.secilenSutunKokEidDtoler ?? []).map((item) => item.eid),
    };
}

function mapFormDosyaRefToQuestionFile(file: FormDosyaRef): QuestionFileModel {
    return {
        eid: file.eid ?? file.dosyaDto?.eid ?? '',
        label: file.dosyaAd ?? file.dosyaDto?.dosyaAd ?? '',
        url: file.url ?? file.dosyaDto?.minIo_url ?? '',
        extension: file.uzanti ?? file.dosyaDto?.uzanti ?? '',
        size: file.boyut ?? file.dosyaDto?.boyut ?? 0,
    };
}

function resolveTextSnapshotValue(questionTypeId: number, answer: QuestionAnswerModel): string | undefined {
    if (questionTypeId === QuestionType.SIRALAMA) {
        return (answer.rankingOrder ?? []).join(',');
    }

    return answer.textValue;
}
