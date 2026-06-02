import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { QuestionSchema } from '../../models/form-schema.model';
import { QuestionAnswerModel } from '../../models/question-answer.model';
import {
    DEFAULT_QUESTION_RENDER_STATE,
    QuestionMode,
    QuestionRenderState,
    normalizeQuestionMode,
} from '../models/question-render-state.model';

@Directive()
export abstract class QuestionBaseComponent {

    @Input() schema!: QuestionSchema;
    @Input() state: QuestionRenderState = DEFAULT_QUESTION_RENDER_STATE;
    @Output() readonly answerChange = new EventEmitter<QuestionAnswerModel>();

    get normalizedMode(): QuestionMode {
        return normalizeQuestionMode(this.state.mode);
    }

    get answer(): QuestionAnswerModel | undefined {
        return this.state.answer;
    }

    get isAnswerOnly(): boolean {
        return this.normalizedMode === 'answer-only';
    }

    get isEditor(): boolean {
        return this.normalizedMode === 'editor';
    }

    get isInputReadonly(): boolean {
        return (
            this.normalizedMode === 'readonly' ||
            this.normalizedMode === 'answer-only' ||
            this.normalizedMode === 'editor' ||
            this.state.ruleState.readonly
        );
    }

    get isInputDisabled(): boolean {
        return (
            this.state.ruleState.disabled ||
            this.normalizedMode === 'answer-only' ||
            this.normalizedMode === 'editor'
        );
    }

    protected canEmitAnswer(): boolean {
        return !this.isInputReadonly && !this.isInputDisabled;
    }
}
