import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-form-view-page-header',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './form-view-page-header.component.html',
})
export class FormViewPageHeaderComponent {
    @Input() title: string | null | undefined = '';
    @Input() description: string | null | undefined = '';
    @Input() titleFallback = '';
    @Input() descriptionFallback = '';
    @Input() selected = false;
    @Input() nodeEid: string | null = null;

    @Output() readonly select = new EventEmitter<string>();

    get resolvedTitle(): string {
        return this.title?.trim() || this.titleFallback;
    }

    get resolvedDescription(): string {
        return this.description?.trim() || this.descriptionFallback;
    }

    get isSelectable(): boolean {
        return !!this.nodeEid;
    }

    onSelect(): void {
        if (!this.nodeEid) {
            return;
        }

        this.select.emit(this.nodeEid);
    }
}
