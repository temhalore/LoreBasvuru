import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatrixColumnDto, MatrixRowDto, OptionDto, QuestionDto } from '../../../../../models';

export type OptionEditorGroup = FormGroup<{
    eid: FormControl<string>;
    soruKokEid: FormControl<string | null>;
    secenekMetni: FormControl<string>;
    secenekDegeri: FormControl<string>;
    sira: FormControl<number>;
    isDiger: FormControl<boolean>;
    isAciklamaIsteniyor: FormControl<boolean>;
    isAciklamaZorunlu: FormControl<boolean>;
}>;

export type MatrixRowEditorGroup = FormGroup<{
    eid: FormControl<string>;
    soruKokEid: FormControl<string | null>;
    satirMetni: FormControl<string>;
    sira: FormControl<number>;
}>;

export type MatrixColumnEditorGroup = FormGroup<{
    eid: FormControl<string>;
    soruKokEid: FormControl<string | null>;
    sutunMetni: FormControl<string>;
    sira: FormControl<number>;
}>;

export type QuestionEditorForm = FormGroup<{
    soruMetni: FormControl<string>;
    yardimMetni: FormControl<string>;
    placeholder: FormControl<string>;
    isZorunlu: FormControl<boolean>;
    olcekMinDeger: FormControl<number | null>;
    olcekMaxDeger: FormControl<number | null>;
    olcekMinEtiket: FormControl<string>;
    olcekMaxEtiket: FormControl<string>;
    secenekler: FormArray<OptionEditorGroup>;
    matrisSatirlar: FormArray<MatrixRowEditorGroup>;
    matrisSutunlar: FormArray<MatrixColumnEditorGroup>;
}>;

export function buildQuestionEditorForm(question: QuestionDto): QuestionEditorForm {
    return new FormGroup({
        soruMetni: new FormControl(question.soruMetni ?? '', { nonNullable: true }),
        yardimMetni: new FormControl(question.yardimMetni ?? '', { nonNullable: true }),
        placeholder: new FormControl(question.placeholder ?? '', { nonNullable: true }),
        isZorunlu: new FormControl(Boolean(question.isZorunlu), { nonNullable: true }),
        olcekMinDeger: new FormControl(question.olcekMinDeger ?? null),
        olcekMaxDeger: new FormControl(question.olcekMaxDeger ?? null),
        olcekMinEtiket: new FormControl(question.olcekMinEtiket ?? '', { nonNullable: true }),
        olcekMaxEtiket: new FormControl(question.olcekMaxEtiket ?? '', { nonNullable: true }),
        secenekler: new FormArray((question.secenekler ?? []).map(buildOptionGroup)),
        matrisSatirlar: new FormArray((question.matrisSatirlar ?? []).map(buildMatrixRowGroup)),
        matrisSutunlar: new FormArray((question.matrisSutunlar ?? []).map(buildMatrixColumnGroup)),
    });
}

export function applyQuestionEditorFormValue(question: QuestionDto, form: QuestionEditorForm): QuestionDto {
    const value = form.getRawValue();
    return {
        ...question,
        soruMetni: value.soruMetni.trim(),
        yardimMetni: value.yardimMetni.trim(),
        placeholder: value.placeholder.trim(),
        isZorunlu: value.isZorunlu,
        olcekMinDeger: value.olcekMinDeger,
        olcekMaxDeger: value.olcekMaxDeger,
        olcekMinEtiket: value.olcekMinEtiket.trim(),
        olcekMaxEtiket: value.olcekMaxEtiket.trim(),
        secenekler: value.secenekler.map((option, index) => ({
            eid: option.eid,
            soruKokEidDto: option.soruKokEid ? { eid: option.soruKokEid } : question.soruKokEidDto ?? { eid: question.eid },
            secenekMetni: option.secenekMetni.trim(),
            secenekDegeri: option.secenekDegeri.trim(),
            sira: index + 1,
            isDiger: option.isDiger,
            isAciklamaIsteniyor: option.isAciklamaIsteniyor,
            isAciklamaZorunlu: option.isAciklamaZorunlu,
        })),
        matrisSatirlar: value.matrisSatirlar.map((row, index) => ({
            eid: row.eid,
            soruKokEidDto: row.soruKokEid ? { eid: row.soruKokEid } : question.soruKokEidDto ?? { eid: question.eid },
            satirMetni: row.satirMetni.trim(),
            sira: index + 1,
        })),
        matrisSutunlar: value.matrisSutunlar.map((column, index) => ({
            eid: column.eid,
            soruKokEidDto: column.soruKokEid ? { eid: column.soruKokEid } : question.soruKokEidDto ?? { eid: question.eid },
            sutunMetni: column.sutunMetni.trim(),
            sira: index + 1,
        })),
    };
}

export function buildOptionGroup(option?: OptionDto): OptionEditorGroup {
    return new FormGroup({
        eid: new FormControl(option?.eid ?? createLocalEid('option'), { nonNullable: true }),
        soruKokEid: new FormControl(option?.soruKokEidDto?.eid ?? null),
        secenekMetni: new FormControl(option?.secenekMetni ?? '', { nonNullable: true, validators: [Validators.required] }),
        secenekDegeri: new FormControl(option?.secenekDegeri ?? '', { nonNullable: true }),
        sira: new FormControl(option?.sira ?? 0, { nonNullable: true }),
        isDiger: new FormControl(Boolean(option?.isDiger), { nonNullable: true }),
        isAciklamaIsteniyor: new FormControl(Boolean(option?.isAciklamaIsteniyor), { nonNullable: true }),
        isAciklamaZorunlu: new FormControl(Boolean(option?.isAciklamaZorunlu), { nonNullable: true }),
    });
}

export function buildMatrixRowGroup(row?: MatrixRowDto): MatrixRowEditorGroup {
    return new FormGroup({
        eid: new FormControl(row?.eid ?? createLocalEid('matrix-row'), { nonNullable: true }),
        soruKokEid: new FormControl(row?.soruKokEidDto?.eid ?? null),
        satirMetni: new FormControl(row?.satirMetni ?? '', { nonNullable: true, validators: [Validators.required] }),
        sira: new FormControl(row?.sira ?? 0, { nonNullable: true }),
    });
}

export function buildMatrixColumnGroup(column?: MatrixColumnDto): MatrixColumnEditorGroup {
    return new FormGroup({
        eid: new FormControl(column?.eid ?? createLocalEid('matrix-column'), { nonNullable: true }),
        soruKokEid: new FormControl(column?.soruKokEidDto?.eid ?? null),
        sutunMetni: new FormControl(column?.sutunMetni ?? '', { nonNullable: true, validators: [Validators.required] }),
        sira: new FormControl(column?.sira ?? 0, { nonNullable: true }),
    });
}

function createLocalEid(prefix: string): string {
    return `__local_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

