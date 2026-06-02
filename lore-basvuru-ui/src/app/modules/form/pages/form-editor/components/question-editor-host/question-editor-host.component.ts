import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { KuralEditorConfigModel } from 'app/base/models/form/kuralV2';
import { QuestionDto } from '../../../../models';
import { QuestionSchema } from '../../../../models/form-schema.model';
import { QuestionTypeRendererComponent } from '../../../../shared/components/question-type-renderer/question-type-renderer.component';
import { buildQuestionRenderState, DEFAULT_UI_RULE_STATE, QuestionRenderState } from '../../../../shared/models/question-render-state.model';
import { FormEditorQuestionActionEvent, FormEditorActiveQuestionSurface, FormEditorValidationSession, QuestionEditorSurfaceId } from '../../models/form-editor-view.model';
import { FormEditorQuestionActionId, FormEditorResolvedQuestionAction } from '../../models/form-editor-action.model';
import { FormEditorActionToolbarComponent } from '../form-editor-action-toolbar/form-editor-action-toolbar.component';
import { QuestionEditorOutletComponent } from '../question-editors/question-editor-outlet/question-editor-outlet.component';
import { QuestionValidationEditorOutletComponent } from 'app/modules/form/pages/form-editor/components/question-editors/question-validation-editor-outlet/question-validation-editor-outlet.component';
import { questionSchemaCanOpenChildWorkspace, resolveQuestionActions } from 'app/modules/form/pages/form-editor/utils/form-editor-action-resolver.util';

@Component({
    selector: 'app-question-editor-host',
    standalone: true,
    imports: [CommonModule, DragDropModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, QuestionTypeRendererComponent, QuestionEditorOutletComponent, QuestionValidationEditorOutletComponent, FormEditorActionToolbarComponent],
    templateUrl: './question-editor-host.component.html',
    styleUrls: ['./question-editor-host.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionEditorHostComponent implements OnChanges {
    @Input() schema!: QuestionSchema;
    @Input() question: QuestionDto | null = null;
    @Input() selectedNodeEid: string | null = null;
    @Input() activeSurface: FormEditorActiveQuestionSurface | null = null;
    @Input() editingQuestionDraft: QuestionDto | null = null;
    @Input() isQuestionDraftSaving = false;
    @Input() questionDraftError: string | null = null;
    @Input() validationSession: FormEditorValidationSession | null = null;
    @Input() validationEditorConfig: KuralEditorConfigModel | null = null;
    @Input() isValidationLoading = false;
    @Input() isValidationSaving = false;
    @Input() validationError: string | null = null;
    @Input() showDragHandle = true;

    @Output() readonly select = new EventEmitter<string>();
    @Output() readonly action = new EventEmitter<FormEditorQuestionActionEvent>();
    @Output() readonly surfaceClose = new EventEmitter<string>();
    @Output() readonly saveDraft = new EventEmitter<QuestionDto>();
    @Output() readonly questionDraftDirtyChange = new EventEmitter<{ questionEid: string; isDirty: boolean }>();
    @Output() readonly saveValidation = new EventEmitter<FormEditorValidationSession>();

    renderState: QuestionRenderState = this.buildRenderState();
    actions: FormEditorResolvedQuestionAction[] = [];
    canOpenChildWorkspace = false;
    isSelected = false;
    isEditing = false;
    containsSelectedNode = false;
    activeSurfaceId: QuestionEditorSurfaceId | null = null;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['schema']) {
            this.renderState = this.buildRenderState();
            this.canOpenChildWorkspace = this.resolveCanOpenChildWorkspace(this.schema);
        }

        if (changes['schema'] || changes['selectedNodeEid']) {
            this.isSelected = this.schema?.eid === this.selectedNodeEid;
            this.containsSelectedNode = Boolean(
                this.selectedNodeEid
                && this.selectedNodeEid !== this.schema?.eid
                && this.questionTreeContainsNode(this.schema?.children ?? [], this.selectedNodeEid),
            );
        }

        if (changes['schema'] || changes['activeSurface']) {
            this.isEditing = this.schema?.eid === this.activeSurface?.questionEid;
            this.activeSurfaceId = this.isEditing ? this.activeSurface?.surfaceId ?? null : null;
        }

        if (
            changes['schema']
            || changes['activeSurface']
            || changes['isQuestionDraftSaving']
            || changes['isValidationLoading']
            || changes['isValidationSaving']
        ) {
            this.actions = resolveQuestionActions({
                questionEid: this.schema?.eid ?? '',
                canOpenChildWorkspace: this.canOpenChildWorkspace,
                activeSurfaceId: this.activeSurfaceId,
                isEditing: this.isEditing,
                isQuestionDraftSaving: this.isQuestionDraftSaving,
                isValidationLoading: this.isValidationLoading,
                isValidationSaving: this.isValidationSaving,
            });
        }
    }

    onSelect(nodeEid: string): void {
        this.select.emit(nodeEid);
    }

    onToolbarAction(actionId: FormEditorQuestionActionId): void {
        this.select.emit(this.schema.eid);
        this.action.emit({ questionEid: this.schema.eid, actionId });
    }

    onSurfaceClose(event: MouseEvent): void {
        event.stopPropagation();
        this.surfaceClose.emit(this.schema.eid);
    }

    onQuestionDraftDirtyChange(isDirty: boolean): void {
        this.questionDraftDirtyChange.emit({ questionEid: this.schema.eid, isDirty });
    }

    private buildRenderState(): QuestionRenderState {
        return buildQuestionRenderState({
            mode: 'editor',
            ruleState: {
                ...DEFAULT_UI_RULE_STATE,
                required: this.schema?.required ?? false,
            },
        });
    }

    private resolveCanOpenChildWorkspace(schema: QuestionSchema | null | undefined): boolean {
        return questionSchemaCanOpenChildWorkspace(schema);
    }

    private questionTreeContainsNode(questions: QuestionSchema[], nodeEid: string | null): boolean {
        if (!nodeEid) {
            return false;
        }

        for (const question of questions) {
            if (question.eid === nodeEid || this.questionTreeContainsNode(question.children ?? [], nodeEid)) {
                return true;
            }
        }

        return false;
    }
}
