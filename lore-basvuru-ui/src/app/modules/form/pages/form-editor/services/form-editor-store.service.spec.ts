import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { FormBuildLoadResult } from './form-build-api.service';
import { FormDto, PageDto, QuestionDto } from '../../../models';
import { FormEditorViewModel } from '../models/form-editor-view.model';
import { FormBuildApiService } from './form-build-api.service';
import { FormEditorStoreService } from './form-editor-store.service';
import { FormEditorPersistenceCoordinatorService } from './form-editor-persistence-coordinator.service';
import { FormEditorValidationOrchestratorService } from './form-editor-validation.orchestrator';
import { KuralV2Service } from '../../kuralv2/kuralv2.service';
import { ResKuralV2Model } from 'app/base/models/form/kuralV2';

/**
 * Karakterizasyon testleri.
 *
 * Bu suite, store'un Faz 2/3 refactor'undan ÖNCEKI gözlemlenebilir davranışını
 * kilitler. Amaç doğruyu ispatlamak değil, mevcut davranışı regresyon ağı olarak
 * sabitlemektir. Faz 2'de C2 (hasPendingChanges koordinasyonu) bilinçli olarak
 * değiştiğinde, ilgili "baseline" testleri kasıtlı güncellenecektir.
 */
describe('FormEditorStoreService (karakterizasyon)', () => {
    let store: FormEditorStoreService;
    let api: jasmine.SpyObj<FormBuildApiService>;
    let kuralV2: jasmine.SpyObj<KuralV2Service>;

    const DEBOUNCE_MS = 600;

    beforeEach(() => {
        api = jasmine.createSpyObj<FormBuildApiService>('FormBuildApiService', [
            'getDraftForm',
            'getPaletteItemList',
            'saveForm',
            'createPage',
            'createQuestionDraft',
            'saveQuestionDraft',
            'reorderQuestions',
            'validateDraft',
            'publishForm',
        ]);
        kuralV2 = jasmine.createSpyObj<KuralV2Service>('KuralV2Service', [
            'GetKuralEditorConfig',
            'GetValidasyonBySoruKokId',
            'AddDirect',
            'SetDirect',
            'DelDirect',
        ]);

        api.getPaletteItemList.and.returnValue(of([]));
        api.validateDraft.and.returnValue(of({ isValid: true, diagnostics: [] }));

        TestBed.configureTestingModule({
            providers: [
                FormEditorPersistenceCoordinatorService,
                FormEditorValidationOrchestratorService,
                FormEditorStoreService,
                { provide: FormBuildApiService, useValue: api },
                { provide: KuralV2Service, useValue: kuralV2 },
            ],
        });

        store = TestBed.inject(FormEditorStoreService);
    });

    function buildForm(overrides: Partial<FormDto> = {}): FormDto {
        return {
            eid: 'form-1',
            baslik: 'Form A',
            yayinDurumKID: 0,
            sayfalar: [buildPage('page-1', [buildQuestion('q-1', 1)])],
            tanilamalar: [],
            ...overrides,
        } as FormDto;
    }

    function buildPage(eid: string, sorular: QuestionDto[] = []): PageDto {
        return {
            eid,
            sayfaNo: 1,
            sayfaBaslik: 'Sayfa 1',
            sayfaAciklama: '',
            sira: 1,
            sorular,
        } as PageDto;
    }

    function buildQuestion(eid: string, sira: number): QuestionDto {
        return {
            eid,
            soruMetni: `<p>${eid}</p>`,
            soruTipKID: 1050001,
            sira,
            soruKokEidDto: { eid: `${eid}-root` },
            formKokEidDto: { eid: 'form-1' },
            altSorular: [],
        } as QuestionDto;
    }

    function latestViewModel(): FormEditorViewModel {
        let vm!: FormEditorViewModel;
        store.viewModel$.subscribe((value) => (vm = value)).unsubscribe();
        return vm;
    }

    function latestValidationSession() {
        let session: any = null;
        store.validationSession$.subscribe((value) => (session = value)).unsubscribe();
        return session;
    }

    function latestValidationLoading(): boolean {
        let isLoading = false;
        store.isValidationLoading$.subscribe((value) => (isLoading = value)).unsubscribe();
        return isLoading;
    }

    function initializeWithForm(form: FormDto): void {
        api.getDraftForm.and.returnValue(of({ form, diagnostics: [] }));
        store.initialize('form-1');
    }

    function buildValidationRule(eid: string, sira: number): ResKuralV2Model {
        return {
            eid,
            sira,
            isAktif: true,
            formKokEIdDto: { eid: 'form-1' },
            formSoruKokEIdDto: { eid: 'question-root' },
            kuralDetay: { kosullar: [] },
        } as ResKuralV2Model;
    }

    it('initialize formu yükler, ilk sayfayı aktif/seçili yapar', () => {
        initializeWithForm(buildForm());

        let activePageEid: string | null = null;
        store.activePageEid$.subscribe((value) => (activePageEid = value)).unsubscribe();
        let selectedNodeEid: string | null = null;
        store.selectedNodeEid$.subscribe((value) => (selectedNodeEid = value)).unsubscribe();

        expect(activePageEid).toBe('page-1');
        expect(selectedNodeEid).toBe('page-1');
        expect(api.getPaletteItemList).toHaveBeenCalled();
        expect(api.validateDraft).toHaveBeenCalledWith('form-1');
        expect(latestViewModel().saveState.status).toBe('idle');
    });

    it('updateTitle aynı başlıkta no-op, save tetiklemez', fakeAsync(() => {
        initializeWithForm(buildForm({ baslik: 'Form A' }));
        store.updateTitle('Form A');
        tick(DEBOUNCE_MS);

        expect(api.saveForm).not.toHaveBeenCalled();
        expect(latestViewModel().saveState.status).toBe('idle');
    }));

    it('updateTitle değişiklikte debounce sonrası document save eder', fakeAsync(() => {
        const form = buildForm();
        initializeWithForm(form);
        api.saveForm.and.returnValue(of({ form: { ...form, baslik: 'Yeni' }, diagnostics: [] }));

        store.updateTitle('Yeni');
        expect(latestViewModel().saveState.status).toBe('dirty');
        expect(api.saveForm).not.toHaveBeenCalled();

        tick(DEBOUNCE_MS);

        expect(api.saveForm).toHaveBeenCalledTimes(1);
        const vm = latestViewModel();
        expect(vm.saveState.status).toBe('saved');
        expect(vm.title).toBe('Yeni');
    }));

    it('document save hatasında dirty korunur ve retry edilebilir', fakeAsync(() => {
        const form = buildForm();
        initializeWithForm(form);
        api.saveForm.and.returnValue(throwError(() => new Error('network')));

        store.updateTitle('Yeni');
        tick(DEBOUNCE_MS);

        const vm = latestViewModel();
        expect(vm.saveState.status).toBe('error');
        expect(vm.saveState.canRetry).toBeTrue();

        api.saveForm.and.returnValue(of({ form: { ...form, baslik: 'Yeni' }, diagnostics: [] }));
        store.retrySave();
        tick();

        expect(api.saveForm).toHaveBeenCalledTimes(2);
        expect(latestViewModel().saveState.status).toBe('saved');
    }));

    it('hızlı ardışık updateTitle çağrıları tek save isteğinde toplanır', fakeAsync(() => {
        const form = buildForm();
        initializeWithForm(form);
        api.saveForm.and.returnValue(of({ form, diagnostics: [] }));

        store.updateTitle('A1');
        tick(200);
        store.updateTitle('A2');
        tick(200);
        store.updateTitle('A3');
        tick(DEBOUNCE_MS);

        expect(api.saveForm).toHaveBeenCalledTimes(1);
    }));

    it('flushDocumentSave bekleyen değişiklik yokken true döner', fakeAsync(() => {
        initializeWithForm(buildForm());

        let result: boolean | undefined;
        store.flushDocumentSave().then((value) => (result = value));
        tick();

        expect(result).toBeTrue();
        expect(api.saveForm).not.toHaveBeenCalled();
    }));

    it('flushDocumentSave açık soru surface varken false döner', fakeAsync(() => {
        initializeWithForm(buildForm());
        store.startQuestionEdit('q-1');

        let result: boolean | undefined;
        store.flushDocumentSave().then((value) => (result = value));
        tick();

        expect(result).toBeFalse();
    }));

    it('flushDocumentSave bekleyen document save kaydini persist edip true doner', fakeAsync(() => {
        const form = buildForm();
        initializeWithForm(form);
        api.saveForm.and.returnValue(of({ form, diagnostics: [] }));

        store.updateTitle('Yeni');
        let result: boolean | undefined;
        store.flushDocumentSave().then((value) => (result = value));
        tick();

        expect(api.saveForm).toHaveBeenCalledTimes(1);
        expect(result).toBeTrue();
    }));

    it('saveQuestionDraft başarıda surface temizler (bekleyen doc değişikliği yokken)', fakeAsync(() => {
        const form = buildForm();
        initializeWithForm(form);
        const saved = buildQuestion('q-1', 1);
        api.saveQuestionDraft.and.returnValue(of({ question: saved, diagnostics: [] }));

        store.startQuestionEdit('q-1');
        void store.saveQuestionDraft(saved);
        tick();

        let activeSurface: unknown;
        store.activeQuestionSurface$.subscribe((value) => (activeSurface = value)).unsubscribe();

        expect(api.saveQuestionDraft).toHaveBeenCalled();
        expect(activeSurface).toBeNull();
        expect(latestViewModel().saveState.status).not.toBe('dirty');
    }));

    it('validation load stale response ile yeni soru oturumunu ezmez', fakeAsync(() => {
        const form = buildForm({
            sayfalar: [buildPage('page-1', [buildQuestion('q-1', 1), buildQuestion('q-2', 2)])],
        });
        const q1Rules$ = new Subject<ResKuralV2Model[]>();
        const q2Rules$ = new Subject<ResKuralV2Model[]>();
        initializeWithForm(form);

        kuralV2.GetKuralEditorConfig.and.returnValue(of({ items: [] }));
        kuralV2.GetValidasyonBySoruKokId.and.callFake((request: { eid: string }) => {
            return request.eid === 'q-1-root' ? q1Rules$.asObservable() : q2Rules$.asObservable();
        });

        store.openQuestionValidation('q-1');
        tick();
        store.openQuestionValidation('q-2');
        tick();

        q1Rules$.next([buildValidationRule('rule-q1', 1)]);
        q1Rules$.complete();
        tick();

        expect(latestValidationSession()).toBeNull();
        expect(latestValidationLoading()).toBeTrue();

        q2Rules$.next([buildValidationRule('rule-q2', 1)]);
        q2Rules$.complete();
        tick();

        const session = latestValidationSession();
        expect(session?.questionEid).toBe('q-2');
        expect(session?.rules.map((item) => item.rule.eid)).toEqual(['rule-q2']);
    }));

    it('validation panel kapatildiktan sonra gec gelen response state yazmaz', fakeAsync(() => {
        const form = buildForm();
        const rules$ = new Subject<ResKuralV2Model[]>();
        initializeWithForm(form);

        kuralV2.GetKuralEditorConfig.and.returnValue(of({ items: [] }));
        kuralV2.GetValidasyonBySoruKokId.and.returnValue(rules$.asObservable());

        store.openQuestionValidation('q-1');
        tick();
        store.closeQuestionSurface('q-1');
        tick();

        rules$.next([buildValidationRule('rule-q1', 1)]);
        rules$.complete();
        tick();

        expect(latestValidationSession()).toBeNull();
        expect(latestValidationLoading()).toBeFalse();
    }));

    it('[C2-fix] bekleyen başlık değişikliği varken draft op başlıkları maskelemez, doc save persist eder', fakeAsync(() => {
        const form = buildForm();
        initializeWithForm(form);
        api.saveForm.and.returnValue(of({ form: { ...form, baslik: 'Yeni' }, diagnostics: [] }));
        const saved = buildQuestion('q-1', 1);
        api.saveQuestionDraft.and.returnValue(of({ question: saved, diagnostics: [] }));

        // Başlık değişti (debounce'lu doc save kuyrukta), hemen ardından draft op.
        store.updateTitle('Yeni');
        store.startQuestionEdit('q-1');
        void store.saveQuestionDraft(saved);
        tick(700);

        // C2 düzeltmesi: draft op, bekleyen doc save'i flush eder; başlık
        // değişikliği KAYBOLMAZ ve hasPendingChanges yanlışlıkla temizlenmez.
        expect(api.saveForm).toHaveBeenCalledTimes(1);
        expect(latestViewModel().saveState.status).toBe('saved');
        expect(latestViewModel().saveState.status).not.toBe('idle');
    }));

    it('reorderQuestions hata durumunda formu önceki haline geri alır', fakeAsync(() => {
        const form = buildForm({
            sayfalar: [buildPage('page-1', [buildQuestion('q-1', 1), buildQuestion('q-2', 2)])],
        });
        initializeWithForm(form);
        api.reorderQuestions.and.returnValue(throwError(() => new Error('fail')));

        void store.reorderQuestions({
            containerEid: 'page-1',
            questionEid: 'q-1',
            previousIndex: 0,
            currentIndex: 1,
        });
        tick();

        let resultForm: FormDto | null = null;
        store.form$.subscribe((value) => (resultForm = value)).unsubscribe();
        const order = (resultForm!.sayfalar?.[0].sorular ?? []).map((q) => q.eid);
        expect(order).toEqual(['q-1', 'q-2']);
    }));

    it('save view model öncelik sırası: saving > dirty > saved', fakeAsync(() => {
        const form = buildForm();
        initializeWithForm(form);
        const saveSubject = new Subject<FormBuildLoadResult>();
        api.saveForm.and.returnValue(saveSubject.asObservable());

        store.updateTitle('Yeni');
        expect(latestViewModel().saveState.status).toBe('dirty');

        tick(DEBOUNCE_MS);
        expect(latestViewModel().saveState.status).toBe('saving');

        saveSubject.next({ form, diagnostics: [] });
        saveSubject.complete();
        tick();
        expect(latestViewModel().saveState.status).toBe('saved');
    }));

    it('açık soru surface preview gerekçesi üretir', () => {
        initializeWithForm(buildForm());
        store.startQuestionEdit('q-1');

        const vm = latestViewModel();
        expect(vm.canPreview).toBeFalse();
        expect(vm.previewDisabledReason).toBeTruthy();
    });
});
