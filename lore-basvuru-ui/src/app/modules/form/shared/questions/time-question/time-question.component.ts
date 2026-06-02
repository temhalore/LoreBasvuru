import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { QuestionBaseComponent } from '../question-base.component';

@Component({
    selector: 'app-time-question',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './time-question.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeQuestionComponent extends QuestionBaseComponent {

    get value(): string | null {
        return this.answer?.timeValue ?? this.answer?.textValue ?? null;
    }

    get summaryText(): string {
        return this.value || 'Yanıt verilmedi';
    }

    emitValue(event: Event): void {
        if (!this.canEmitAnswer()) return;

        const target = event.target as HTMLInputElement | null;
        this.answerChange.emit({
            ...(this.answer ?? {}),
            timeValue: target?.value || null,
        });
    }
}
