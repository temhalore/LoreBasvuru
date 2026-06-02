import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FormDto, PageDto, QuestionDto } from '../../../models';
import { FormEditorPanelStateService } from './form-editor-panel-state.service';
import { FormEditorStoreService } from './form-editor-store.service';

describe('FormEditorPanelStateService', () => {
    let service: FormEditorPanelStateService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                FormEditorPanelStateService,
                {
                    provide: FormEditorStoreService,
                    useValue: { form$: of(null), selectedNodeEid$: of(null) },
                },
            ],
        });

        service = TestBed.inject(FormEditorPanelStateService);
    });

    function buildForm(): FormDto {
        return {
            eid: 'form-1',
            sayfalar: [
                {
                    eid: 'page-1',
                    sayfaNo: 1,
                    sayfaBaslik: 'Sayfa 1',
                    sorular: [
                        buildQuestion('q-1', [buildQuestion('q-1-1')]),
                        buildQuestion('q-2'),
                    ],
                } as PageDto,
            ],
        } as FormDto;
    }

    function buildQuestion(eid: string, altSorular: QuestionDto[] = []): QuestionDto {
        return {
            eid,
            soruMetni: `<p>${eid}</p>`,
            altSorular,
        } as QuestionDto;
    }

    it('starts closed with side defaults', () => {
        let leftState: any;
        let rightState: any;

        service.leftPanelState$.subscribe((value) => (leftState = value)).unsubscribe();
        service.rightPanelState$.subscribe((value) => (rightState = value)).unsubscribe();

        expect(leftState).toEqual({ isOpen: false, activeTabId: 'structure' });
        expect(rightState).toEqual({ isOpen: false, activeTabId: 'add' });
    });

    it('keeps the active tab when a panel is reopened', () => {
        service.openPanel('right', 'diagnostics');
        service.closePanel('right');
        service.openPanel('right');

        let rightState: any;
        service.rightPanelState$.subscribe((value) => (rightState = value)).unsubscribe();
        expect(rightState).toEqual({ isOpen: true, activeTabId: 'diagnostics' });
    });

    it('falls back to the side default for invalid tabs', () => {
        service.setActiveTab('left', 'diagnostics');

        let leftState: any;
        service.leftPanelState$.subscribe((value) => (leftState = value)).unsubscribe();
        expect(leftState.activeTabId).toBe('structure');
    });

    function latest<T>(stream: { subscribe: (cb: (v: T) => void) => { unsubscribe(): void } }): T {
        let value!: T;
        stream.subscribe((v) => (value = v)).unsubscribe();
        return value;
    }

    it('tracks collapse and expand state for the structure tree', () => {
        const form = buildForm();
        service.collapseAll(form);

        expect(latest(service.collapsedPageEids$)).toEqual(['page-1']);
        expect(latest(service.collapsedQuestionEids$)).toEqual(['q-1']);

        service.expandAll();
        expect(latest(service.collapsedPageEids$)).toEqual([]);
        expect(latest(service.collapsedQuestionEids$)).toEqual([]);
    });

    it('reveals a selected node without clearing route-lifetime tree state', () => {
        const form = buildForm();
        service.collapseAll(form);
        service.revealNode(form, 'q-1-1');

        expect(latest(service.collapsedPageEids$)).toEqual([]);
        expect(latest(service.collapsedQuestionEids$)).toEqual([]);
        expect(latest(service.reveal$)).toEqual({ nodeEid: 'q-1-1', revision: 1 });
    });

    it('does not churn collapsed streams on a reveal that opens nothing', () => {
        const form = buildForm();
        // Hiçbir şey collapsed değil → reveal yalnız revision'ı artırır.
        const pagesBefore = latest(service.collapsedPageEids$);
        const questionsBefore = latest(service.collapsedQuestionEids$);

        service.revealNode(form, 'q-1-1');

        expect(latest(service.collapsedPageEids$)).toBe(pagesBefore);
        expect(latest(service.collapsedQuestionEids$)).toBe(questionsBefore);
        expect(latest(service.reveal$)).toEqual({ nodeEid: 'q-1-1', revision: 1 });
    });
});
