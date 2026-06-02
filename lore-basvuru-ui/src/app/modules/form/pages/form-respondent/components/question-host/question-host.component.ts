import { Component, ChangeDetectionStrategy, Inject, Input, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WidgetState } from '../../models/form-respondent-rule.model';
import { QuestionType } from '../../models/form-respondent.enums';
import {
    QuestionHostState,
    RespondentStateStore,
} from '../../services/respondent-state-store.service';
import { FormRuleEngineService } from '../../services/form-rule-engine.service';
import { QuestionTypeRendererComponent } from '../../../../shared/components/question-type-renderer/question-type-renderer.component';
import { QUESTION_FILE_UPLOAD_PORT, QuestionFileUploadPort } from '../../../../shared/services/question-file-upload.port';
import { normalizeQuestionAnswerForType } from '../../../../models/form-ui.adapter';
import { QuestionSchema, QuestionTypeId } from '../../../../models/form-schema.model';
import { UserFormIssue } from '../../../../models/question-answer.model';
import {
    buildQuestionRenderState,
    QuestionRenderState,
    QuestionUploadCapabilities,
} from '../../../../shared/models/question-render-state.model';

@Component({
    selector: 'app-question-host',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        QuestionTypeRendererComponent,
    ],
    templateUrl: './question-host.component.html',
})
export class QuestionHostComponent implements OnInit {

    @Input() schema!: QuestionSchema;
    @Input() grupInstanceEid?: string;
    @Input() sessionEid?: string;
    @Input() readonly = false;

    renderState$!: Observable<QuestionRenderState>;
    issues$!: Observable<UserFormIssue[]>;

    readonly QuestionType = QuestionType;

    constructor(
        private stateStore: RespondentStateStore,
        private ruleEngine: FormRuleEngineService,
        @Optional() @Inject(QUESTION_FILE_UPLOAD_PORT) private readonly uploadPort: QuestionFileUploadPort | null,
    ) {}

    get fileUploadCapabilities(): QuestionUploadCapabilities | undefined {
        if (!this.uploadPort || !this.sessionEid || this.readonly) {
            return undefined;
        }

        return {
            uploadFiles: (request) => this.uploadPort.uploadFiles(request),
        };
    }

    ngOnInit(): void {
        const dependencyQuestionEids = this.ruleEngine.getQuestionDependencyIds(this.schema.eid);
        this.issues$ = this.stateStore.selectIssuesForQuestion(this.schema.eid, this.grupInstanceEid);

        this.renderState$ = this.stateStore
            .selectQuestionHostState(
                this.schema.eid,
                dependencyQuestionEids,
                this.grupInstanceEid,
            )
            .pipe(
                map((state: QuestionHostState) => {
                    const widgetState: WidgetState = this.ruleEngine.evaluate(
                        this.schema.eid,
                        new Map(state.dependencyAnswers),
                    );

                    return buildQuestionRenderState({
                        mode: 'runtime',
                        ruleState: {
                            visible: widgetState.visible,
                            disabled: widgetState.disabled,
                            required: widgetState.required ?? this.schema.required,
                            readonly: this.readonly,
                        },
                        answer: normalizeQuestionAnswerForType(this.schema.questionTypeId, state.answer),
                        sessionEid: this.sessionEid,
                        groupInstanceEid: this.grupInstanceEid,
                        useCardLayout: this.schema.questionTypeId === QuestionTypeId.DOSYA_YUKLEME,
                        uploadCapabilities: this.fileUploadCapabilities,
                    });
                }),
            );
    }

    onSharedAnswerChange(answer: import('../../../../models/question-answer.model').QuestionAnswerModel): void {
        this.stateStore.setAnswer(this.schema.eid, answer, this.grupInstanceEid);
    }
}
