import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { QuestionMatrixAnswerModel } from '../../../models/question-answer.model';
import { RichTextViewComponent } from '../../components/rich-text-view/rich-text-view.component';
import { QuestionBaseComponent } from '../question-base.component';

@Component({
    selector: 'app-matrix-multi-question',
    standalone: true,
    imports: [CommonModule, RichTextViewComponent],
    templateUrl: './matrix-multi-question.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatrixMultiQuestionComponent extends QuestionBaseComponent {

    get value(): QuestionMatrixAnswerModel[] {
        return this.answer?.matrixAnswers ?? [];
    }

    isSelected(rowEid: string, columnEid: string): boolean {
        return this.value.some((item) => item.rowEid === rowEid && (item.multiColumnEids ?? []).includes(columnEid));
    }

    getSelectedLabelItems(rowEid: string): Array<{ eid: string; label: string }> {
        const selectedEids = this.value.find((item) => item.rowEid === rowEid)?.multiColumnEids ?? [];
        return this.schema.matrixColumns
            .filter((item) => selectedEids.includes(item.eid))
            .map((item) => ({ eid: item.eid, label: item.label }));
    }

    toggleValue(rowEid: string, columnEid: string, event: Event): void {
        if (this.isInputDisabled || this.isInputReadonly) {
            return;
        }

        const target = event.target as HTMLInputElement | null;
        const currentRow = this.value.find((item) => item.rowEid === rowEid);
        const selectedColumns = new Set(currentRow?.multiColumnEids ?? []);

        if (target?.checked) {
            selectedColumns.add(columnEid);
        } else {
            selectedColumns.delete(columnEid);
        }

        this.answerChange.emit({
            ...(this.answer ?? {}),
            matrixAnswers: this.upsertMatrixAnswer(rowEid, {
                multiColumnEids: [...selectedColumns],
            }),
        });
    }

    trackByEid(_: number, item: { eid: string }): string {
        return item.eid;
    }

    private upsertMatrixAnswer(
        rowEid: string,
        partialAnswer: Partial<QuestionMatrixAnswerModel>,
    ): QuestionMatrixAnswerModel[] {
        const currentAnswers = [...this.value];
        const currentIndex = currentAnswers.findIndex((item) => item.rowEid === rowEid);
        const nextValue: QuestionMatrixAnswerModel = {
            rowEid,
            ...(currentIndex > -1 ? currentAnswers[currentIndex] : {}),
            ...partialAnswer,
        };

        if (currentIndex > -1) {
            currentAnswers[currentIndex] = nextValue;
            return currentAnswers;
        }

        return [...currentAnswers, nextValue];
    }
}
