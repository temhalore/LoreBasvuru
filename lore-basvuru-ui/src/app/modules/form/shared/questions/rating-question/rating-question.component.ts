import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { QuestionBaseComponent } from '../question-base.component';

@Component({
    selector: 'app-rating-question',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './rating-question.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingQuestionComponent extends QuestionBaseComponent {

    get value(): number | null {
        return this.answer?.numericValue ?? null;
    }

    get summaryText(): string {
        return this.value === null ? 'Yanıt verilmedi' : `${this.value}`;
    }

    get ratingValues(): number[] {
        const maxValue = this.schema.maxValue ?? 5;
        return Array.from({ length: Math.max(maxValue, 0) }, (_, index) => index + 1);
    }

    selectValue(ratingValue: number): void {
        if (!this.canEmitAnswer()) return;

        this.answerChange.emit({
            ...(this.answer ?? {}),
            numericValue: ratingValue,
        });
    }
}
