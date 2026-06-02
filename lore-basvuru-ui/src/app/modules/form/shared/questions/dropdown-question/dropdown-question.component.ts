import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { QuestionBaseComponent } from '../question-base.component';
import { QuestionAnswerModel } from '../../../models/question-answer.model';
import { RichTextViewComponent } from '../../components/rich-text-view/rich-text-view.component';
import { richTextToPlainText } from '../../utils/rich-text.util';

@Component({
    selector: 'app-dropdown-question',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RichTextViewComponent],
    templateUrl: './dropdown-question.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownQuestionComponent extends QuestionBaseComponent {

    readonly extraTextControl = new FormControl('', { nonNullable: true });

    ngOnChanges(): void {
        this.extraTextControl.setValue(this.extraText ?? '', { emitEvent: false });
        this.applyValidators();
    }

    get value(): string | null {
        return this.answer?.singleOptionEid ?? null;
    }

    get extraText(): string | null {
        return this.answer?.extraText ?? null;
    }

    get selectedOptionLabel(): string {
        if (!this.value) {
            return 'Yanıt verilmedi';
        }

        return this.selectedBaseOptionLabel;
    }

    get selectedBaseOptionLabel(): string {
        const option = this.schema.options.find((item) => item.eid === this.value);
        return option?.label ?? 'Yanıt verilmedi';
    }

    emitValue(event: Event): void {
        if (!this.canEmitAnswer()) {
            return;
        }

        const target = event.target as HTMLSelectElement | null;
        const optionEid = target?.value || null;
        this.applyValidators(optionEid);
        const nextAnswer: QuestionAnswerModel = {
            ...(this.answer ?? {}),
            singleOptionEid: optionEid,
            extraText: this.isOtherSelected(optionEid) ? this.extraTextControl.value || null : null,
        };
        this.answerChange.emit(nextAnswer);
    }

    onExtraTextInput(event: Event): void {
        if (!this.canEmitAnswer()) {
            return;
        }

        const target = event.target as HTMLInputElement | null;
        const nextValue = target?.value ?? '';
        this.extraTextControl.setValue(nextValue, { emitEvent: false });
        const nextAnswer: QuestionAnswerModel = {
            ...(this.answer ?? {}),
            singleOptionEid: this.value,
            extraText: nextValue || null,
        };
        this.answerChange.emit(nextAnswer);
    }

    isOtherSelected(optionEid: string | null): boolean {
        const selectedOption = this.schema.options.find((option) => option.eid === optionEid);
        return !!selectedOption?.asksForDescription;
    }

    trackByEid(_: number, item: { eid: string }): string {
        return item.eid;
    }

    plainOptionLabel(label: string): string {
        return richTextToPlainText(label);
    }

    private applyValidators(optionEid: string | null = this.value): void {
        const selectedOption = this.schema.options.find((option) => option.eid === optionEid);
        if (selectedOption?.descriptionRequired) {
            this.extraTextControl.setValidators([Validators.required]);
        } else {
            this.extraTextControl.clearValidators();
        }
        this.extraTextControl.updateValueAndValidity({ emitEvent: false });
    }
}
