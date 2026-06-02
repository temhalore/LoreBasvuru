import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, Subscription, catchError, distinctUntilChanged, forkJoin, map, of, takeUntil } from 'rxjs';
import { KuralEditorConfigModel, ResKuralV2Model } from 'app/base/models/form/kuralV2';
import {
    FormEditorActiveQuestionSurface,
    FormEditorActionFeedbackViewModel,
    FormEditorGroupWorkspaceItem,
    FormEditorPageDraft,
    FormEditorPageReorderEvent,
    FormEditorPageStripItem,
    FormEditorQuestionActionEvent,
    FormEditorQuestionReorderEvent,
    FormEditorValidationSession,
    FormEditorValidationRuleDraft,
    FormEditorViewModel,
    QuestionEditorSurfaceId,
} from '../models/form-editor-view.model';
import { DiagnosticDto, FORM_ITEM_TIP, FormDto, FormPaletteItemDto, PageDto, QuestionDto, RuleDto } from '../../../models';
import { FormBuildApiService } from './form-build-api.service';
import { richTextToPlainText } from '../../../shared/utils/rich-text.util';
import { buildPreviewDisabledReason, buildSaveViewModel, mapPublishStatusLabel } from './form-editor-view.builder';
import { FormEditorValidationOrchestratorService } from './form-editor-validation.orchestrator';
import { FormEditorPersistenceCoordinatorService, PersistenceStatus } from './form-editor-persistence-coordinator.service';
import { dispatchQuestionAction } from '../utils/form-editor-action-dispatch.util';
import { questionDtoCanOpenChildWorkspace, resolveHeaderActions } from '../utils/form-editor-action-resolver.util';
import {
    cloneQuestion,
    countQuestions,
    findContainer,
    findContainerChildren,
    findContainerPageEid,
    findPage,
    findPageIndex,
    findQuestion,
    insertQuestion,
    replaceQuestion,
    resolveQuestionContainerContext,
    resolvePageEidFromNode,
    updateContainerChildren,
} from '../utils/form-tree.util';
import { resolveStackForSelection, validateWorkspaceStack } from '../utils/workspace-stack.util';

interface FormEditorState {
    formEid: string;
    form: FormDto | null;
    diagnostics: DiagnosticDto[];
    paletteItems: FormPaletteItemDto[];
    selectedNodeEid: string | null;
    activeQuestionSurface: FormEditorActiveQuestionSurface | null;
    editingQuestionDraft: QuestionDto | null;
    isQuestionDraftDirty: boolean;
    editingPageDraft: FormEditorPageDraft | null;
    validationSession: FormEditorValidationSession | null;
    validationEditorConfig: KuralEditorConfigModel | null;
    activePageEid: string | null;
    isLoading: boolean;
    isPaletteLoading: boolean;
    isSaving: boolean;
    isCreatingPage: boolean;
    isQuestionDraftSaving: boolean;
    isValidationLoading: boolean;
    isValidationSaving: boolean;
    isPublishing: boolean;
    loadError: string | null;
    saveError: string | null;
    actionFeedback: FormEditorActionFeedbackViewModel | null;
    paletteError: string | null;
    questionDraftError: string | null;
    validationError: string | null;
    hasPendingChanges: boolean;
    lastSavedAt: string | null;
    workspaceStack: FormEditorGroupWorkspaceItem[];
}

interface ValidationSurfaceLoadResult {
    config: KuralEditorConfigModel | null;
    configError: boolean;
    rules: ResKuralV2Model[] | null;
    rulesError: boolean;
}

const DEFAULT_STATE: FormEditorState = {
    formEid: '',
    form: null,
    diagnostics: [],
    paletteItems: [],
    selectedNodeEid: null,
    activeQuestionSurface: null,
    editingQuestionDraft: null,
    isQuestionDraftDirty: false,
    editingPageDraft: null,
    validationSession: null,
    validationEditorConfig: null,
    activePageEid: null,
    isLoading: false,
    isPaletteLoading: false,
    isSaving: false,
    isCreatingPage: false,
    isQuestionDraftSaving: false,
    isValidationLoading: false,
    isValidationSaving: false,
    isPublishing: false,
    loadError: null,
    saveError: null,
    actionFeedback: null,
    paletteError: null,
    questionDraftError: null,
    validationError: null,
    hasPendingChanges: false,
    lastSavedAt: null,
    workspaceStack: [],
};

/**
 * Küçük türetilmiş nesneler (viewModel, pageStripItems) için yapısal eşitlik.
 * Bu nesneler her state emisyonunda yeniden üretilir; referans eşitliği işe
 * yaramaz. JSON karşılaştırması bu boyutta ucuzdur ve gereksiz downstream
 * change-detection'ı (OnPush shell) keser.
 */
function jsonEqual<T>(left: T, right: T): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
}

@Injectable()
export class FormEditorStoreService implements OnDestroy {
    private readonly stateSubject = new BehaviorSubject<FormEditorState>(DEFAULT_STATE);
    private readonly destroy$ = new Subject<void>();
    private validationLoadSessionId = 0;
    private validationLoadSubscription: Subscription | null = null;

    readonly state$ = this.stateSubject.asObservable();

    readonly viewModel$ = this.state$.pipe(
        map((state) => this.buildViewModel(state)),
        distinctUntilChanged(jsonEqual),
    );

    readonly form$ = this.state$.pipe(
        map((state) => state.form),
        distinctUntilChanged(),
    );

