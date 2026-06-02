import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FroalaTextAreaInputComponent } from 'app/shared/components/form-controls/froala-textarea-input/froala-textarea-input.component';
import { buildMatrixColumnGroup, buildMatrixRowGroup, MatrixColumnEditorGroup, MatrixRowEditorGroup, QuestionEditorForm } from '../shared/question-editor-form.factory';
import { richTextToPlainText } from '../../../../../shared/utils/rich-text.util';

@Component({
    selector: 'app-matrix-list-editor',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        DragDropModule,
        FroalaTextAreaInputComponent,
    ],
    templateUrl: './matrix-list-editor.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatrixListEditorComponent {
    @Input({ required: true }) form!: QuestionEditorForm;

    editingItemEid: string | null = null;
    isRowsOpen = false;
    isColumnsOpen = false;

    constructor(private readonly cdr: ChangeDetectorRef) {}

    get rows() {
        return this.form.controls.matrisSatirlar;
    }

    get columns() {
        return this.form.controls.matrisSutunlar;
    }

    trackByEid(_index: number, item: MatrixRowEditorGroup | MatrixColumnEditorGroup): string {
        return item.controls.eid.value;
    }

    getPlainText(html: string): string {
        return richTextToPlainText(html);
    }

    isEditing(item: MatrixRowEditorGroup | MatrixColumnEditorGroup): boolean {
        return this.editingItemEid === item.controls.eid.value;
    }

    startEditing(item: MatrixRowEditorGroup | MatrixColumnEditorGroup): void {
        this.editingItemEid = item.controls.eid.value;
        this.cdr.markForCheck();
    }

    stopEditing(): void {
        this.editingItemEid = null;
        this.cdr.markForCheck();
    }

    addRow(): void {
        const row = buildMatrixRowGroup();
        this.rows.push(row);
        this.startEditing(row);
    }

    removeRow(item: MatrixRowEditorGroup): void {
        if (this.rows.length <= 1) {
            return;
        }
        const index = this.rows.controls.indexOf(item);
        if (index < 0) {
            return;
        }
        if (this.isEditing(item)) {
            this.editingItemEid = null;
        }
        this.rows.removeAt(index);
        this.cdr.markForCheck();
    }

    addColumn(): void {
        const column = buildMatrixColumnGroup();
        this.columns.push(column);
        this.startEditing(column);
    }

    removeColumn(item: MatrixColumnEditorGroup): void {
        if (this.columns.length <= 1) {
            return;
        }
        const index = this.columns.controls.indexOf(item);
        if (index < 0) {
            return;
        }
        if (this.isEditing(item)) {
            this.editingItemEid = null;
        }
        this.columns.removeAt(index);
        this.cdr.markForCheck();
    }

    onRowDrop(event: CdkDragDrop<unknown[]>): void {
        if (event.previousIndex === event.currentIndex) {
            return;
        }
        moveItemInArray(this.rows.controls, event.previousIndex, event.currentIndex);
        this.cdr.markForCheck();
    }

    onColumnDrop(event: CdkDragDrop<unknown[]>): void {
        if (event.previousIndex === event.currentIndex) {
            return;
        }
        moveItemInArray(this.columns.controls, event.previousIndex, event.currentIndex);
        this.cdr.markForCheck();
    }
}

