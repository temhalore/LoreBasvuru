import { Injectable } from '@angular/core';
import {
    RespondentRule,
} from '../models/form-respondent-projection.model';
import { WidgetState } from '../models/form-respondent-rule.model';
import { QuestionAnswerModel } from '../../../models/question-answer.model';
import { PageSchema, QuestionSchema } from '../../../models/form-schema.model';

@Injectable()
export class FormRuleEngineService {

    private rules: RespondentRule[] = [];
    private questionPageMap = new Map<string, string>();
    private pageEids = new Set<string>();

    initialize(rules: RespondentRule[], pages: PageSchema[]): void {
        this.rules = [...(rules ?? [])].sort((left, right) => left.sira - right.sira);
        this.questionPageMap.clear();
        this.pageEids = new Set((pages ?? []).map(page => page.eid));

        for (const page of pages ?? []) {
            this.indexQuestions(page.eid, page.questions ?? []);
        }
    }

    getQuestionDependencyIds(hedefSoruKokEid: string): string[] {
        // NOTE: Rule JSON hâlâ numeric KokId referansları kullanır.
        // Faz-2'de rule JSON eid'ye taşınana kadar bu metod boş dönecektir.
        return [];
    }

    evaluate(soruKokEid: string, answers: Map<string, QuestionAnswerModel>): WidgetState {
        // NOTE: Rule JSON hâlâ numeric KokId referansları kullanır.
        // Faz-2'de rule JSON eid'ye taşınana kadar varsayılan state dönecektir.
        return {
            visible: true,
            disabled: false,
            required: null,
        };
    }

    getNextPageEid(currentPageEid: string, answers: Map<string, QuestionAnswerModel>): string | null {
        // NOTE: Sayfa atlama kuralları da numeric KokId referansları kullanır.
        // Faz-2'de eid'ye taşınana kadar null (varsayılan sıralı navigasyon) dönecektir.
        return null;
    }

    private indexQuestions(pageEid: string, questions: QuestionSchema[]): void {
        for (const question of questions) {
            this.questionPageMap.set(question.eid, pageEid);

            if (question.children?.length) {
                this.indexQuestions(pageEid, question.children);
            }
        }
    }

    // ════════════════════════════════════════════
    // DEFERRED: Rule evaluation methods
    // ════════════════════════════════════════════
    // Faz-2'de rule JSON numeric KokId → eid migration yapıldığında
    // aşağıdaki evaluate/getNextPage metotları yeniden aktive edilecek.
    // Parse/evaluate/compare yardımcı metotlar da o zaman eid uyumlu hale getirilecek.

    private parseJson(jsonData: string): unknown | null {
        if (!jsonData) {
            return null;
        }

        try {
            return JSON.parse(jsonData) as unknown;
        } catch {
            return null;
        }
    }
}