    readonly diagnostics$ = this.state$.pipe(
        map((state) => state.diagnostics),
        distinctUntilChanged(),
    );

    readonly paletteItems$ = this.state$.pipe(
        map((state) => state.paletteItems),
        distinctUntilChanged(),
    );

    readonly isPaletteLoading$ = this.state$.pipe(
        map((state) => state.isPaletteLoading),
        distinctUntilChanged(),
    );

    readonly paletteError$ = this.state$.pipe(
        map((state) => state.paletteError),
        distinctUntilChanged(),
    );

    readonly selectedNodeEid$ = this.state$.pipe(
        map((state) => state.selectedNodeEid),
        distinctUntilChanged(),
    );

    readonly activeQuestionSurface$ = this.state$.pipe(
        map((state) => state.activeQuestionSurface),
        distinctUntilChanged((left, right) => left?.questionEid === right?.questionEid && left?.surfaceId === right?.surfaceId),
    );

    readonly editingQuestionEid$ = this.state$.pipe(
        map((state) => state.activeQuestionSurface?.surfaceId === 'content' ? state.activeQuestionSurface.questionEid : null),
        distinctUntilChanged(),
    );

    readonly editingQuestionDraft$ = this.state$.pipe(
        map((state) => state.editingQuestionDraft),
        distinctUntilChanged(),
    );

    readonly pageEditDraft$ = this.state$.pipe(
        map((state) => state.editingPageDraft),
        distinctUntilChanged(),
    );

    readonly isQuestionDraftSaving$ = this.state$.pipe(
        map((state) => state.isQuestionDraftSaving),
        distinctUntilChanged(),
    );

    readonly questionDraftError$ = this.state$.pipe(
        map((state) => state.questionDraftError),
        distinctUntilChanged(),
    );

    readonly validationSession$ = this.state$.pipe(
        map((state) => state.validationSession),
        distinctUntilChanged(),
    );

    readonly validationEditorConfig$ = this.state$.pipe(
        map((state) => state.validationEditorConfig),
        distinctUntilChanged(),
    );

    readonly isValidationLoading$ = this.state$.pipe(
        map((state) => state.isValidationLoading),
        distinctUntilChanged(),
    );

    readonly isValidationSaving$ = this.state$.pipe(
        map((state) => state.isValidationSaving),
        distinctUntilChanged(),
    );

    readonly validationError$ = this.state$.pipe(
        map((state) => state.validationError),
        distinctUntilChanged(),
    );

    readonly activePageEid$ = this.state$.pipe(
        map((state) => state.activePageEid),
        distinctUntilChanged(),
    );

    readonly activePage$ = this.state$.pipe(
        map((state) => findPage(state.form, state.activePageEid)),
        distinctUntilChanged(),
    );

    readonly activePageIndex$ = this.state$.pipe(
        map((state) => findPageIndex(state.form, state.activePageEid)),
        distinctUntilChanged(),
    );

    readonly pageCount$ = this.state$.pipe(
        map((state) => state.form?.sayfalar?.length ?? 0),
        distinctUntilChanged(),
    );

    readonly pageStripItems$ = this.state$.pipe(
        map((state) => this.buildPageStripItems(state.form, state.activePageEid)),
        distinctUntilChanged(jsonEqual),
    );

    readonly loadError$ = this.state$.pipe(
        map((state) => state.loadError),
        distinctUntilChanged(),
    );

    readonly isLoading$ = this.state$.pipe(
        map((state) => state.isLoading),
        distinctUntilChanged(),
    );

    readonly workspaceStack$ = this.state$.pipe(
        map((state) => state.workspaceStack),
        distinctUntilChanged(),
    );

    readonly isGroupWorkspaceOpen$ = this.workspaceStack$.pipe(
        map((stack) => stack.length > 0),
        distinctUntilChanged(),
    );

    readonly activeContainerEid$ = this.state$.pipe(
        map((state) => state.workspaceStack[state.workspaceStack.length - 1]?.containerEid ?? state.activePageEid),
        distinctUntilChanged(),
    );

    constructor(
        private readonly formBuildApiService: FormBuildApiService,
        private readonly validationOrchestrator: FormEditorValidationOrchestratorService,
        private readonly persistence: FormEditorPersistenceCoordinatorService,
    ) {
        // Tek-yazıcı ilkesi: persistence statü alanlarını (hasPendingChanges,
        // isSaving, saveError, lastSavedAt) yalnızca koordinatör aboneliği yazar.
        this.persistence.status$
            .pipe(takeUntil(this.destroy$))
            .subscribe((status) => this.applyPersistenceStatus(status));

        this.persistence.documentPersisted$
            .pipe(takeUntil(this.destroy$))
            .subscribe(({ form, diagnostics }) => {
                this.patchState({ form, diagnostics });
            });
    }

    private applyPersistenceStatus(status: PersistenceStatus): void {
        const state = this.stateSubject.value;
        if (
            state.hasPendingChanges === status.pending
            && state.isSaving === status.saving
            && state.saveError === status.error
            && state.lastSavedAt === status.lastSavedAt
        ) {
            return;
        }

        this.patchState({
            hasPendingChanges: status.pending,
            isSaving: status.saving,
            saveError: status.error,
            lastSavedAt: status.lastSavedAt,
        });
    }

