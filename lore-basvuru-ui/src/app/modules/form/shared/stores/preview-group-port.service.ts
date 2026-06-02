import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GroupInstanceSchema, QuestionSchema } from '../../models/form-schema.model';
import { QuestionAnswerModel } from '../../models/question-answer.model';
import { buildQuestionRenderState } from '../models/question-render-state.model';
import {
    QuestionRenderContext,
    RepeatingGroupPort,
    RepeatingGroupScope,
} from '../questions/repeating-group-question/repeating-group.port';
import { QuestionPreviewStateStore } from './question-preview-state.store';

@Injectable()
export class PreviewGroupPortService implements RepeatingGroupPort, OnDestroy {

    private readonly instances = new Map<string, BehaviorSubject<GroupInstanceSchema[]>>();
    private instanceCounter = 0;

    constructor(private readonly previewStore: QuestionPreviewStateStore) {}

    selectInstances$(
        groupEid: string,
        scope?: RepeatingGroupScope,
    ): Observable<GroupInstanceSchema[]> {
        return this.getOrCreate(this.makeKey(groupEid, scope)).asObservable();
    }

    addInstance(groupEid: string, scope?: RepeatingGroupScope): void {
        const subject = this.getOrCreate(this.makeKey(groupEid, scope));
        const current = subject.value;
        subject.next([
            ...current,
            { eid: `preview-${++this.instanceCounter}`, index: current.length + 1, questions: [] },
        ]);
    }

    removeInstance(instanceKey: string): void {
        for (const subject of this.instances.values()) {
            const idx = subject.value.findIndex(i => i.eid === instanceKey);
            if (idx !== -1) {
                subject.next(
                    subject.value
                        .filter(i => i.eid !== instanceKey)
                        .map((i, newIdx) => ({ ...i, index: newIdx + 1 })),
                );
                return;
            }
        }
    }

    createChildRenderContext(
        childEid: string,
        instanceKey: string,
        childSchema: QuestionSchema,
    ): QuestionRenderContext {
        const renderState$ = this.previewStore
            .selectAnswer(childEid, instanceKey)
            .pipe(
                map(answer => buildQuestionRenderState({
                    mode: 'preview',
                    ruleState: {
                        visible: true,
                        disabled: false,
                        required: childSchema.required,
                        readonly: false,
                    },
                    answer: answer ?? {},
                    groupInstanceEid: instanceKey,
                })),
            );

        return {
            renderState$,
            onAnswerChange: (answer: QuestionAnswerModel) =>
                this.previewStore.patchAnswer(childEid, answer, instanceKey),
        };
    }

    ngOnDestroy(): void {
        for (const subject of this.instances.values()) {
            subject.complete();
        }
        this.instances.clear();
    }

    private makeKey(groupEid: string, scope?: RepeatingGroupScope): string {
        return scope?.parentInstanceKey
            ? `${scope.parentInstanceKey}:${groupEid}`
            : groupEid;
    }

    private getOrCreate(key: string): BehaviorSubject<GroupInstanceSchema[]> {
        if (!this.instances.has(key)) {
            this.instances.set(key, new BehaviorSubject<GroupInstanceSchema[]>([]));
        }

        return this.instances.get(key)!;
    }
}
