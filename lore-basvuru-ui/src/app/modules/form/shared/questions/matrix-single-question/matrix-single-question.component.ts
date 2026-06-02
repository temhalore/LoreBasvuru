import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { QuestionBaseComponent } from '../question-base.component';
import { QuestionMatrixAnswerModel } from '../../../models/question-answer.model';
import { RichTextViewComponent } from '../../components/rich-text-view/rich-text-view.component';

@Component({
    selector: 'app-matrix-single-question',
    standalone: true,
    imports: [CommonModule, RichTextViewComponent],
    templateUrl: './matrix-single-question.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatrixSingleQuestionComponent extends QuestionBaseComponent {

    get value(): QuestionMatrixAnswerModel[] {
        return this.answer?.matrixAnswers ?? [];
    }

    isSelected(rowEid: string, columnEid: string): boolean {
        return this.value.some((item) => item.rowEid === rowEid && item.singleColumnEid === columnEid);
    }

    getSelectedLabel(rowEid: string): string {
        const selected = this.value.find((item) => item.rowEid === rowEid)?.singleColumnEid;
        const column = this.schema.matrixColumns.find((item) => item.eid === selected);
        return column?.label ?? 'Yanıt verilmedi';
    }

    isSelectedLabelMissing(rowEid: string): boolean {
        const selected = this.value.find((item) => item.rowEid === rowEid)?.singleColumnEid;
        return !this.schema.matrixColumns.some((item) => item.eid === selected);
    }

    selectValue(rowEid: string, columnEid: string): void {
        if (this.isInputDisabled || this.isInputReadonly) {
            return;
        }

        this.answerChange.emit({
            ...(this.answer ?? {}),
            matrixAnswers: this.upsertMatrixAnswer(rowEid, {
                singleColumnEid: columnEid,
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
