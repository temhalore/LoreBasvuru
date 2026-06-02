import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';
import { QuestionAnswerModel } from '../../models/question-answer.model';

@Injectable()
export class QuestionPreviewStateStore {
    private readonly answersSubject = new BehaviorSubject<Record<string, QuestionAnswerModel>>({});

    readonly answers$ = this.answersSubject.asObservable();

    initializePage(initialAnswers: Record<string, QuestionAnswerModel> = {}): void {
        this.answersSubject.next({ ...initialAnswers });
    }

    selectAnswer(questionEid: string, instanceScopeKey?: string): Observable<QuestionAnswerModel | undefined> {
        return this.answers$.pipe(
            map((answers) => answers[this.makeScopedKey(questionEid, instanceScopeKey)]),
            distinctUntilChanged((left, right) => JSON.stringify(left ?? null) === JSON.stringify(right ?? null)),
        );
    }

    getAnswer(questionEid: string, instanceScopeKey?: string): QuestionAnswerModel | undefined {
        return this.answersSubject.value[this.makeScopedKey(questionEid, instanceScopeKey)];
    }

    patchAnswer(questionEid: string, partialAnswer: Partial<QuestionAnswerModel>, instanceScopeKey?: string): void {
        const currentAnswers = this.answersSubject.value;
        const scopedKey = this.makeScopedKey(questionEid, instanceScopeKey);
        const currentAnswer = currentAnswers[scopedKey] ?? {};

        this.answersSubject.next({
            ...currentAnswers,
            [scopedKey]: {
                ...currentAnswer,
                ...partialAnswer,
            },
        });
    }

    private makeScopedKey(questionEid: string, instanceScopeKey?: string): string {
        return instanceScopeKey ? `${instanceScopeKey}:${questionEid}` : questionEid;
    }
}
