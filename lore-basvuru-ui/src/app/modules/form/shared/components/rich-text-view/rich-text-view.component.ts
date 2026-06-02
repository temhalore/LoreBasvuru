import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { isRichTextEmpty } from '../../utils/rich-text.util';
import { FroalaSrcPipe } from 'app/shared/pipes/froala-src.pipe';

@Component({
    selector: 'app-rich-text-view',
    standalone: true,
    imports: [CommonModule, FroalaSrcPipe],
    templateUrl: './rich-text-view.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
})
export class RichTextViewComponent {
    @Input() html: string | null | undefined = '';
    @Input() fallback = '';
    @Input() compact = false;

    get hasHtml(): boolean {
        return !isRichTextEmpty(this.html);
    }

    get displayHtml(): string {
        return this.html ?? '';
    }
}
