import { Observable } from 'rxjs';
import { QuestionAnswerModel } from '../../models/question-answer.model';
import { GroupInstanceSchema } from '../../models/form-schema.model';
import {
    QuestionFileUploadRequest,
    QuestionFileUploadResult,
} from '../services/question-file-upload.port';

// ─── Mode ─────────────────────────────────────────────────────────────────────

export type QuestionMode = 'runtime' | 'readonly' | 'preview' | 'answer-only' | 'editor';

export function normalizeQuestionMode(mode: string | null | undefined): QuestionMode {
    switch (mode) {
        case 'runtime':
        case 'readonly':
        case 'preview':
        case 'answer-only':
        case 'editor':
            return mode;
        default:
            return 'preview';
    }
}

// ─── Rule state ───────────────────────────────────────────────────────────────

export interface UiRuleState {
    visible: boolean;
    disabled: boolean;
    required: boolean;
    readonly: boolean;
}

export const DEFAULT_UI_RULE_STATE: UiRuleState = {
    visible: true,
    disabled: false,
    required: false,
    readonly: false,
};

// ─── Upload capabilities ──────────────────────────────────────────────────────

export interface QuestionUploadCapabilities {
    uploadFiles: (request: QuestionFileUploadRequest) => Observable<QuestionFileUploadResult | null>;
}

// ─── Render state ─────────────────────────────────────────────────────────────

export interface QuestionRenderState {
    mode: QuestionMode;
    ruleState: UiRuleState;
    answer?: QuestionAnswerModel;
    groupInstances?: GroupInstanceSchema[];
    sessionEid?: string;
    groupInstanceEid?: string;
    useCardLayout?: boolean;
    uploadCapabilities?: QuestionUploadCapabilities;
}

export const DEFAULT_QUESTION_RENDER_STATE: QuestionRenderState = {
    mode: 'preview',
    ruleState: DEFAULT_UI_RULE_STATE,
};

export interface QuestionRenderStateOverrides extends Omit<Partial<QuestionRenderState>, 'mode'> {
    mode?: QuestionMode;
}

export function buildQuestionRenderState(
    overrides: QuestionRenderStateOverrides = {},
): QuestionRenderState {
    return {
        ...DEFAULT_QUESTION_RENDER_STATE,
        ...overrides,
        mode: normalizeQuestionMode(overrides.mode),
        ruleState: {
            ...DEFAULT_UI_RULE_STATE,
            ...overrides.ruleState,
        },
    };
}
