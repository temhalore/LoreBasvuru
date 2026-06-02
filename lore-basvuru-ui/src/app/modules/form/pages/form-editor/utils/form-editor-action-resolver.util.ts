import { QuestionDto } from '../../../models';
import { QuestionSchema, QuestionTypeId } from '../../../models/form-schema.model';
import { FormEditorPanelLauncherConfig } from '../form-editor-panel.config';
import { HEADER_ACTION_ORDER, HEADER_ACTION_REGISTRY, QUESTION_ACTION_ORDER, QUESTION_ACTION_REGISTRY } from '../config/form-editor-action.registry';
import {
    buildLauncherActionId,
    FormEditorActionDefinition,
    FormEditorHeaderActionContext,
    FormEditorHeaderActionId,
    FormEditorLauncherActionContext,
    FormEditorPermissionDescriptor,
    FormEditorPermissionMap,
    FormEditorQuestionActionContext,
    FormEditorQuestionActionDefinition,
    FormEditorQuestionActionId,
    FormEditorResolvedHeaderAction,
    FormEditorResolvedLauncherAction,
    FormEditorResolvedQuestionAction,
} from '../models/form-editor-action.model';

export function supportsChildWorkspaceQuestionType(questionTypeId: number | null | undefined): boolean {
    return questionTypeId === QuestionTypeId.TEKRARLI_GRUP;
}

export function questionDtoCanOpenChildWorkspace(question: Pick<QuestionDto, 'altSorular' | 'soruTipKID'> | null | undefined): boolean {
    if (!question) {
        return false;
    }

    if ((question.altSorular?.length ?? 0) > 0) {
        return true;
    }

    return supportsChildWorkspaceQuestionType(question.soruTipKID ?? null);
}

export function questionSchemaCanOpenChildWorkspace(question: Pick<QuestionSchema, 'children' | 'questionTypeId'> | null | undefined): boolean {
    if (!question) {
        return false;
    }

    if ((question.children?.length ?? 0) > 0) {
        return true;
    }

    return supportsChildWorkspaceQuestionType(question.questionTypeId);
}

function resolvePermission<TId extends string>(permissions: FormEditorPermissionMap<TId> | undefined, actionId: TId): { allowed: boolean; reason: string | null } {
    const descriptor = permissions?.[actionId];
    if (descriptor === undefined) {
        return { allowed: true, reason: null };
    }

    if (typeof descriptor === 'boolean') {
        return { allowed: descriptor, reason: null };
    }

    return {
        allowed: descriptor.allowed,
        reason: descriptor.reason ?? null,
    };
}

function resolveActionState<TId extends string>(
    definition: FormEditorActionDefinition<TId>,
    permissions: FormEditorPermissionMap<TId> | undefined,
    fallback: { disabled?: boolean; disabledReason?: string | null; active?: boolean; loading?: boolean },
) {
    const permission = resolvePermission(permissions, definition.id);
    const disabled = !permission.allowed || Boolean(fallback.disabled);
    return {
        active: Boolean(fallback.active),
        disabled,
        disabledReason: !permission.allowed ? permission.reason : fallback.disabledReason ?? null,
        loading: Boolean(fallback.loading),
    };
}

export function resolveQuestionActions(context: FormEditorQuestionActionContext): FormEditorResolvedQuestionAction[] {
    const actions: FormEditorResolvedQuestionAction[] = [];

    for (const actionId of QUESTION_ACTION_ORDER) {
        if (actionId === 'edit-children' && !context.canOpenChildWorkspace) {
            continue;
        }

        const definition = QUESTION_ACTION_REGISTRY[actionId] as FormEditorQuestionActionDefinition;
        const isContentAction = actionId === 'edit-content';
        const isValidationAction = actionId === 'edit-validation';
        const active = definition.kind === 'surface'
            && context.isEditing
            && context.activeSurfaceId === definition.surfaceId;

        const loading = isContentAction
            ? active && context.isQuestionDraftSaving
            : isValidationAction && active && (context.isValidationLoading || context.isValidationSaving);

        const disabled = actionId === 'edit-children'
            ? context.isQuestionDraftSaving || context.isValidationSaving
            : false;

        actions.push({
            ...definition,
            ...resolveActionState(definition, context.permissions, {
                active,
                loading,
                disabled,
            }),
        });
    }

    return actions;
}

export function resolveHeaderActions(context: FormEditorHeaderActionContext): FormEditorResolvedHeaderAction[] {
    const actions: FormEditorResolvedHeaderAction[] = [];

    for (const actionId of HEADER_ACTION_ORDER) {
        if (actionId === 'retry-save' && !context.canRetrySave) {
            continue;
        }

        const definition = HEADER_ACTION_REGISTRY[actionId];
        const disabled = actionId === 'preview'
            ? !context.canPreview
            : actionId === 'publish'
                ? !context.canPublish
                : false;

        const disabledReason = actionId === 'preview' && !context.canPreview
            ? context.previewDisabledReason
            : null;

        actions.push({
            ...definition,
            ...resolveActionState(definition, context.permissions, {
                disabled,
                disabledReason,
                loading: actionId === 'publish' && context.isPublishing,
            }),
        });
    }

    return actions;
}

export function resolveLauncherActions(
    launchers: FormEditorPanelLauncherConfig[],
    context: FormEditorLauncherActionContext = {},
): FormEditorResolvedLauncherAction[] {
    return launchers.map((launcher) => {
        const permission = resolvePermission(context.permissions, launcher.id);

        return {
            id: buildLauncherActionId(launcher.side, launcher.id),
            kind: 'launcher',
            panelSide: launcher.side,
            panelTabId: launcher.id,
            label: launcher.label,
            tooltip: launcher.label,
            icon: launcher.icon,
            appearance: 'button',
            priority: 'secondary',
            active: false,
            disabled: !permission.allowed,
            disabledReason: permission.allowed ? null : permission.reason,
            loading: false,
        };
    });
}