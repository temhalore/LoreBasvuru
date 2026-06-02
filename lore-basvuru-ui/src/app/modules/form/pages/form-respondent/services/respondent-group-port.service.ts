import { Inject, Injectable, Optional } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GroupInstanceSchema, QuestionSchema } from '../../../models/form-schema.model';
import { normalizeQuestionAnswerForType } from '../../../models/form-ui.adapter';
import { QuestionAnswerModel } from '../../../models/question-answer.model';
import {
    QUESTION_FILE_UPLOAD_PORT,
    QuestionFileUploadPort,
} from '../../../shared/services/question-file-upload.port';
import {
    buildQuestionRenderState,
    QuestionUploadCapabilities,
} from '../../../shared/models/question-render-state.model';
import {
    QuestionRenderContext,
    RepeatingGroupPort,
    RepeatingGroupScope,
} from '../../../shared/questions/repeating-group-question/repeating-group.port';
import { FormRuleEngineService } from './form-rule-engine.service';
import { RespondentStateStore } from './respondent-state-store.service';

@Injectable()
export class RespondentGroupPortService implements RepeatingGroupPort {

    private sessionEid: string | null = null;

    constructor(
        private readonly stateStore: RespondentStateStore,
        private readonly ruleEngine: FormRuleEngineService,
        @Optional() @Inject(QUESTION_FILE_UPLOAD_PORT)
            private readonly uploadPort: QuestionFileUploadPort | null,
    ) {}

    setSessionEid(eid: string): void {
        this.sessionEid = eid;
    }

    selectInstances$(
        groupEid: string,
        scope?: RepeatingGroupScope,
    ): Observable<GroupInstanceSchema[]> {
        return this.stateStore
            .selectInstancesForGroup(groupEid, scope?.parentInstanceKey ?? null)
            .pipe(
                map(instances =>
                    instances.map(i => ({
                        eid: i.grupInstanceEid,
                        index: i.sira,
                        questions: [],
                    })),
                ),
            );
    }

    addInstance(groupEid: string, scope?: RepeatingGroupScope): void {
        this.stateStore.addLocalInstance(groupEid, scope?.parentInstanceKey);
    }

    removeInstance(instanceKey: string): void {
        this.stateStore.removeInstance(instanceKey);
    }

    createChildRenderContext(
        childEid: string,
        instanceKey: string,
        childSchema: QuestionSchema,
    ): QuestionRenderContext {
        const depEids = this.ruleEngine.getQuestionDependencyIds(childEid);
        const uploadCapabilities = this.buildUploadCapabilities(instanceKey);

        const renderState$ = this.stateStore
            .selectQuestionHostState(childEid, depEids, instanceKey)
            .pipe(
                map(hostState => {
                    const widgetState = this.ruleEngine.evaluate(
                        childEid,
                        new Map(hostState.dependencyAnswers),
                    );

                    return buildQuestionRenderState({
                        mode: 'runtime',
                        ruleState: {
                            visible: widgetState.visible,
                            disabled: widgetState.disabled,
                            required: widgetState.required ?? childSchema.required,
                            readonly: false,
                        },
                        answer: normalizeQuestionAnswerForType(
                            childSchema.questionTypeId,
                            hostState.answer,
                        ),
                        groupInstanceEid: instanceKey,
                        sessionEid: this.sessionEid ?? undefined,
                        uploadCapabilities,
                    });
                }),
            );

        return {
            renderState$,
            onAnswerChange: (answer: QuestionAnswerModel) =>
                this.stateStore.setAnswer(childEid, answer, instanceKey),
        };
    }

    private buildUploadCapabilities(instanceKey: string): QuestionUploadCapabilities | undefined {
        if (!this.uploadPort || !this.sessionEid) {
            return undefined;
        }

        const port = this.uploadPort;

        return {
            uploadFiles: request => port.uploadFiles({ ...request, groupInstanceEid: instanceKey }),
        };
    }
}
