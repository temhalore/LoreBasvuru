import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { QuestionTypeRendererComponent } from 'app/modules/form/shared/components/question-type-renderer/question-type-renderer.component';
import { FormViewPageHeaderComponent } from 'app/modules/form/shared/components/form-view-page-header/form-view-page-header.component';
import { GroupInstanceSchema, PageSchema, QuestionSchema, QuestionTypeId } from 'app/modules/form/models/form-schema.model';
import { QuestionAnswerModel } from 'app/modules/form/models/question-answer.model';
import { buildQuestionRenderState, DEFAULT_UI_RULE_STATE, QuestionRenderState } from 'app/modules/form/shared/models/question-render-state.model';

@Component({
    selector: 'app-preview-answer-summary-host',
    standalone: true,
    imports: [CommonModule, QuestionTypeRendererComponent, FormViewPageHeaderComponent],
    template: `
        <section class="form-view-section" *ngIf="page">
            <app-form-view-page-header
                *ngIf="page.title || page.description"
                [title]="page.title"
                [description]="page.description">
            </app-form-view-page-header>

            <div class="form-view-question-list" [class.form-view-question-list--two-column]="twoColumnModeEnabled">
                <app-question-type-renderer
                    *ngFor="let question of page.questions; trackBy: trackByEid"
                    [schema]="question"
                    [state]="buildStateForQuestion(question)"
                    [class.form-view-question-item--full-span]="isWideQuestion(question)">
                </app-question-type-renderer>
            </div>
        </section>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewAnswerSummaryHostComponent {
    @Input() page: PageSchema | null = null;
    @Input() twoColumnModeEnabled = true;
    @Input() initialAnswers: Record<string, QuestionAnswerModel> = {};
    @Input() groupInstances: Record<string, GroupInstanceSchema[]> = {};

    private readonly fullSpanQuestionTypes = new Set<number>([
        QuestionTypeId.ACIKLAMA,
        QuestionTypeId.TEKRARLI_GRUP,
        QuestionTypeId.MATRIS_TEK_SECIM,
        QuestionTypeId.MATRIS_COK_SECIM,
    ]);

    buildStateForQuestion(question: QuestionSchema): QuestionRenderState {
        return buildQuestionRenderState({
            mode: 'answer-only',
            ruleState: { ...DEFAULT_UI_RULE_STATE, required: question.required, readonly: true },
            answer: this.initialAnswers[question.eid] ?? {},
            groupInstances: this.groupInstances[question.eid] ?? [],
        });
    }

    isWideQuestion(question: QuestionSchema): boolean {
        return this.fullSpanQuestionTypes.has(question.questionTypeId);
    }

    trackByEid(_: number, item: { eid: string }): string {
        return item.eid;
    }
}
