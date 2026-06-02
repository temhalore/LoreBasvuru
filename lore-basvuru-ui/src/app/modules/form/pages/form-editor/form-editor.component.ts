import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, map, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MetaService } from 'app/core/services/meta.service';
import {
    FormEditorPanelSide,
    FormEditorPanelTabId,
    getLauncherTabs,
    getTabs,
} from 'app/modules/form/pages/form-editor/form-editor-panel.config';
import {
    DiagnosticDto,
    FormDto,
    FormPaletteItemDto,
    PageDto,
    QuestionDto,
} from '../../models';
import { FormEditorCanvasComponent } from './components/form-editor-canvas/form-editor-canvas.component';
import { FormEditorDiagnosticsComponent } from './components/form-editor-diagnostics/form-editor-diagnostics.component';
import { FormEditorHeaderComponent } from './components/form-editor-header/form-editor-header.component';
import { FormEditorPaletteComponent } from './components/form-editor-palette/form-editor-palette.component';
import { FormEditorPanelComponent } from './components/form-editor-panel/form-editor-panel.component';
import { FormEditorStructureTreeComponent } from './components/form-editor-structure-tree/form-editor-structure-tree.component';
import { QuestionEditorStylesHostComponent } from './components/question-editor-styles-host/question-editor-styles-host.component';
import {
    FormEditorActiveQuestionSurface,
    FormEditorHeaderActionEvent,
    FormEditorGroupWorkspaceItem,
    FormEditorPageDraft,
    FormEditorPaletteDropEvent,
    FormEditorQuestionActionEvent,
    FormEditorQuestionReorderEvent,
    FormEditorValidationSession,
} from './models/form-editor-view.model';
import { FormEditorHeaderActionId, FormEditorResolvedLauncherAction } from './models/form-editor-action.model';
import { FormEditorPanelStateService } from './services/form-editor-panel-state.service';
import { FormEditorPersistenceCoordinatorService } from './services/form-editor-persistence-coordinator.service';
import { FormEditorStoreService } from './services/form-editor-store.service';
import { FormEditorValidationOrchestratorService } from './services/form-editor-validation.orchestrator';
import { resolveLauncherActions } from './utils/form-editor-action-resolver.util';

@Component({
    selector: 'app-admin-form-editor',
    standalone: true,
    templateUrl: './form-editor.component.html',
    styleUrls: ['./form-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        MatIconModule,
        FormEditorHeaderComponent,
        FormEditorCanvasComponent,
        FormEditorPanelComponent,
        FormEditorStructureTreeComponent,
        FormEditorPaletteComponent,
        FormEditorDiagnosticsComponent,
        QuestionEditorStylesHostComponent,
    ],
    providers: [
        FormEditorPersistenceCoordinatorService,
        FormEditorValidationOrchestratorService,
        FormEditorStoreService,
        FormEditorPanelStateService,
    ],
})
export class FormEditorComponent implements OnInit, OnDestroy {
    readonly leftPanelTabs = getTabs('left');
    readonly rightPanelTabs = getTabs('right');
    readonly launcherActions = resolveLauncherActions(getLauncherTabs());
    readonly launcherSides: FormEditorPanelSide[] = ['left', 'right'];

