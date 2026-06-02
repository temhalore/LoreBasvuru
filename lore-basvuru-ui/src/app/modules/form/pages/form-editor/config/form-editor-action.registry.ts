import {
    FormEditorHeaderActionDefinition,
    FormEditorHeaderActionId,
    FormEditorQuestionActionDefinition,
    FormEditorQuestionActionId,
} from '../models/form-editor-action.model';

export const QUESTION_ACTION_ORDER: readonly FormEditorQuestionActionId[] = ['edit-children', 'edit-content', 'edit-validation'];

export const QUESTION_ACTION_REGISTRY: Record<FormEditorQuestionActionId, FormEditorQuestionActionDefinition> = {
    'edit-content': {
        id: 'edit-content',
        kind: 'surface',
        surfaceId: 'content',
        icon: 'edit',
        label: 'Duzenle',
        tooltip: 'Duzenle',
        appearance: 'icon',
        priority: 'primary',
        permissionKey: 'form-editor.question.content.edit',
    },
    'edit-validation': {
        id: 'edit-validation',
        kind: 'surface',
        surfaceId: 'validation',
        icon: 'rule',
        label: 'Validasyon',
        tooltip: 'Validasyon kurallarini duzenle',
        appearance: 'icon',
        priority: 'primary',
        permissionKey: 'form-editor.question.validation.edit',
    },
    'edit-children': {
        id: 'edit-children',
        kind: 'command',
        commandId: 'open-child-workspace',
        icon: 'edit_note',
        label: 'Alt sorulari duzenle',
        tooltip: 'Alt sorulari duzenle',
        appearance: 'icon',
        priority: 'primary',
        permissionKey: 'form-editor.question.children.edit',
    },
};

export const HEADER_ACTION_ORDER: readonly FormEditorHeaderActionId[] = ['retry-save', 'preview', 'publish'];

export const HEADER_ACTION_REGISTRY: Record<FormEditorHeaderActionId, FormEditorHeaderActionDefinition> = {
    'retry-save': {
        id: 'retry-save',
        kind: 'command',
        commandId: 'retry-save',
        icon: 'refresh',
        label: 'Tekrar Dene',
        tooltip: 'Kaydetme islemini tekrar dene',
        appearance: 'button',
        priority: 'secondary',
        permissionKey: 'form-editor.document.retry-save',
    },
    preview: {
        id: 'preview',
        kind: 'command',
        commandId: 'open-preview',
        icon: 'eye',
        label: 'Onizle',
        tooltip: 'Formun onizlemesini ac',
        appearance: 'button',
        priority: 'secondary',
        permissionKey: 'form-editor.document.preview',
    },
    publish: {
        id: 'publish',
        kind: 'command',
        commandId: 'publish-form',
        icon: 'paper-plane',
        label: 'Yayinla',
        tooltip: 'Formu yayinla',
        appearance: 'button',
        priority: 'primary',
        permissionKey: 'form-editor.document.publish',
    },
};