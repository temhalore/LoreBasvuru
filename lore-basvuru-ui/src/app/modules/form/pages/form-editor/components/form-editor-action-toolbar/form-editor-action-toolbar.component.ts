import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormEditorQuestionActionId, FormEditorResolvedQuestionAction } from '../../models/form-editor-action.model';

@Component({
    selector: 'app-form-editor-action-toolbar',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
    templateUrl: './form-editor-action-toolbar.component.html',
    styleUrls: ['./form-editor-action-toolbar.component.scss'],
})
export class FormEditorActionToolbarComponent {
    @Input() actions: FormEditorResolvedQuestionAction[] = [];

    @Output() readonly action = new EventEmitter<FormEditorQuestionActionId>();

    onActionClick(event: MouseEvent, item: FormEditorResolvedQuestionAction): void {
        event.stopPropagation();
        if (item.disabled || item.loading) {
            return;
        }

        this.action.emit(item.id);
    }

    trackByAction(_: number, item: FormEditorResolvedQuestionAction): string {
        return item.id;
    }
}