    initialize(formEid: string): void {
        const normalizedFormEid = formEid.trim();

        this.invalidateValidationSurfaceLoad();
        this.persistence.reset();
        this.stateSubject.next({
            ...DEFAULT_STATE,
            formEid: normalizedFormEid,
            isLoading: true,
        });

        this.loadPaletteItems();

        this.formBuildApiService.getDraftForm(normalizedFormEid)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    const initialPageEid = result.form?.sayfalar?.[0]?.eid ?? null;
                    const selectedNodeEid = initialPageEid ?? result.form?.eid ?? null;
                    this.patchState({
                        form: result.form,
                        diagnostics: result.diagnostics,
                        selectedNodeEid,
                        activePageEid: initialPageEid,
                        isLoading: false,
                        loadError: result.form ? null : 'Form yüklenemedi.',
                    });

                    if (normalizedFormEid) {
                        this.refreshDiagnostics();
                    }
                },
                error: () => {
                    this.patchState({
                        isLoading: false,
                        loadError: 'Form yüklenirken hata oluştu.',
                    });
                },
            });
    }

    updateTitle(title: string): void {
        const state = this.stateSubject.value;
        if (!state.form) {
            return;
        }

        const normalizedTitle = title.trim();
        if ((state.form.baslik?.trim() ?? '') === normalizedTitle) {
            return;
        }

        const nextForm = {
            ...state.form,
            baslik: normalizedTitle,
        };

        this.patchState({ form: nextForm });
        this.persistence.queueDocumentSave(nextForm);
    }

    retrySave(): void {
        const state = this.stateSubject.value;
        if (!state.form || !state.hasPendingChanges) {
            return;
        }

        this.persistence.retry(state.form);
    }

    async flushDocumentSave(): Promise<boolean> {
        const state = this.stateSubject.value;
        if (state.activeQuestionSurface || state.editingPageDraft || state.isQuestionDraftSaving) {
            return false;
        }

        return this.persistence.flush();
    }

    /**
     * Önizleme bloklandığında sessiz iptal yerine kullanıcıya görünür
     * geri bildirim verir (neden header'da da görünür ama aksiyon anında).
     */
    notifyPreviewBlocked(): void {
        const reason = buildPreviewDisabledReason(this.stateSubject.value);
        if (!reason) {
            return;
        }

        this.patchState({
            actionFeedback: { message: reason, tone: 'warning' },
        });
    }

    selectNode(nodeEid: string): void {
        if (!nodeEid.trim()) {
            return;
        }

        const trimmedNodeEid = nodeEid.trim();
        const state = this.stateSubject.value;
        const resolvedActivePageEid = resolvePageEidFromNode(state.form, trimmedNodeEid) ?? state.activePageEid;
        const isCurrentSurfaceNode = state.activeQuestionSurface?.questionEid === trimmedNodeEid;
        const shouldKeepDraft = isCurrentSurfaceNode && state.activeQuestionSurface?.surfaceId === 'content';
        const nextStack = resolveStackForSelection(state.form, state.workspaceStack, trimmedNodeEid);
        if (state.activeQuestionSurface?.surfaceId === 'validation' && !isCurrentSurfaceNode) {
            this.invalidateValidationSurfaceLoad();
        }

        this.patchState({
            selectedNodeEid: trimmedNodeEid,
            activeQuestionSurface: isCurrentSurfaceNode ? state.activeQuestionSurface : null,
            editingQuestionDraft: shouldKeepDraft ? state.editingQuestionDraft : null,
            isQuestionDraftDirty: shouldKeepDraft ? state.isQuestionDraftDirty : false,
            editingPageDraft: state.editingPageDraft?.eid === resolvedActivePageEid ? state.editingPageDraft : null,
            isQuestionDraftSaving: shouldKeepDraft ? state.isQuestionDraftSaving : false,
            questionDraftError: shouldKeepDraft ? state.questionDraftError : null,
            validationSession: isCurrentSurfaceNode ? state.validationSession : null,
            isValidationLoading: isCurrentSurfaceNode ? state.isValidationLoading : false,
            isValidationSaving: isCurrentSurfaceNode ? state.isValidationSaving : false,
            validationError: isCurrentSurfaceNode ? state.validationError : null,
            activePageEid: resolvedActivePageEid,
            workspaceStack: nextStack,
        });
    }

    openGroupWorkspace(containerEid: string): void {
        const trimmedEid = containerEid?.trim() ?? '';
        if (!trimmedEid) {
            return;
        }

        const state = this.stateSubject.value;
        const question = findQuestion(state.form, trimmedEid);
        if (!question || !questionDtoCanOpenChildWorkspace(question)) {
            return;
        }

        const currentTop = state.workspaceStack[state.workspaceStack.length - 1];
        if (currentTop?.containerEid === trimmedEid) {
            return;
        }

        if (state.activeQuestionSurface?.surfaceId === 'validation') {
            this.invalidateValidationSurfaceLoad();
        }

        const editingPatch = state.activeQuestionSurface
            ? this.clearActiveQuestionSurfaceState()
            : {};

        this.patchState({
            ...editingPatch,
            workspaceStack: [...state.workspaceStack, { containerEid: trimmedEid }],
        });
    }

    popGroupWorkspace(): void {
        const state = this.stateSubject.value;
        if (!state.workspaceStack.length) {
            return;
        }

        this.patchState({
            workspaceStack: state.workspaceStack.slice(0, -1),
        });
    }

    clearGroupWorkspace(): void {
        const state = this.stateSubject.value;
        if (!state.workspaceStack.length) {
            return;
        }

        this.patchState({ workspaceStack: [] });
    }

    startQuestionEdit(questionEid: string): void {
        this.openQuestionSurface(questionEid, 'content');
    }

    beginPageEdit(pageEid: string): void {
        const trimmedPageEid = pageEid?.trim() ?? '';
        if (!trimmedPageEid) {
            return;
        }

        const state = this.stateSubject.value;
        const page = findPage(state.form, trimmedPageEid);
        if (!page) {
            return;
        }

        this.patchState({
            editingPageDraft: {
                eid: page.eid,
                sayfaBaslik: page.sayfaBaslik ?? '',
                sayfaAciklama: page.sayfaAciklama ?? '',
                isDirty: false,
            },
            actionFeedback: null,
        });
    }

    patchPageEditDraft(patch: Partial<Pick<FormEditorPageDraft, 'sayfaBaslik' | 'sayfaAciklama'>>): void {
        const state = this.stateSubject.value;
        const currentDraft = state.editingPageDraft;
        if (!currentDraft) {
            return;
        }

        const page = findPage(state.form, currentDraft.eid);
        if (!page) {
            return;
        }

        const nextDraft: FormEditorPageDraft = {
            ...currentDraft,
            ...patch,
            isDirty: false,
        };

        nextDraft.isDirty = nextDraft.sayfaBaslik !== (page.sayfaBaslik ?? '')
            || nextDraft.sayfaAciklama !== (page.sayfaAciklama ?? '');

        this.patchState({ editingPageDraft: nextDraft });
    }

    commitPageEdit(): void {
        const state = this.stateSubject.value;
        const pageDraft = state.editingPageDraft;
        if (!state.form || !pageDraft) {
            return;
        }

        const page = findPage(state.form, pageDraft.eid);
        if (!page) {
            return;
        }

        const sayfaBaslik = pageDraft.sayfaBaslik.trim();
        const sayfaAciklama = pageDraft.sayfaAciklama.trim();
        if ((page.sayfaBaslik ?? '') === sayfaBaslik && (page.sayfaAciklama ?? '') === sayfaAciklama) {
            this.patchState({ editingPageDraft: null });
            return;
        }

        const nextForm = {
            ...state.form,
            sayfalar: (state.form.sayfalar ?? []).map((currentPage) => currentPage.eid === pageDraft.eid
                ? { ...currentPage, sayfaBaslik, sayfaAciklama }
                : currentPage),
        };

        this.patchState({
            form: nextForm,
            editingPageDraft: null,
        });

        this.persistence.queueDocumentSave(nextForm);
    }

    cancelPageEdit(pageEid?: string): void {
        const trimmedPageEid = pageEid?.trim() ?? '';
        const state = this.stateSubject.value;

        if (trimmedPageEid && state.editingPageDraft?.eid !== trimmedPageEid) {
            return;
        }

        if (!state.editingPageDraft) {
            return;
        }

        this.patchState({ editingPageDraft: null });
    }

    setQuestionDraftDirty(questionEid: string, isDirty: boolean): void {
        const trimmedQuestionEid = questionEid?.trim() ?? '';
        if (!trimmedQuestionEid) {
            return;
        }

        const state = this.stateSubject.value;
        if (state.activeQuestionSurface?.surfaceId !== 'content' || state.activeQuestionSurface.questionEid !== trimmedQuestionEid) {
            return;
        }

        if (state.isQuestionDraftDirty === isDirty) {
            return;
        }

        this.patchState({ isQuestionDraftDirty: isDirty });
    }

    openQuestionValidation(questionEid: string): void {
        this.openQuestionSurface(questionEid, 'validation');
    }

    handleQuestionAction(event: FormEditorQuestionActionEvent): void {
        dispatchQuestionAction(event, {
            openQuestionSurface: (questionEid, surfaceId) => {
                this.openQuestionSurface(questionEid, surfaceId);
            },
            openGroupWorkspace: (questionEid) => {
                this.openGroupWorkspace(questionEid);
            },
        });
    }

    closeQuestionSurface(questionEid?: string): void {
        const trimmedQuestionEid = questionEid?.trim() ?? '';
        const state = this.stateSubject.value;
        if (trimmedQuestionEid && state.activeQuestionSurface?.questionEid !== trimmedQuestionEid) {
            return;
        }

        if (state.activeQuestionSurface?.surfaceId === 'validation') {
            this.invalidateValidationSurfaceLoad();
        }

        this.patchState(this.clearActiveQuestionSurfaceState());
    }

    clearSelection(): void {
        if (this.stateSubject.value.activeQuestionSurface?.surfaceId === 'validation') {
            this.invalidateValidationSurfaceLoad();
        }

        this.patchState({
            selectedNodeEid: null,
            ...this.clearActiveQuestionSurfaceState(),
        });
    }

    stopQuestionEdit(questionEid?: string): void {
        const trimmedQuestionEid = questionEid?.trim() ?? '';
        const state = this.stateSubject.value;
        if (trimmedQuestionEid && state.activeQuestionSurface?.questionEid !== trimmedQuestionEid) {
            return;
        }

        if (state.activeQuestionSurface?.surfaceId !== 'content') {
            return;
        }

        this.patchState(this.clearActiveQuestionSurfaceState());
    }

    selectPaletteItem(item: FormPaletteItemDto): void {
        const itemTipId = item.formItemTipKodDto?.id ?? 0;

        if (itemTipId === FORM_ITEM_TIP.SAYFA) {
            void this.createPageDraft();
            return;
        }

        if (itemTipId === FORM_ITEM_TIP.SORU && item.soruTipKodDto?.id) {
            const state = this.stateSubject.value;
            const containerEid = state.workspaceStack[state.workspaceStack.length - 1]?.containerEid ?? state.activePageEid;
            if (!containerEid) {
                return;
            }
            const children = findContainerChildren(state.form, containerEid) ?? [];
            const sira = this.resolveInsertSira(children, state.selectedNodeEid);
            void this.createQuestionAtPosition(item, sira, containerEid);
        }
    }

    async createQuestionAtPosition(item: FormPaletteItemDto, sira: number, containerEid: string): Promise<void> {
        const state = this.stateSubject.value;
        const formEid = state.form?.eid ?? state.formEid;
        const container = findContainer(state.form, containerEid);
        const containerContext = resolveQuestionContainerContext(state.form, containerEid);

        if (!formEid || !container || !containerContext || !item.soruTipKodDto?.id || state.isQuestionDraftSaving) {
            return;
        }

        const targetPageEid = containerContext.pageEid ?? findContainerPageEid(state.form, containerEid) ?? state.activePageEid;

        this.patchState({
            isQuestionDraftSaving: true,
            questionDraftError: null,
        });

        // Serializasyon: önce bekleyen document save'i settle et, sonra op'u kaydet.
        await this.persistence.flushDocument();
        this.persistence.beginOp();

        this.formBuildApiService.createQuestionDraft({
            formKokEidDto: { eid: formEid },
            sayfaKokEidDto: { eid: containerContext.pageEid },
            parentSoruKokEidDto: containerContext.parentQuestionEid
                ? { eid: containerContext.parentQuestionEid }
                : null,
            soruTipKodDto: item.soruTipKodDto,
            sira,
        }).pipe(takeUntil(this.destroy$)).subscribe({
            next: (question) => {
                this.persistence.endOp();
                if (!question?.eid) {
                    this.patchState({
                        isQuestionDraftSaving: false,
                        questionDraftError: 'Soru olusturulamadi.',
                    });
                    return;
                }

                this.patchState({
                    form: insertQuestion(this.stateSubject.value.form, containerEid, question),
                    selectedNodeEid: question.eid,
                    activeQuestionSurface: { questionEid: question.eid, surfaceId: 'content' },
                    editingQuestionDraft: cloneQuestion(question),
                    isQuestionDraftDirty: false,
                    activePageEid: targetPageEid,
                    isQuestionDraftSaving: false,
                    questionDraftError: null,
                    actionFeedback: null,
                });

                this.refreshDiagnostics();
            },
            error: () => {
                this.persistence.endOp();
                this.patchState({
                    isQuestionDraftSaving: false,
                    questionDraftError: 'Soru olusturulurken hata olustu.',
                });
            },
        });
    }

    async reorderQuestions(event: FormEditorQuestionReorderEvent): Promise<void> {
        const preChildren = findContainerChildren(this.stateSubject.value.form, event.containerEid);
        if (
            !this.stateSubject.value.form ||
            !preChildren ||
            event.previousIndex === event.currentIndex ||
            event.previousIndex < 0 ||
            event.currentIndex < 0 ||
            event.previousIndex >= preChildren.length ||
            event.currentIndex >= preChildren.length ||
            preChildren[event.previousIndex]?.eid !== event.questionEid
        ) {
            return;
        }

        // Serializasyon: reorder optimistic mutasyonunu, bekleyen document
        // save settle olduktan SONRA en güncel form üzerinden uygula; aksi
        // halde document save yanıtı reorder'ı ezebilir.
        await this.persistence.flushDocument();

        const state = this.stateSubject.value;
        const children = findContainerChildren(state.form, event.containerEid);
        const containerContext = resolveQuestionContainerContext(state.form, event.containerEid);
        if (
            !state.form ||
            !children ||
            !containerContext ||
            event.previousIndex >= children.length ||
            event.currentIndex >= children.length ||
            children[event.previousIndex]?.eid !== event.questionEid
        ) {
            return;
        }

        const nextForm = updateContainerChildren(state.form, event.containerEid, (existing) => {
            const next = [...existing];
            const [moved] = next.splice(event.previousIndex, 1);
            next.splice(event.currentIndex, 0, moved);
            return next.map((q, i) => ({ ...q, sira: i + 1 }));
        });

        if (!nextForm || nextForm === state.form) {
            return;
        }

        const orderedEids = (findContainerChildren(nextForm, event.containerEid) ?? []).map((q) => q.eid);
        const previousForm = state.form;
        this.patchState({ form: nextForm });
        this.persistence.beginOp();

        this.formBuildApiService.reorderQuestions({
            sayfaKokEidDto: { eid: containerContext.pageEid },
            parentSoruKokEidDto: containerContext.parentQuestionEid
                ? { eid: containerContext.parentQuestionEid }
                : null,
            siraliSoruKokEidDtoler: orderedEids.map((eid) => ({ eid })),
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.persistence.endOp();
                    this.patchState({ actionFeedback: null });
                    this.refreshDiagnostics();
                },
                error: () => {
                    this.persistence.endOp();
                    this.patchState({
                        form: previousForm,
                        actionFeedback: {
                            message: 'Soru sirasi kaydedilemedi.',
                            tone: 'danger',
                        },
                    });
                },
            });
    }

    async autoSaveBeforeDrag(): Promise<void> {
        const state = this.stateSubject.value;
        const draft = state.activeQuestionSurface?.surfaceId === 'content' ? state.editingQuestionDraft : null;

        this.patchState(this.clearActiveQuestionSurfaceState());

        if (draft?.eid) {
            await this.persistence.flushDocument();
            this.persistence.beginOp();
            this.formBuildApiService.saveQuestionDraft(draft)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (result) => {
                        this.persistence.endOp();
                        if (result.question) {
                            this.patchState({
                                form: replaceQuestion(this.stateSubject.value.form, result.question),
                                actionFeedback: null,
                            });
                            this.refreshDiagnostics();
                            return;
                        }

                        this.patchState({
                            actionFeedback: {
                                message: 'Surukleme oncesi soru taslagi kaydedilemedi.',
                                tone: 'danger',
                            },
                        });
                    },
                    error: () => {
                        this.persistence.endOp();
                        this.patchState({
                            actionFeedback: {
                                message: 'Surukleme oncesi soru taslagi kaydedilemedi.',
                                tone: 'danger',
                            },
                        });
                    },
                });
        }
    }

    private resolveInsertSira(children: QuestionDto[], selectedNodeEid: string | null): number {
        if (!selectedNodeEid || !children.length) {
            return children.length + 1;
        }

        const selectedIndex = children.findIndex((q) => q.eid === selectedNodeEid);
        if (selectedIndex === -1) {
            return children.length + 1;
        }

        return (children[selectedIndex].sira ?? selectedIndex + 1) + 1;
    }

    private async createPageDraft(): Promise<void> {
        const state = this.stateSubject.value;
        const formEid = state.form?.eid ?? state.formEid;

        if (!formEid || state.isSaving || state.isCreatingPage) {
            return;
        }

        const nextPageNumber = (state.form?.sayfalar?.length ?? 0) + 1;

        this.patchState({ isCreatingPage: true, actionFeedback: null });

        await this.persistence.flushDocument();
        this.persistence.beginOp();

        this.formBuildApiService.createPage({
            formKokEidDto: { eid: formEid },
            sayfaNo: nextPageNumber,
            sayfaBaslik: `Sayfa ${nextPageNumber}`,
            sayfaAciklama: '',
            sira: nextPageNumber,
            sorular: [],
        }).pipe(takeUntil(this.destroy$)).subscribe({
            next: (page) => {
                this.persistence.endOp();
                if (!page?.eid) {
                    this.patchState({
                        isCreatingPage: false,
                        actionFeedback: {
                            message: 'Sayfa olusturulamadi.',
                            tone: 'danger',
                        },
                    });
                    return;
                }

                const currentForm = this.stateSubject.value.form;
                const nextForm = currentForm
                    ? { ...currentForm, sayfalar: [...(currentForm.sayfalar ?? []), page] }
                    : currentForm;

                this.patchState({
                    form: nextForm,
                    selectedNodeEid: page.eid,
                    activePageEid: page.eid,
                    isCreatingPage: false,
                    actionFeedback: null,
                });

                this.refreshDiagnostics();
            },
            error: () => {
                this.persistence.endOp();
                this.patchState({
                    isCreatingPage: false,
                    actionFeedback: {
                        message: 'Sayfa olusturulurken hata olustu.',
                        tone: 'danger',
                    },
                });
            },
        });
    }

    async saveQuestionDraft(questionDraft: QuestionDto): Promise<void> {
        const state = this.stateSubject.value;

        if (!questionDraft.eid || state.isQuestionDraftSaving) {
            return;
        }

        this.patchState({
            isQuestionDraftSaving: true,
            questionDraftError: null,
        });

        await this.persistence.flushDocument();
        this.persistence.beginOp();

        this.formBuildApiService.saveQuestionDraft(questionDraft).pipe(takeUntil(this.destroy$)).subscribe({
            next: (result) => {
                this.persistence.endOp();
                if (!result.question) {
                    this.patchState({
                        isQuestionDraftSaving: false,
                        questionDraftError: 'Soru kaydedilemedi.',
                    });
                    return;
                }

                // Not: saveQuestionDraft yanıtı tanılama taşımıyor; tanılamalar
                // backend sözleşmesi gereği Taslak/Dogrula ile ayrıca tazelenir.
                this.patchState({
                    form: replaceQuestion(this.stateSubject.value.form, result.question),
                    ...this.clearActiveQuestionSurfaceState(),
                    actionFeedback: null,
                });

                this.refreshDiagnostics();
            },
            error: () => {
                this.persistence.endOp();
                this.patchState({
                    isQuestionDraftSaving: false,
                    questionDraftError: 'Soru kaydedilirken hata olustu.',
                });
            },
        });
    }

    async saveValidationSession(session: FormEditorValidationSession): Promise<void> {
        const state = this.stateSubject.value;
        if (!session.questionEid || state.isValidationSaving) {
            return;
        }

        this.patchState({
            isValidationSaving: true,
            validationError: null,
            actionFeedback: null,
        });

        this.persistence.beginOp();
        try {
            const normalizedRules = await this.validationOrchestrator.commitSession(session);

            this.patchState({
                validationSession: {
                    questionEid: session.questionEid,
                    rules: normalizedRules.map<FormEditorValidationRuleDraft>((rule) => ({
                        rule,
                        state: 'existing',
                    })),
                    activeRuleEid: null,
                    isDirty: false,
                },
                isValidationSaving: false,
                validationError: null,
                actionFeedback: null,
            });

            this.refreshDiagnostics();
            this.closeQuestionSurface(session.questionEid);
        } catch {
            this.patchState({
                isValidationSaving: false,
                validationError: 'Validasyon degisiklikleri kaydedilemedi.',
            });
        } finally {
            this.persistence.endOp();
        }
    }

    setActivePage(pageEid: string, selectPage = true): void {
        const trimmedPageEid = pageEid.trim();
        if (!trimmedPageEid) {
            return;
        }

        const state = this.stateSubject.value;
        if (!findPage(state.form, trimmedPageEid)) {
            return;
        }

        this.patchState({
            activePageEid: trimmedPageEid,
            selectedNodeEid: selectPage ? trimmedPageEid : state.selectedNodeEid,
            editingPageDraft: state.editingPageDraft?.eid === trimmedPageEid ? state.editingPageDraft : null,
            workspaceStack: [],
        });
    }

    reorderPages(event: FormEditorPageReorderEvent): void {
        const state = this.stateSubject.value;
        const pages = state.form?.sayfalar ?? [];
        if (!state.form || pages.length < 2) {
            return;
        }

        const previousIndex = event.previousIndex;
        const currentIndex = event.currentIndex;
        if (
            previousIndex === currentIndex ||
            previousIndex < 0 ||
            currentIndex < 0 ||
            previousIndex >= pages.length ||
            currentIndex >= pages.length ||
            pages[previousIndex]?.eid !== event.pageEid
        ) {
            return;
        }

        const nextPages = [...pages];
        const [movedPage] = nextPages.splice(previousIndex, 1);
        nextPages.splice(currentIndex, 0, movedPage);

        const normalizedPages = nextPages.map((page, index) => ({
            ...page,
            sayfaNo: index + 1,
            sira: index + 1,
        }));

        const nextForm = {
            ...state.form,
            sayfalar: normalizedPages,
        };

        this.patchState({
            form: nextForm,
            activePageEid: state.activePageEid,
        });

        this.persistence.queueDocumentSave(nextForm);
    }

    refreshDiagnostics(): void {
        const { formEid } = this.stateSubject.value;
        if (!formEid) {
            return;
        }

        this.formBuildApiService.validateDraft(formEid)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    this.patchState({ diagnostics: result.diagnostics });
                },
            });
    }

    private loadPaletteItems(): void {
        this.patchState({
            isPaletteLoading: true,
            paletteError: null,
        });

        this.formBuildApiService.getPaletteItemList()
            .pipe(
                catchError(() => of<FormPaletteItemDto[]>([])),
                takeUntil(this.destroy$),
            )
            .subscribe((paletteItems) => {
                this.patchState({
                    paletteItems,
                    isPaletteLoading: false,
                    paletteError: paletteItems.length ? null : 'Ekleme secenekleri yuklenemedi.',
                });
            });
    }

    publish(): void {
        const state = this.stateSubject.value;
        if (!state.formEid || state.isPublishing) {
            return;
        }

        this.patchState({ isPublishing: true });

        this.formBuildApiService.publishForm(state.formEid)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    const currentForm = this.stateSubject.value.form;
                    const nextForm = currentForm
                        ? {
                            ...currentForm,
                            yayinDurumKID: result.publishStatusId || currentForm.yayinDurumKID,
                        }
                        : currentForm;

                    this.patchState({
                        form: nextForm,
                        diagnostics: result.diagnostics,
                        isPublishing: false,
                    });
                },
                error: () => {
                    this.patchState({
                        isPublishing: false,
                        loadError: 'Yayınlama işlemi sırasında hata oluştu.',
                    });
                },
            });
    }

    private buildViewModel(state: FormEditorState): FormEditorViewModel {
        const title = state.form?.baslik?.trim() ?? '';
        const saveState = buildSaveViewModel(state);
        const previewDisabledReason = buildPreviewDisabledReason(state);
        const canPublish = Boolean(state.form?.eid) && !state.isLoading && !state.isPublishing;

        return {
            formEid: state.formEid,
            title,
            statusLabel: mapPublishStatusLabel(state.form?.yayinDurumKID ?? 0),
            saveState,
            previewDisabledReason,
            actionFeedback: state.actionFeedback,
            headerActions: resolveHeaderActions({
                canRetrySave: saveState.canRetry,
                canPreview: !previewDisabledReason,
                previewDisabledReason,
                canPublish,
                isPublishing: state.isPublishing,
            }),
            canUndo: false,
            canRedo: false,
            canPreview: !previewDisabledReason,
            canPublish,
        };
    }

    private buildPageStripItems(form: FormDto | null, activePageEid: string | null): FormEditorPageStripItem[] {
        return (form?.sayfalar ?? []).map((page, index) => ({
            eid: page.eid,
            index,
            label: page.sayfaBaslik?.trim() || `Sayfa ${page.sayfaNo || index + 1}`,
            questionCount: countQuestions(page.sorular ?? []),
            isActive: page.eid === activePageEid,
        }));
    }

    private openQuestionSurface(questionEid: string, surfaceId: QuestionEditorSurfaceId): void {
        const trimmedQuestionEid = questionEid?.trim() ?? '';
        if (!trimmedQuestionEid) {
            return;
        }

        const state = this.stateSubject.value;
        const question = findQuestion(state.form, trimmedQuestionEid);
        if (!question) {
            return;
        }

        if (surfaceId !== 'validation') {
            this.invalidateValidationSurfaceLoad();
        }

        const nextPatch: Partial<FormEditorState> = {
            selectedNodeEid: trimmedQuestionEid,
            activeQuestionSurface: { questionEid: trimmedQuestionEid, surfaceId },
            activePageEid: resolvePageEidFromNode(state.form, trimmedQuestionEid) ?? state.activePageEid,
            questionDraftError: null,
            actionFeedback: null,
        };

        if (surfaceId === 'content') {
            nextPatch.editingQuestionDraft = cloneQuestion(question);
            nextPatch.isQuestionDraftDirty = false;
            nextPatch.validationSession = null;
            nextPatch.isValidationLoading = false;
            nextPatch.isValidationSaving = false;
            nextPatch.validationError = null;
        } else {
            nextPatch.editingQuestionDraft = null;
            nextPatch.isQuestionDraftDirty = false;
            nextPatch.isQuestionDraftSaving = false;
            nextPatch.validationError = null;
        }

        this.patchState(nextPatch);

        if (surfaceId === 'validation') {
            this.ensureValidationSurfaceLoaded(question);
        }
    }

    private clearActiveQuestionSurfaceState(): Pick<FormEditorState, 'activeQuestionSurface' | 'editingQuestionDraft' | 'isQuestionDraftDirty' | 'isQuestionDraftSaving' | 'questionDraftError' | 'validationSession' | 'isValidationLoading' | 'isValidationSaving' | 'validationError'> {
        return {
            activeQuestionSurface: null,
            editingQuestionDraft: null,
            isQuestionDraftDirty: false,
            isQuestionDraftSaving: false,
            questionDraftError: null,
            validationSession: null,
            isValidationLoading: false,
            isValidationSaving: false,
            validationError: null,
        };
    }

    private ensureValidationSurfaceLoaded(question: QuestionDto): void {
        const questionEid = question.eid?.trim() ?? '';
        if (!questionEid) {
            return;
        }

        const state = this.stateSubject.value;
        if (state.validationSession?.questionEid === questionEid && state.validationEditorConfig) {
            return;
        }

        const loadSessionId = this.beginValidationSurfaceLoad();
        this.patchState({
            validationEditorConfig: null,
            isValidationLoading: true,
            validationError: null,
            validationSession: null,
        });

        const soruKokEid = question.soruKokEidDto?.eid ?? questionEid;
        this.validationLoadSubscription = forkJoin({
            config: this.validationOrchestrator.loadEditorConfig().pipe(
                map((config) => ({ config, configError: false })),
                catchError(() => of({ config: null, configError: true })),
            ),
            rules: this.validationOrchestrator.loadValidationRules(soruKokEid).pipe(
                map((rules) => ({ rules, rulesError: false })),
                catchError(() => of({ rules: null, rulesError: true })),
            ),
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ({ config, rules }) => {
                    if (!this.isActiveValidationLoadSession(loadSessionId, questionEid)) {
                        return;
                    }

                    const result: ValidationSurfaceLoadResult = {
                        config: config.config,
                        configError: config.configError,
                        rules: rules.rules,
                        rulesError: rules.rulesError,
                    };

                    if (result.configError) {
                        this.patchState({
                            validationEditorConfig: null,
                            validationSession: null,
                            isValidationLoading: false,
                            validationError: 'Validasyon editoru hazirlanamadi.',
                        });
                        return;
                    }

                    if (result.rulesError) {
                        this.patchState({
                            validationEditorConfig: result.config,
                            validationSession: {
                                questionEid,
                                rules: [],
                                activeRuleEid: null,
                                isDirty: false,
                            },
                            isValidationLoading: false,
                            validationError: 'Validasyon kurallari yuklenemedi.',
                        });
                        return;
                    }

                    const normalizedRules = result.rules ?? [];
                    this.patchState({
                        validationEditorConfig: result.config,
                        validationSession: {
                            questionEid,
                            rules: normalizedRules.map<FormEditorValidationRuleDraft>((rule) => ({
                                rule,
                                state: 'existing',
                            })),
                            activeRuleEid: null,
                            isDirty: false,
                        },
                        isValidationLoading: false,
                        validationError: null,
                    });
                },
                complete: () => {
                    if (this.validationLoadSessionId === loadSessionId) {
                        this.validationLoadSubscription = null;
                    }
                },
            });
    }

    private beginValidationSurfaceLoad(): number {
        this.invalidateValidationSurfaceLoad();
        this.validationLoadSessionId += 1;
        return this.validationLoadSessionId;
    }

    private invalidateValidationSurfaceLoad(): void {
        this.validationLoadSessionId += 1;
        this.validationLoadSubscription?.unsubscribe();
        this.validationLoadSubscription = null;
    }

    private isActiveValidationLoadSession(sessionId: number, questionEid: string): boolean {
        const state = this.stateSubject.value;
        return this.validationLoadSessionId === sessionId
            && state.activeQuestionSurface?.surfaceId === 'validation'
            && state.activeQuestionSurface.questionEid === questionEid;
    }

    private patchState(partialState: Partial<FormEditorState>): void {
        const previous = this.stateSubject.value;
        const next: FormEditorState = { ...previous, ...partialState };

        if (partialState.form !== undefined && partialState.form !== previous.form) {
            next.workspaceStack = validateWorkspaceStack(next.form, next.workspaceStack);
        }

        this.stateSubject.next(next);
    }

    ngOnDestroy(): void {
        this.invalidateValidationSurfaceLoad();
        this.destroy$.next();
        this.destroy$.complete();
    }
}

