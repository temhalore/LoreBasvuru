import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { QuestionTypeId } from '../../../models/form-schema.model';
import { QuestionBaseComponent } from '../question-base.component';

@Component({
    selector: 'app-text-question',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './text-question.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextQuestionComponent extends QuestionBaseComponent {

    get isMultiline(): boolean {
        return this.schema.questionTypeId === QuestionTypeId.UZUN_METIN;
    }

    get value(): string {
        return this.answer?.textValue || '';
    }

    get summaryText(): string {
        return this.value?.trim() || 'Yanıt verilmedi';
    }

    emitValue(event: Event): void {
        if (!this.canEmitAnswer()) return;

        const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
        const nextValue = target?.value ?? '';
        this.answerChange.emit({
            ...(this.answer ?? {}),
            textValue: nextValue,
        });
    }
}
