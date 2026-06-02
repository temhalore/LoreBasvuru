import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DiagnosticDto } from '../../../../models';

/**
 * Tanı (diagnostics) panel içeriği — saf presentational.
 * Generic panel chrome'undan ayrıştırıldı; yalnız @Input ile beslenir.
 */
@Component({
    selector: 'app-form-editor-diagnostics',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './form-editor-diagnostics.component.html',
    styleUrls: ['./form-editor-diagnostics.component.scss'],
})
export class FormEditorDiagnosticsComponent {
    @Input() diagnostics: DiagnosticDto[] = [];

    trackByDiagnostic(_: number, diagnostic: DiagnosticDto): string {
        return `${diagnostic.code}:${diagnostic.targetKey}:${diagnostic.message}`;
    }
}
