import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';

export interface RepeatingGroupShellItem {
    key: string;
    order: number;
    data: unknown;
    fullSpan?: boolean;
}

@Component({
    selector: 'app-repeating-group-shell',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './repeating-group-shell.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepeatingGroupShellComponent {
    @Input() title = '';
    @Input() helpText = '';
    @Input() required = false;
    @Input() items: RepeatingGroupShellItem[] = [];
    @Input() emptyMessage = 'Henüz kayıt eklenmedi.';
    @Input() showAddButton = false;
    @Input() addButtonLabel = 'Yeni Kayıt Ekle';
    @Input() showDeleteButton = false;
    @Input() addDisabled = false;

    @Output() readonly add = new EventEmitter<void>();
    @Output() readonly delete = new EventEmitter<string>();

    @ContentChild(TemplateRef) itemTemplate: TemplateRef<{ $implicit: RepeatingGroupShellItem }> | null = null;

    onDelete(itemKey: string): void {
        this.delete.emit(itemKey);
    }

    trackByItemKey(_: number, item: RepeatingGroupShellItem): string {
        return item.key;
    }
}