    readonly shellVm$ = combineLatest({
        viewModel: this.formEditorStore.viewModel$,
        form: this.formEditorStore.form$,
        diagnostics: this.formEditorStore.diagnostics$,
        paletteItems: this.formEditorStore.paletteItems$,
        isPaletteLoading: this.formEditorStore.isPaletteLoading$,
        paletteError: this.formEditorStore.paletteError$,
        selectedNodeEid: this.formEditorStore.selectedNodeEid$,
        activeQuestionSurface: this.formEditorStore.activeQuestionSurface$,
        editingQuestionEid: this.formEditorStore.editingQuestionEid$,
        editingQuestionDraft: this.formEditorStore.editingQuestionDraft$,
        pageEditDraft: this.formEditorStore.pageEditDraft$,
        isQuestionDraftSaving: this.formEditorStore.isQuestionDraftSaving$,
        questionDraftError: this.formEditorStore.questionDraftError$,
        validationSession: this.formEditorStore.validationSession$,
        validationEditorConfig: this.formEditorStore.validationEditorConfig$,
        isValidationLoading: this.formEditorStore.isValidationLoading$,
        isValidationSaving: this.formEditorStore.isValidationSaving$,
        validationError: this.formEditorStore.validationError$,
        activePage: this.formEditorStore.activePage$,
        activePageIndex: this.formEditorStore.activePageIndex$,
        pageCount: this.formEditorStore.pageCount$,
        isLoading: this.formEditorStore.isLoading$,
        loadError: this.formEditorStore.loadError$,
        workspaceStack: this.formEditorStore.workspaceStack$,
        isGroupWorkspaceOpen: this.formEditorStore.isGroupWorkspaceOpen$,
        activeContainerEid: this.formEditorStore.activeContainerEid$,
        leftPanelState: this.formEditorPanelState.leftPanelState$,
        rightPanelState: this.formEditorPanelState.rightPanelState$,
        collapsedPageEids: this.formEditorPanelState.collapsedPageEids$,
        collapsedQuestionEids: this.formEditorPanelState.collapsedQuestionEids$,
        reveal: this.formEditorPanelState.reveal$,
    }).pipe(
        map((state) => ({
            viewModel: state.viewModel,
            form: state.form as FormDto | null,
            diagnostics: state.diagnostics as DiagnosticDto[],
            paletteItems: state.paletteItems as FormPaletteItemDto[],
            isPaletteLoading: state.isPaletteLoading,
            paletteError: state.paletteError,
            selectedNodeEid: state.selectedNodeEid,
            activeQuestionSurface: state.activeQuestionSurface as FormEditorActiveQuestionSurface | null,
            editingQuestionEid: state.editingQuestionEid,
            editingQuestionDraft: state.editingQuestionDraft as QuestionDto | null,
            pageEditDraft: state.pageEditDraft as FormEditorPageDraft | null,
            isQuestionDraftSaving: state.isQuestionDraftSaving,
            questionDraftError: state.questionDraftError,
            validationSession: state.validationSession as FormEditorValidationSession | null,
            validationEditorConfig: state.validationEditorConfig,
            isValidationLoading: state.isValidationLoading,
            isValidationSaving: state.isValidationSaving,
            validationError: state.validationError,
            activePage: state.activePage as PageDto | null,
            activePageIndex: state.activePageIndex,
            pageCount: state.pageCount,
            isLoading: state.isLoading,
            loadError: state.loadError,
            workspaceStack: state.workspaceStack as FormEditorGroupWorkspaceItem[],
            isGroupWorkspaceOpen: state.isGroupWorkspaceOpen,
            activeContainerEid: state.activeContainerEid,
            leftPanelState: state.leftPanelState,
            rightPanelState: state.rightPanelState,
            collapsedPageEids: state.collapsedPageEids,
            collapsedQuestionEids: state.collapsedQuestionEids,
            revealNodeEid: state.reveal.nodeEid,
            revealRevision: state.reveal.revision,
            paletteConnectedTo: state.activeContainerEid ? [`qc-list-${state.activeContainerEid}`] : [],
            shellClassMap: {
                'form-editor-shell--left-closed': !state.leftPanelState.isOpen,
                'form-editor-shell--right-closed': !state.rightPanelState.isOpen,
            },
        })),
    );

    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly metaService: MetaService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly formEditorStore: FormEditorStoreService,
        private readonly formEditorPanelState: FormEditorPanelStateService,
    ) {
        this.metaService.setPageTitle('Form Editörü');
    }

    ngOnInit(): void {
        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
            const formEid = params.get('eid') ?? '';
            this.formEditorStore.initialize(formEid);
        });
    }

    goBack(): void {
        void this.router.navigate(['/form/list']);
    }

    updateTitle(title: string): void {
        this.formEditorStore.updateTitle(title);
    }

    selectNode(nodeEid: string): void {
        this.formEditorStore.selectNode(nodeEid);
    }

    startQuestionEdit(questionEid: string): void {
        this.formEditorStore.startQuestionEdit(questionEid);
    }

    onQuestionAction(event: FormEditorQuestionActionEvent): void {
        this.formEditorStore.handleQuestionAction(event);
    }

    onHeaderAction(event: FormEditorHeaderActionEvent): void {
        const handlers: Record<FormEditorHeaderActionId, () => void> = {
            'retry-save': () => {
                this.retrySave();
            },
            preview: () => {
                void this.markPreviewIntent();
            },
            publish: () => {
                void this.markPublishIntent();
            },
        };

        handlers[event.actionId]();
    }

    stopQuestionSurface(questionEid: string): void {
        this.formEditorStore.closeQuestionSurface(questionEid);
    }

    stopQuestionEdit(questionEid: string): void {
        this.formEditorStore.stopQuestionEdit(questionEid);
    }

    saveQuestionDraft(questionDraft: QuestionDto): void {
        this.formEditorStore.saveQuestionDraft(questionDraft);
    }

    setQuestionDraftDirty(event: { questionEid: string; isDirty: boolean }): void {
        this.formEditorStore.setQuestionDraftDirty(event.questionEid, event.isDirty);
    }

    saveValidationSession(session: FormEditorValidationSession): void {
        void this.formEditorStore.saveValidationSession(session);
    }

    onPrevPage(activePage: PageDto | null, form: FormDto | null, isWorkspaceOpen: boolean): void {
        if (isWorkspaceOpen || !form || !activePage) {
            return;
        }

        const pages = form.sayfalar ?? [];
        const index = pages.findIndex((page) => page.eid === activePage.eid);
        if (index > 0) {
            this.formEditorStore.setActivePage(pages[index - 1].eid);
        }
    }

    onNextPage(activePage: PageDto | null, form: FormDto | null, isWorkspaceOpen: boolean): void {
        if (isWorkspaceOpen || !form || !activePage) {
            return;
        }

        const pages = form.sayfalar ?? [];
        const index = pages.findIndex((page) => page.eid === activePage.eid);
        if (index >= 0 && index < pages.length - 1) {
            this.formEditorStore.setActivePage(pages[index + 1].eid);
        }
    }

    startPageEdit(pageEid: string): void {
        this.formEditorStore.beginPageEdit(pageEid);
    }

    patchPageEditDraft(patch: Partial<Pick<FormEditorPageDraft, 'sayfaBaslik' | 'sayfaAciklama'>>): void {
        this.formEditorStore.patchPageEditDraft(patch);
    }

    commitPageEdit(): void {
        this.formEditorStore.commitPageEdit();
    }

    cancelPageEdit(pageEid: string): void {
        this.formEditorStore.cancelPageEdit(pageEid);
    }

    selectPaletteItem(item: FormPaletteItemDto): void {
        this.formEditorStore.selectPaletteItem(item);
    }

    onQuestionReorder(event: FormEditorQuestionReorderEvent): void {
        this.formEditorStore.reorderQuestions(event);
    }

    onPaletteDrop(event: FormEditorPaletteDropEvent): void {
        this.formEditorStore.createQuestionAtPosition(event.item, event.index + 1, event.containerEid);
    }

    onCanvasBackgroundClick(isWorkspaceOpen: boolean): void {
        if (isWorkspaceOpen) {
            return;
        }

        this.formEditorStore.clearSelection();
    }

    onQuestionDragStart(): void {
        this.formEditorStore.autoSaveBeforeDrag();
    }

    onCanvasNodeSelect(nodeEid: string): void {
        this.selectNode(nodeEid);
    }

    onStructureNodeSelect(nodeEid: string): void {
        this.selectNode(nodeEid);
    }

    onStructurePageToggle(pageEid: string): void {
        this.formEditorPanelState.togglePage(pageEid);
    }

    onStructureQuestionToggle(questionEid: string): void {
        this.formEditorPanelState.toggleQuestion(questionEid);
    }

    collapseStructureTree(form: FormDto | null): void {
        this.formEditorPanelState.collapseAll(form);
    }

    expandStructureTree(): void {
        this.formEditorPanelState.expandAll();
    }

    onGroupWorkspaceOpen(containerEid: string): void {
        this.formEditorStore.openGroupWorkspace(containerEid);
    }

    onGroupWorkspaceBack(): void {
        this.formEditorStore.popGroupWorkspace();
    }

    openPanelLauncher(launcher: FormEditorResolvedLauncherAction): void {
        if (launcher.disabled) {
            return;
        }

        this.formEditorPanelState.openPanel(launcher.panelSide, launcher.panelTabId);
    }

    closePanel(side: FormEditorPanelSide): void {
        this.formEditorPanelState.closePanel(side);
    }

    onPanelTabChange(side: FormEditorPanelSide, tabId: FormEditorPanelTabId): void {
        this.formEditorPanelState.setActiveTab(side, tabId);
    }

    launchersForSide(side: FormEditorPanelSide): FormEditorResolvedLauncherAction[] {
        return this.launcherActions.filter((launcher) => launcher.panelSide === side);
    }

    trackByLauncher(_: number, launcher: FormEditorResolvedLauncherAction): string {
        return launcher.id;
    }

    trackByPanelSide(_: number, side: FormEditorPanelSide): FormEditorPanelSide {
        return side;
    }

    async markPreviewIntent(): Promise<void> {
        const formEid = this.route.snapshot.paramMap.get('eid') ?? '';
        if (!formEid) {
            return;
        }

        const isReady = await this.formEditorStore.flushDocumentSave();
        if (!isReady) {
            this.formEditorStore.notifyPreviewBlocked();
            return;
        }

        void this.router.navigate(['/form/preview', formEid]);
    }

    retrySave(): void {
        this.formEditorStore.retrySave();
    }

    markPublishIntent(): void {
        this.formEditorStore.publish();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
