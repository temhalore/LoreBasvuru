import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DiagnosticDto } from '../../../../models';
import { FormEditorDiagnosticsComponent } from './form-editor-diagnostics.component';

describe('FormEditorDiagnosticsComponent', () => {
    let fixture: ComponentFixture<FormEditorDiagnosticsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormEditorDiagnosticsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(FormEditorDiagnosticsComponent);
    });

    function diagnostic(message: string): DiagnosticDto {
        return {
            eid: `d-${message}`,
            code: 'D1',
            severity: 'Warning',
            targetType: 'Question',
            targetKey: 'q-1',
            message,
            details: 'detay',
        } as DiagnosticDto;
    }

    it('renders the empty state when there are no diagnostics', () => {
        fixture.componentInstance.diagnostics = [];
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('Su anda gosterilecek tani bulunmuyor.');
        expect(fixture.nativeElement.querySelector('.editor-diagnostic')).toBeNull();
    });

    it('renders one card per diagnostic', () => {
        fixture.componentInstance.diagnostics = [diagnostic('birinci'), diagnostic('ikinci')];
        fixture.detectChanges();

        const cards = fixture.nativeElement.querySelectorAll('.editor-diagnostic');
        expect(cards.length).toBe(2);
        expect(fixture.nativeElement.textContent).toContain('birinci');
        expect(fixture.nativeElement.textContent).toContain('ikinci');
    });
});
