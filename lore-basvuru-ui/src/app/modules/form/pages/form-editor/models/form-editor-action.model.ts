import { FormEditorPanelSide, FormEditorPanelTabId } from '../form-editor-panel.config';

export type QuestionEditorSurfaceId = 'content' | 'validation';

export type FormEditorActionAppearance = 'icon' | 'pill' | 'button';

export type FormEditorActionPriority = 'primary' | 'secondary';

export type FormEditorQuestionActionId = 'edit-content' | 'edit-validation' | 'edit-children';

export type FormEditorHeaderActionId = 'retry-save' | 'preview' | 'publish';

export type FormEditorQuestionCommandId = 'open-child-workspace';

export type FormEditorHeaderCommandId = 'retry-save' | 'open-preview' | 'publish-form';

export type FormEditorPermissionDescriptor = boolean | { allowed: boolean; reason?: string | null };

export type FormEditorPermissionMap<TId extends string> = Partial<Record<TId, FormEditorPermissionDescriptor>>;

interface FormEditorActionDefinitionBase<TId extends string> {
    id: TId;
    label: string;
    tooltip: string;
    icon: string;
    appearance: FormEditorActionAppearance;
    priority: FormEditorActionPriority;
    permissionKey?: string;
}

export interface FormEditorSurfaceActionDefinition<TId extends string> extends FormEditorActionDefinitionBase<TId> {
    kind: 'surface';
    surfaceId: QuestionEditorSurfaceId;
}

export interface FormEditorCommandActionDefinition<TId extends string, TCommandId extends string> extends FormEditorActionDefinitionBase<TId> {
    kind: 'command';
    commandId: TCommandId;
}

export interface FormEditorLauncherActionDefinition<TId extends string = string> extends FormEditorActionDefinitionBase<TId> {
    kind: 'launcher';
    panelSide: FormEditorPanelSide;
    panelTabId: FormEditorPanelTabId;
}

export type FormEditorQuestionActionDefinition =
    | FormEditorSurfaceActionDefinition<FormEditorQuestionActionId>
    | FormEditorCommandActionDefinition<FormEditorQuestionActionId, FormEditorQuestionCommandId>;

export type FormEditorHeaderActionDefinition = FormEditorCommandActionDefinition<FormEditorHeaderActionId, FormEditorHeaderCommandId>;

export type FormEditorActionDefinition<TId extends string = string> =
    | FormEditorSurfaceActionDefinition<TId>
    | FormEditorCommandActionDefinition<TId, string>
    | FormEditorLauncherActionDefinition<TId>;

export type FormEditorResolvedAction<TAction extends FormEditorActionDefinition<string>> = TAction & {
    active: boolean;
    disabled: boolean;
    disabledReason: string | null;
    loading: boolean;
};

export type FormEditorResolvedQuestionAction = FormEditorResolvedAction<FormEditorQuestionActionDefinition>;

export type FormEditorResolvedHeaderAction = FormEditorResolvedAction<FormEditorHeaderActionDefinition>;

export type FormEditorLauncherActionId = `open-panel:${FormEditorPanelSide}:${FormEditorPanelTabId}`;

export type FormEditorResolvedLauncherAction = FormEditorResolvedAction<FormEditorLauncherActionDefinition<FormEditorLauncherActionId>>;

export interface FormEditorQuestionActionContext {
    questionEid: string;
    canOpenChildWorkspace: boolean;
    activeSurfaceId: QuestionEditorSurfaceId | null;
    isEditing: boolean;
    isQuestionDraftSaving: boolean;
    isValidationLoading: boolean;
    isValidationSaving: boolean;
    permissions?: FormEditorPermissionMap<FormEditorQuestionActionId>;
}

export interface FormEditorHeaderActionContext {
    canRetrySave: boolean;
    canPreview: boolean;
    previewDisabledReason: string | null;
    canPublish: boolean;
    isPublishing: boolean;
    permissions?: FormEditorPermissionMap<FormEditorHeaderActionId>;
}

export interface FormEditorLauncherActionContext {
    permissions?: FormEditorPermissionMap<FormEditorPanelTabId>;
}

export interface FormEditorQuestionActionEvent {
    questionEid: string;
    actionId: FormEditorQuestionActionId;
}

export interface FormEditorHeaderActionEvent {
    actionId: FormEditorHeaderActionId;
}

export function buildLauncherActionId(side: FormEditorPanelSide, tabId: FormEditorPanelTabId): FormEditorLauncherActionId {
    return `open-panel:${side}:${tabId}`;
}