import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { CdkDropList } from '@angular/cdk/drag-drop';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { MetaService } from 'app/core/services/meta.service';
import { KuralV2Service } from '../kuralv2/kuralv2.service';
import { FormDto, FormPaletteItemDto, FORM_ITEM_TIP } from '../../models';
import { FormEditorComponent } from './form-editor.component';
import { FormBuildApiService } from './services/form-build-api.service';
import { FormEditorStoreService } from './services/form-editor-store.service';
import { FormEditorPanelStateService } from './services/form-editor-panel-state.service';

describe('FormEditorComponent', () => {
    let fixture: ComponentFixture<FormEditorComponent>;
    let api: jasmine.SpyObj<FormBuildApiService>;

    beforeEach(async () => {
        api = jasmine.createSpyObj<FormBuildApiService>('FormBuildApiService', [
            'getDraftForm',
            'getPaletteItemList',
            'validateDraft',
            'saveForm',
            'createPage',
            'createQuestionDraft',
            'saveQuestionDraft',
            'reorderQuestions',
            'publishForm',
        ]);

        api.getDraftForm.and.returnValue(of({
            form: buildForm(),
            diagnostics: [buildDiagnostic('draft warning')],
        }));
        api.getPaletteItemList.and.returnValue(of([buildPaletteItem()]));
        api.validateDraft.and.returnValue(of({
            isValid: false,
            diagnostics: [buildDiagnostic('validate warning')],
        }));

        await TestBed.configureTestingModule({
            imports: [FormEditorComponent, NoopAnimationsModule],
            providers: [
                {
                    provide: MetaService,
                    useValue: { setPageTitle: jasmine.createSpy('setPageTitle') },
                },
                {
                    provide: FormBuildApiService,
                    useValue: api,
                },
                {
                    provide: KuralV2Service,
                    useValue: jasmine.createSpyObj<KuralV2Service>('KuralV2Service', [
                        'GetKuralEditorConfig',
                        'GetValidasyonBySoruKokId',
                        'TopluKaydet',
                    ]),
                },
                {
                    provide: SweetAlertService,
                    useValue: jasmine.createSpyObj<SweetAlertService>('SweetAlertService', ['confirm']),
                },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        paramMap: of(convertToParamMap({ eid: 'form-1' })),
                        snapshot: { paramMap: convertToParamMap({ eid: 'form-1' }) },
                    },
                },
                {
                    provide: Router,
                    useValue: jasmine.createSpyObj<Router>('Router', ['navigate']),
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(FormEditorComponent);
        fixture.detectChanges();
    });

    function openLauncher(title: string): void {
        const button = Array.from(fixture.nativeElement.querySelectorAll('.form-editor-shell__launcher-button'))
            .find((candidate: Element) => candidate.getAttribute('title') === title) as HTMLButtonElement | undefined;
        expect(button).toBeTruthy();
        button?.click();
        fixture.detectChanges();
    }

    it('shows launcher stacks while both panels are closed', () => {
        const launchers = Array.from(fixture.nativeElement.querySelectorAll('.form-editor-shell__launcher-button'))
            .map((button: Element) => button.getAttribute('title'));

        expect(launchers).toEqual(['Yapi', 'Ekle', 'Kutuphane', 'Kosullar', 'Tanilar']);
    });

    it('opens the structure panel from the launcher and hides the left launcher stack', () => {
        openLauncher('Yapi');

        expect(fixture.nativeElement.querySelector('.struct-tree')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.form-editor-shell__launcher-stack--left')).toBeNull();
    });

    it('switches right tabs through the generic panel chrome', () => {
        openLauncher('Ekle');

        const diagnosticsTab = Array.from(fixture.nativeElement.querySelectorAll('.editor-panel__tab-btn'))
            .find((button: Element) => button.getAttribute('aria-label') === 'Tanilar') as HTMLButtonElement | undefined;
        diagnosticsTab?.click();
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('validate warning');
    });

    it('preserves the palette connectedTo contract through the new panel template', () => {
        openLauncher('Ekle');

        const dropList = fixture.debugElement.query(By.css('.editor-question-type-list')).injector.get(CdkDropList);
        expect(dropList.connectedTo).toEqual(['qc-list-page-1']);
    });

    it('routes a palette card click to the store create flow', fakeAsync(() => {
        api.createQuestionDraft.and.returnValue(of(null));
        openLauncher('Ekle');

        const card = fixture.nativeElement.querySelector('.editor-question-type-card') as HTMLButtonElement;
        expect(card).toBeTruthy();
        card.click();
        tick();
        fixture.detectChanges();

        expect(api.createQuestionDraft).toHaveBeenCalled();
    }));

    it('renders the placeholder for an unimplemented tab', () => {
        openLauncher('Kosullar');

        expect(fixture.nativeElement.textContent).toContain('Kural ve kosul editoru gelistirme asamasinda.');
    });

    it('shows the diagnostics empty state when there are no diagnostics', () => {
        api.getDraftForm.and.returnValue(of({ form: buildForm(), diagnostics: [] }));
        api.validateDraft.and.returnValue(of({ isValid: true, diagnostics: [] }));

        const emptyFixture = TestBed.createComponent(FormEditorComponent);
        emptyFixture.detectChanges();

        const launcher = Array.from(emptyFixture.nativeElement.querySelectorAll('.form-editor-shell__launcher-button'))
            .find((candidate: Element) => candidate.getAttribute('title') === 'Tanilar') as HTMLButtonElement | undefined;
        launcher?.click();
        emptyFixture.detectChanges();

        expect(emptyFixture.nativeElement.textContent).toContain('Su anda gosterilecek tani bulunmuyor.');
    });

    it('orchestrates structure-tree reveal from store selection', () => {
        const store = fixture.debugElement.injector.get(FormEditorStoreService);
        const panelState = fixture.debugElement.injector.get(FormEditorPanelStateService);

        store.selectNode('q-1');
        fixture.detectChanges();

        let pendingReveal: string | null = null;
        panelState.state$.subscribe((state) => (pendingReveal = state.structureTree.pendingRevealNodeEid)).unsubscribe();
        expect(pendingReveal).toBe('q-1');
    });
});

function buildForm(): FormDto {
    return {
        eid: 'form-1',
        baslik: 'Form A',
        yayinDurumKID: 0,
        sayfalar: [
            {
                eid: 'page-1',
                sayfaNo: 1,
                sayfaBaslik: 'Sayfa 1',
                sayfaAciklama: '',
                sira: 1,
                sorular: [
                    {
                        eid: 'q-1',
                        soruMetni: '<p>Soru 1</p>',
                        soruTipKID: 101,
                        sira: 1,
                        soruKokEidDto: { eid: 'q-1-root' },
                        formKokEidDto: { eid: 'form-1' },
                        altSorular: [],
                    },
                ],
            },
        ],
        tanilamalar: [],
    } as FormDto;
}

function buildPaletteItem(): FormPaletteItemDto {
    return {
        isAktif: true,
        icon: 'text_fields',
        title: 'Kisa Yanit',
        description: 'Tek satir metin sorusu',
        formItemTipKodDto: { id: FORM_ITEM_TIP.SORU },
        soruTipKodDto: { id: 101 },
        sira: 1,
    } as FormPaletteItemDto;
}

function buildDiagnostic(message: string) {
    return {
        eid: `diag-${message}`,
        code: 'D1',
        severity: 'Warning',
        targetType: 'Question',
        targetKey: 'q-1',
        message,
        details: 'detail',
    };
}
