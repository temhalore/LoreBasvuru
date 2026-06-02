import { FormEditorQuestionActionEvent, FormEditorQuestionActionId, QuestionEditorSurfaceId } from '../models/form-editor-action.model';

export interface FormEditorQuestionActionDispatchApi {
    openQuestionSurface(questionEid: string, surfaceId: QuestionEditorSurfaceId): void;
    openGroupWorkspace(questionEid: string): void;
}

const QUESTION_ACTION_HANDLERS: Record<FormEditorQuestionActionId, (questionEid: string, api: FormEditorQuestionActionDispatchApi) => void> = {
    'edit-content': (questionEid, api) => {
        api.openQuestionSurface(questionEid, 'content');
    },
    'edit-validation': (questionEid, api) => {
        api.openQuestionSurface(questionEid, 'validation');
    },
    'edit-children': (questionEid, api) => {
        api.openGroupWorkspace(questionEid);
    },
};

export function dispatchQuestionAction(event: FormEditorQuestionActionEvent, api: FormEditorQuestionActionDispatchApi): void {
    QUESTION_ACTION_HANDLERS[event.actionId](event.questionEid, api);
}