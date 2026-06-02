import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FormPaletteGroup, FormPaletteItemDto, groupPaletteItems } from '../../../../models';

/**
 * Soru/öğe ekleme paleti — saf presentational panel içeriği.
 * Generic panel chrome'undan ayrıştırıldı; @Input ile beslenir, seçimi
 * @Output ile yukarı verir. Palette→canvas CDK drag sözleşmesi (id tabanlı
 * `cdkDropListConnectedTo`) burada yaşar.
 */
@Component({
    selector: 'app-form-editor-palette',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, DragDropModule, MatIconModule],
    templateUrl: './form-editor-palette.component.html',
    styleUrls: ['./form-editor-palette.component.scss'],
})
export class FormEditorPaletteComponent implements OnChanges {
    @Input() paletteItems: FormPaletteItemDto[] = [];
    @Input() isLoading = false;
    @Input() paletteError: string | null = null;
    @Input() connectedTo: string[] = [];

    @Output() readonly itemSelect = new EventEmitter<FormPaletteItemDto>();

    paletteGroups: FormPaletteGroup[] = [];

    readonly noReturnPredicate = (): boolean => false;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['paletteItems']) {
            this.paletteGroups = groupPaletteItems(this.paletteItems);
        }
    }

    selectItem(item: FormPaletteItemDto): void {
        if (!item.isAktif) {
            return;
        }

        this.itemSelect.emit(item);
    }

    trackByPaletteGroup(_: number, group: FormPaletteGroup): string {
        return group.key;
    }

    trackByPaletteItem(_: number, item: FormPaletteItemDto): string {
        return `${item.formItemTipKodDto?.id ?? 0}:${item.soruTipKodDto?.id ?? 0}:${item.sira}`;
    }
}
