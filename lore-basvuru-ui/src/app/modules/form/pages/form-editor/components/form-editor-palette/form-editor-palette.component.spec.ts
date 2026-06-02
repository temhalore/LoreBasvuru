import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDropList } from '@angular/cdk/drag-drop';
import { By } from '@angular/platform-browser';
import { FormPaletteItemDto, FORM_ITEM_TIP } from '../../../../models';
import { FormEditorPaletteComponent } from './form-editor-palette.component';

describe('FormEditorPaletteComponent', () => {
    let fixture: ComponentFixture<FormEditorPaletteComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormEditorPaletteComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(FormEditorPaletteComponent);
    });

    function item(active = true): FormPaletteItemDto {
        return {
            isAktif: active,
            icon: 'text_fields',
            title: 'Kisa Yanit',
            description: 'Tek satir metin',
            formItemTipKodDto: { id: FORM_ITEM_TIP.SORU },
            soruTipKodDto: { id: 101 },
            sira: 1,
        } as FormPaletteItemDto;
    }

    it('shows loading and error states from inputs', () => {
        fixture.componentRef.setInput('isLoading', true);
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain('Ekleme secenekleri yukleniyor.');

        fixture.componentRef.setInput('isLoading', false);
        fixture.componentRef.setInput('paletteError', 'hata');
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain('hata');
    });

    it('groups items and exposes the connectedTo contract on the drop list', () => {
        fixture.componentRef.setInput('paletteItems', [item()]);
        fixture.componentRef.setInput('connectedTo', ['qc-list-page-1']);
        fixture.detectChanges();

        const dropList = fixture.debugElement.query(By.css('.editor-question-type-list')).injector.get(CdkDropList);
        expect(dropList.connectedTo).toEqual(['qc-list-page-1']);
        expect(fixture.nativeElement.querySelector('.editor-question-type-card')).not.toBeNull();
    });

    it('emits itemSelect for active items and ignores inactive ones', () => {
        const selected: FormPaletteItemDto[] = [];
        fixture.componentInstance.itemSelect.subscribe((value) => selected.push(value));

        fixture.componentInstance.selectItem(item(true));
        fixture.componentInstance.selectItem(item(false));

        expect(selected.length).toBe(1);
        expect(selected[0].isAktif).toBeTrue();
    });
});
