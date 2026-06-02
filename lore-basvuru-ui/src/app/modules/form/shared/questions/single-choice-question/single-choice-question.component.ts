import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { QuestionAnswerModel } from '../../../models/question-answer.model';
import { QuestionBaseComponent } from '../question-base.component';
import { RichTextViewComponent } from '../../components/rich-text-view/rich-text-view.component';

@Component({
    selector: 'app-single-choice-question',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RichTextViewComponent],
    templateUrl: './single-choice-question.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SingleChoiceQuestionComponent extends QuestionBaseComponent {

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

    selectOption(optionEid: string): void {
        if (!this.canEmitAnswer()) return;

        const nextAnswer: QuestionAnswerModel = {
            ...(this.answer ?? {}),
            singleOptionEid: optionEid,
            extraText: this.isOtherSelected(optionEid) ? this.extraTextControl.value || null : null,
        };
        this.answerChange.emit(nextAnswer);
        this.applyValidators(optionEid);
    }

    onExtraTextInput(event: Event): void {
        if (!this.canEmitAnswer()) return;

        const target = event.target as HTMLInputElement | null;
        const nextValue = target?.value ?? '';
        this.extraTextControl.setValue(nextValue, { emitEvent: false });
        this.answerChange.emit({
            ...(this.answer ?? {}),
            singleOptionEid: this.value,
            extraText: nextValue || null,
        });
    }

    isOtherSelected(optionEid: string | null): boolean {
        return !!this.schema.options.find((option) => option.eid === optionEid)?.asksForDescription;
    }

    trackByEid(_: number, item: { eid: string }): string {
        return item.eid;
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
