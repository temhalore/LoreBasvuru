import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActionButtonComponent } from 'app/shared/components/action-button/action-button.component';
import { FormEditorActionFeedbackViewModel, FormEditorHeaderAction, FormEditorHeaderActionEvent, FormEditorSaveViewModel } from '../../models/form-editor-view.model';

@Component({
    selector: 'app-form-editor-header',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, MatIconModule, MatMenuModule, ActionButtonComponent],
    templateUrl: './form-editor-header.component.html',
    styleUrls: ['./form-editor-header.component.scss'],
})
export class FormEditorHeaderComponent {
    @Input() title = '';
    @Input() statusLabel = 'Taslak';
    @Input() saveState: FormEditorSaveViewModel | null = null;
    @Input() actionFeedback: FormEditorActionFeedbackViewModel | null = null;
    @Input() actions: FormEditorHeaderAction[] = [];
    @Input() canUndo = false;
    @Input() canRedo = false;
    @Input() activePageIndex = -1;
    @Input() pageCount = 0;
    @Input() pageNavigationLocked = false;

    @Output() readonly back = new EventEmitter<void>();
    @Output() readonly titleChange = new EventEmitter<string>();
    @Output() readonly action = new EventEmitter<FormEditorHeaderActionEvent>();
    @Output() readonly prevPage = new EventEmitter<void>();
    @Output() readonly nextPage = new EventEmitter<void>();

    get hasPageNavigation(): boolean {
        return this.activePageIndex >= 0 && this.pageCount > 0;
    }

    get canNavigatePrev(): boolean {
        return !this.pageNavigationLocked && this.activePageIndex > 0;
    }

    get canNavigateNext(): boolean {
        return !this.pageNavigationLocked && this.activePageIndex >= 0 && this.activePageIndex < this.pageCount - 1;
    }

    get saveToneClass(): string {
        switch (this.saveState?.tone) {
            case 'info':
                return 'editor-header__autosave--info';
            case 'success':
                return 'editor-header__autosave--success';
            case 'warning':
                return 'editor-header__autosave--warning';
            case 'danger':
                return 'editor-header__autosave--danger';
            default:
                return 'editor-header__autosave--neutral';
        }
    }

    get actionFeedbackClass(): string {
        switch (this.actionFeedback?.tone) {
            case 'danger':
                return 'editor-header__feedback--danger';
            case 'warning':
                return 'editor-header__feedback--warning';
            default:
                return 'editor-header__feedback--info';
        }
    }

    get previewDisabledReason(): string | null {
        const previewAction = this.actions.find((action) => action.id === 'preview');
        return previewAction?.disabled ? previewAction.disabledReason : null;
    }

    onTitleInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.titleChange.emit(input.value ?? '');
    }

    onActionClick(actionId: FormEditorHeaderAction['id']): void {
        this.action.emit({ actionId });
    }

    resolveVariant(action: FormEditorHeaderAction): 'primary' | 'secondary' | 'warning' {
        switch (action.id) {
            case 'retry-save':
                return 'warning';
            case 'publish':
                return 'primary';
            default:
                return 'secondary';
        }
    }

    isOutline(action: FormEditorHeaderAction): boolean {
        return action.id !== 'publish';
    }

    resolveLoadingText(action: FormEditorHeaderAction): string {
        switch (action.id) {
            case 'publish':
                return 'Yayimlaniyor...';
            case 'retry-save':
                return 'Tekrar deneniyor...';
            default:
                return 'Hazirlaniyor...';
        }
    }

    trackByAction(_: number, action: FormEditorHeaderAction): string {
        return action.id;
    }

    onPrevPage(): void {
        if (!this.canNavigatePrev) {
            return;
        }

        this.prevPage.emit();
    }

    onNextPage(): void {
        if (!this.canNavigateNext) {
            return;
        }

        this.nextPage.emit();
    }
}
