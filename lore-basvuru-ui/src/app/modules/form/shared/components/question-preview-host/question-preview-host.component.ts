import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Observable, map } from 'rxjs';
import { QuestionPreviewStateStore } from '../../stores/question-preview-state.store';
import { QuestionTypeRendererComponent } from '../question-type-renderer/question-type-renderer.component';
import { QuestionSchema, QuestionTypeId } from '../../../models/form-schema.model';
import {
    buildQuestionRenderState,
    DEFAULT_UI_RULE_STATE,
    QuestionRenderState,
} from '../../models/question-render-state.model';

@Component({
    selector: 'app-question-preview-host',
    standalone: true,
    imports: [CommonModule, QuestionTypeRendererComponent],
    templateUrl: './question-preview-host.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionPreviewHostComponent implements OnInit, OnChanges {
    @Input() schema!: QuestionSchema;
    @Input() instanceScopeKey?: string;

    renderState$!: Observable<QuestionRenderState>;

    constructor(private readonly previewStateStore: QuestionPreviewStateStore) {}

    ngOnInit(): void {
        this.renderState$ = this.createRenderStateStream();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes['schema'] && !changes['schema'].firstChange) || changes['instanceScopeKey']) {
            this.renderState$ = this.createRenderStateStream();
        }
    }

    onAnswerChange(answer: import('../../../models/question-answer.model').QuestionAnswerModel): void {
        this.previewStateStore.patchAnswer(this.schema.eid, answer, this.instanceScopeKey);
    }

    private createRenderStateStream(): Observable<QuestionRenderState> {
        return this.previewStateStore.selectAnswer(this.schema.eid, this.instanceScopeKey).pipe(
            map((answer) => buildQuestionRenderState({
                mode: 'preview',
                ruleState: {
                    ...DEFAULT_UI_RULE_STATE,
                    required: this.schema.required,
                    readonly: this.schema.questionTypeId === QuestionTypeId.DOSYA_YUKLEME,
                },
                answer: answer ?? {},
                groupInstanceEid: this.instanceScopeKey,
            })),
        );
    }
}
