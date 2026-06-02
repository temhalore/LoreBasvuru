import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { normalizeDateOnlyValue } from '../../../models/form-ui.adapter';
import { QuestionBaseComponent } from '../question-base.component';

@Component({
    selector: 'app-date-question',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './date-question.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateQuestionComponent extends QuestionBaseComponent {

    get value(): string | null {
        return normalizeDateOnlyValue(this.answer?.dateValue ?? null);
    }

    get summaryText(): string {
        return this.formatSummaryDate(this.answer?.rawDateValue ?? this.answer?.dateValue ?? null) ?? 'Yanit verilmedi';
    }

    emitValue(event: Event): void {
        if (!this.canEmitAnswer()) return;

        const target = event.target as HTMLInputElement | null;
        const nextValue = target?.value || null;
        this.answerChange.emit({
            ...(this.answer ?? {}),
            dateValue: nextValue,
            rawDateValue: nextValue,
        });
    }

    private formatSummaryDate(value?: string | null): string | null {
        if (!value) {
            return null;
        }

        const trimmed = value.trim();
        if (!trimmed) {
            return null;
        }

        const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
        if (isoMatch) {
            const [, year, month, day, hour = '00', minute = '00'] = isoMatch;
            return `${day}-${month}-${year} ${hour}:${minute}`;
        }

        const parsed = new Date(trimmed);
        if (Number.isNaN(parsed.getTime())) {
            return trimmed;
        }

        const day = `${parsed.getDate()}`.padStart(2, '0');
        const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
        const year = `${parsed.getFullYear()}`;
        const hour = `${parsed.getHours()}`.padStart(2, '0');
        const minute = `${parsed.getMinutes()}`.padStart(2, '0');
        return `${day}-${month}-${year} ${hour}:${minute}`;
    }
}
