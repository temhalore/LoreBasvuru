import type {
    FormEditorHeaderActionEvent as HeaderActionEvent,
    FormEditorHeaderActionId,
    FormEditorQuestionActionEvent as QuestionActionEvent,
    FormEditorQuestionActionId,
    FormEditorResolvedHeaderAction,
    FormEditorResolvedQuestionAction,
    QuestionEditorSurfaceId as SurfaceId,
} from './form-editor-action.model';

export interface FormEditorViewModel {
    formEid: string;
    title: string;
    statusLabel: string;
    saveState: FormEditorSaveViewModel;
    previewDisabledReason: string | null;
    actionFeedback: FormEditorActionFeedbackViewModel | null;
    headerActions: FormEditorHeaderAction[];
    canUndo: boolean;
    canRedo: boolean;
    canPreview: boolean;
    canPublish: boolean;
}

export type FormEditorSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error' | 'surface-pending';

export type FormEditorSaveTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface FormEditorSaveViewModel {
    status: FormEditorSaveStatus;
    label: string;
    detail: string | null;
    canRetry: boolean;
    tone: FormEditorSaveTone;
}

export interface FormEditorActionFeedbackViewModel {
    message: string;
    tone: Exclude<FormEditorSaveTone, 'success'>;
}

export interface FormEditorPageStripItem {
    eid: string;
    index: number;
    label: string;
    questionCount: number;
    isActive: boolean;
}

export interface FormEditorPageReorderEvent {
    previousIndex: number;
    currentIndex: number;
    pageEid: string;
}

export interface FormEditorQuestionReorderEvent {
    containerEid: string;
    questionEid: string;
    previousIndex: number;
    currentIndex: number;
}

export interface FormEditorPaletteDropEvent {
    item: import('../../../models').FormPaletteItemDto;
    containerEid: string;
    index: number;
}

export interface FormEditorGroupWorkspaceItem {
    containerEid: string;
}

export type { FormEditorHeaderActionId, FormEditorQuestionActionId } from './form-editor-action.model';

export type QuestionEditorSurfaceId = SurfaceId;

export type FormEditorQuestionAction = FormEditorResolvedQuestionAction;

export type FormEditorQuestionActionEvent = QuestionActionEvent;

export type FormEditorHeaderAction = FormEditorResolvedHeaderAction;

export type FormEditorHeaderActionEvent = HeaderActionEvent;

export interface FormEditorActiveQuestionSurface {
    questionEid: string;
    surfaceId: QuestionEditorSurfaceId;
}

export interface FormEditorPageDraft {
    eid: string;
    sayfaBaslik: string;
    sayfaAciklama: string;
    isDirty: boolean;
}

export interface FormEditorValidationRuleDraft {
    rule: import('app/base/models/form/kuralV2').ResKuralV2Model;
    state: 'existing' | 'new' | 'deleted';
}

export interface FormEditorValidationSession {
    questionEid: string;
    rules: FormEditorValidationRuleDraft[];
    activeRuleEid: string | null;
    isDirty: boolean;
}
