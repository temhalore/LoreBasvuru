import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { GroupInstanceSchema, QuestionSchema } from '../../../models/form-schema.model';
import { QuestionAnswerModel } from '../../../models/question-answer.model';
import { QuestionRenderState } from '../../models/question-render-state.model';

export interface RepeatingGroupScope {
    parentInstanceKey?: string;
}

export interface QuestionRenderContext {
    readonly renderState$: Observable<QuestionRenderState>;
    onAnswerChange(answer: QuestionAnswerModel): void;
}

export interface RepeatingGroupPort {
    selectInstances$(
        groupEid: string,
        scope?: RepeatingGroupScope,
    ): Observable<GroupInstanceSchema[]>;
    addInstance(groupEid: string, scope?: RepeatingGroupScope): void;
    removeInstance(instanceKey: string): void;
    createChildRenderContext(
        childEid: string,
        instanceKey: string,
        childSchema: QuestionSchema,
    ): QuestionRenderContext;
}

export const REPEATING_GROUP_PORT = new InjectionToken<RepeatingGroupPort>('REPEATING_GROUP_PORT');
