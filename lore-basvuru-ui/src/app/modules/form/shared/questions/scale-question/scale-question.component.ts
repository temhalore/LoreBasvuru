import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { QuestionBaseComponent } from '../question-base.component';

@Component({
    selector: 'app-scale-question',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './scale-question.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScaleQuestionComponent extends QuestionBaseComponent {

    get value(): number | null {
        return this.answer?.numericValue ?? null;
    }

    get summaryText(): string {
        return this.value === null ? 'Yanıt verilmedi' : `${this.value}`;
    }

    get scaleValues(): number[] {
        const minValue = this.schema.minValue ?? 0;
        const maxValue = this.schema.maxValue ?? minValue;
        return Array.from({ length: Math.max(maxValue - minValue + 1, 0) }, (_, index) => minValue + index);
    }

    selectValue(scaleValue: number): void {
        if (!this.canEmitAnswer()) return;

        this.answerChange.emit({
            ...(this.answer ?? {}),
            numericValue: scaleValue,
        });
    }
}
