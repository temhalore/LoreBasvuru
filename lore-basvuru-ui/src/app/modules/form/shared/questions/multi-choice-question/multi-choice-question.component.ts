import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { QuestionAnswerModel } from '../../../models/question-answer.model';
import { RichTextViewComponent } from '../../components/rich-text-view/rich-text-view.component';
import { QuestionBaseComponent } from '../question-base.component';

@Component({
    selector: 'app-multi-choice-question',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RichTextViewComponent],
    templateUrl: './multi-choice-question.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiChoiceQuestionComponent extends QuestionBaseComponent {

    readonly extraTextControl = new FormControl('', { nonNullable: true });

    ngOnChanges(): void {
        this.extraTextControl.setValue(this.extraText ?? '', { emitEvent: false });
        this.applyValidators();
    }

    get value(): string[] {
        return this.answer?.multiOptionEids ?? [];
    }

    get extraText(): string | null {
        return this.answer?.extraText ?? null;
    }

    get selectedOptionItems(): Array<{ eid: string; label: string }> {
        return this.schema.options
            .filter((option) => this.value.includes(option.eid))
            .map((option) => ({ eid: option.eid, label: option.label }));
    }

    toggleOption(optionEid: string, event: Event): void {
        if (!this.canEmitAnswer()) {
            return;
        }

        const target = event.target as HTMLInputElement | null;
        const selectedOptions = new Set(this.value);

        if (target?.checked) {
            selectedOptions.add(optionEid);
        } else {
            selectedOptions.delete(optionEid);
        }

        const nextOptionEids = [...selectedOptions];
        this.applyValidators(nextOptionEids);
        const nextAnswer: QuestionAnswerModel = {
            ...(this.answer ?? {}),
            multiOptionEids: nextOptionEids,
            extraText: this.usesExtraText(nextOptionEids) ? this.extraTextControl.value || null : null,
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
            multiOptionEids: this.value,
            extraText: nextValue || null,
        };
        this.answerChange.emit(nextAnswer);
    }

    usesExtraText(selectedOptionEids: string[] = this.value): boolean {
        return this.schema.options.some((option) => selectedOptionEids.includes(option.eid) && option.asksForDescription);
    }

    isChecked(optionEid: string): boolean {
        return this.value.includes(optionEid);
    }

    trackByEid(_: number, item: { eid: string }): string {
        return item.eid;
    }

    private applyValidators(selectedOptionEids: string[] = this.value): void {
        const needsDescription = this.schema.options.some((option) => selectedOptionEids.includes(option.eid) && option.descriptionRequired);
        if (needsDescription) {
            this.extraTextControl.setValidators([Validators.required]);
        } else {
            this.extraTextControl.clearValidators();
        }
        this.extraTextControl.updateValueAndValidity({ emitEvent: false });
    }
}
