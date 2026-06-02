import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { TextInputComponent } from 'app/shared/components/form-controls/text-input/text-input.component';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { QuestionDto } from '../../../../../models';
import { FORM_EDITOR_CONFIRM } from '../../../form-editor.messages';
import { QuestionTypeId } from '../../../../../models/form-schema.model';
import { CommonQuestionEditorComponent } from '../common-question-editor/common-question-editor.component';
import { MatrixListEditorComponent } from '../matrix-list-editor/matrix-list-editor.component';
import { OptionListEditorComponent } from '../option-list-editor/option-list-editor.component';
import {
    applyQuestionEditorFormValue,
    buildMatrixColumnGroup,
    buildMatrixRowGroup,
    buildOptionGroup,
    buildQuestionEditorForm,
    QuestionEditorForm,
} from '../shared/question-editor-form.factory';

@Component({
    selector: 'app-question-editor-outlet',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        TextInputComponent,
        CommonQuestionEditorComponent,
        OptionListEditorComponent,
        MatrixListEditorComponent,
    ],
    templateUrl: './question-editor-outlet.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionEditorOutletComponent implements OnChanges {
    @Input() draft: QuestionDto | null = null;
    @Input() isSaving = false;
    @Input() error: string | null = null;

    @Output() readonly save = new EventEmitter<QuestionDto>();
    @Output() readonly cancel = new EventEmitter<string>();
    @Output() readonly dirtyChange = new EventEmitter<boolean>();

    readonly QuestionTypeId = QuestionTypeId;
    form: QuestionEditorForm | null = null;
    localError: string | null = null;
    private formDirtySubscription: Subscription | null = null;

    constructor(private readonly sweetAlert: SweetAlertService) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['draft'] && this.draft) {
            this.form = buildQuestionEditorForm(this.draft);
            this.localError = null;
            this.bindDirtyTracking();
        }
    }

    ngOnDestroy(): void {
        this.formDirtySubscription?.unsubscribe();
    }

    submit(): void {
        if (!this.draft || !this.form) {
            return;
        }

        this.localError = null;
        this.ensureMinimumTypeCollections();

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        if (!this.validateScaleValues()) {
            return;
        }

        const nextDraft = applyQuestionEditorFormValue(this.draft, this.form);
        this.save.emit(this.isDescriptionQuestion ? this.cleanDescriptionDraft(nextDraft) : nextDraft);
    }

    async cancelEdit(): Promise<void> {
        if (this.form?.dirty
            && !(await this.sweetAlert.confirm(FORM_EDITOR_CONFIRM.discardTitle, FORM_EDITOR_CONFIRM.discardText))) {
            return;
        }

        if (this.draft?.eid) {
            this.cancel.emit(this.draft.eid);
        }
    }

    get showOptionsEditor(): boolean {
        if (this.isDescriptionQuestion) {
            return false;
        }

        switch (this.draft?.soruTipKID) {
            case QuestionTypeId.TEK_SECIM:
            case QuestionTypeId.COK_SECIM:
            case QuestionTypeId.ACILIR_LISTE:
            case QuestionTypeId.SIRALAMA:
                return true;
            default:
                return false;
        }
    }

    get showMatrixEditor(): boolean {
        if (this.isDescriptionQuestion) {
            return false;
        }

        return this.draft?.soruTipKID === QuestionTypeId.MATRIS_TEK_SECIM
            || this.draft?.soruTipKID === QuestionTypeId.MATRIS_COK_SECIM;
    }

    get showScaleEditor(): boolean {
        if (this.isDescriptionQuestion) {
            return false;
        }

        return this.draft?.soruTipKID === QuestionTypeId.OLCEK
            || this.draft?.soruTipKID === QuestionTypeId.DERECELENDIRME;
    }

    get isDescriptionQuestion(): boolean {
        return this.draft?.soruTipKID === QuestionTypeId.ACIKLAMA;
    }

    get visibleError(): string | null {
        return this.localError || this.error;
    }

    private ensureMinimumTypeCollections(): void {
        if (!this.form) {
            return;
        }

        if (this.showOptionsEditor && this.form.controls.secenekler.length === 0) {
            this.form.controls.secenekler.push(buildOptionGroup());
        }

        if (this.showMatrixEditor) {
            if (this.form.controls.matrisSatirlar.length === 0) {
                this.form.controls.matrisSatirlar.push(buildMatrixRowGroup());
            }

            if (this.form.controls.matrisSutunlar.length === 0) {
                this.form.controls.matrisSutunlar.push(buildMatrixColumnGroup());
            }
        }
    }

    private validateScaleValues(): boolean {
        if (!this.form || !this.showScaleEditor) {
            return true;
        }

        const value = this.form.getRawValue();
        if (value.olcekMinDeger != null && value.olcekMaxDeger != null && Number(value.olcekMinDeger) > Number(value.olcekMaxDeger)) {
            this.localError = 'Min deger max degerden buyuk olamaz.';
            return false;
        }

        return true;
    }

    private cleanDescriptionDraft(question: QuestionDto): QuestionDto {
        return {
            ...question,
            yardimMetni: '',
            placeholder: '',
            isZorunlu: false,
            olcekMinDeger: null,
            olcekMaxDeger: null,
            olcekMinEtiket: '',
            olcekMaxEtiket: '',
            secenekler: [],
            matrisSatirlar: [],
            matrisSutunlar: [],
            altSorular: [],
        };
    }

    private bindDirtyTracking(): void {
        this.formDirtySubscription?.unsubscribe();

        if (!this.form) {
            this.dirtyChange.emit(false);
            return;
        }

        this.dirtyChange.emit(this.form.dirty);
        this.formDirtySubscription = this.form.valueChanges.subscribe(() => {
            this.dirtyChange.emit(this.form?.dirty ?? false);
        });
    }
}

