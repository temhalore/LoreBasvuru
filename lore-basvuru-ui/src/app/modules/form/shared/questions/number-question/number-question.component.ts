import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { QuestionBaseComponent } from '../question-base.component';

@Component({
    selector: 'app-number-question',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './number-question.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberQuestionComponent extends QuestionBaseComponent {

    get value(): number | null {
        return this.answer?.numericValue ?? null;
    }

    get summaryText(): string {
        return this.value === null ? 'Yanıt verilmedi' : `${this.value}`;
    }

    emitValue(event: Event): void {
        if (!this.canEmitAnswer()) return;

        const target = event.target as HTMLInputElement | null;
        const rawValue = target?.value ?? '';
        this.answerChange.emit({
            ...(this.answer ?? {}),
            numericValue: rawValue === '' ? null : Number(rawValue),
        });
    }
}
