import { CommonModule } from '@angular/common';
import { CdkDragDrop, CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { animate, style, transition, trigger } from '@angular/animations';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormDto, FormPaletteItemDto, PageDto, QuestionDto } from '../../../../models';
import { mapPageDtoToSchema } from '../../../../models/form-ui.adapter';
import { PageSchema, QuestionSchema } from '../../../../models/form-schema.model';
import { FormViewPageHeaderComponent } from '../../../../shared/components/form-view-page-header/form-view-page-header.component';
import { richTextToPlainText } from '../../../../shared/utils/rich-text.util';
import { FormEditorActiveQuestionSurface, FormEditorPageDraft, FormEditorPaletteDropEvent, FormEditorGroupWorkspaceItem, FormEditorQuestionActionEvent, FormEditorQuestionReorderEvent, FormEditorValidationSession } from '../../models/form-editor-view.model';
import { KuralEditorConfigModel } from 'app/base/models/form/kuralV2';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { questionSchemaCanOpenChildWorkspace } from '../../utils/form-editor-action-resolver.util';
import { findQuestion } from '../../utils/form-tree.util';
import { FORM_EDITOR_CONFIRM } from '../../form-editor.messages';
import { QuestionEditorHostComponent } from '../question-editor-host/question-editor-host.component';

type PageTransitionDirection = 'prev' | 'next' | 'none';
type PageTransitionPhase = 'enter' | 'leave' | 'idle';

interface FormEditorCanvasPageView {
    key: string;
    page: PageDto;
    pageIndex: number;
    phase: PageTransitionPhase;
    schema: PageSchema;
}

interface FormEditorCanvasGroupWorkspaceView {
    key: string;
    containerEid: string;
    title: string;
    breadcrumbLabels: string[];
    questions: QuestionSchema[];
    stackOffset: number;
    isActive: boolean;
}

@Component({
    selector: 'app-form-editor-canvas',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, DragDropModule, MatButtonModule, MatIconModule, MatTooltipModule, FormViewPageHeaderComponent, QuestionEditorHostComponent],
    templateUrl: './form-editor-canvas.component.html',
    styleUrls: ['./form-editor-canvas.component.scss'],
    animations: [
        trigger('groupWorkspaceCardEnter', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(-8px) scale(0.97)' }),
                animate('320ms cubic-bezier(0.22, 0.61, 0.36, 1)', style({ opacity: '*', transform: '*' })),
            ]),
        ]),
    ],
})
export class FormEditorCanvasComponent implements OnChanges, OnDestroy {
    private static readonly PAGE_TRANSITION_MS = 280;

    @Input() form: FormDto | null = null;
    @Input() activePage: PageDto | null = null;
    @Input() activePageIndex = -1;
    @Input() pageCount = 0;
    @Input() selectedNodeEid: string | null = null;
    @Input() activeQuestionSurface: FormEditorActiveQuestionSurface | null = null;
    @Input() editingQuestionDraft: QuestionDto | null = null;
    @Input() pageEditDraft: FormEditorPageDraft | null = null;
    @Input() isQuestionDraftSaving = false;
    @Input() questionDraftError: string | null = null;
    @Input() validationSession: FormEditorValidationSession | null = null;
    @Input() validationEditorConfig: KuralEditorConfigModel | null = null;
    @Input() isValidationLoading = false;
    @Input() isValidationSaving = false;
    @Input() validationError: string | null = null;
    @Input() isLoading = false;
    @Input() loadError: string | null = null;
    @Input() groupWorkspaceStack: FormEditorGroupWorkspaceItem[] = [];

    @Output() readonly nodeSelect = new EventEmitter<string>();
    @Output() readonly questionAction = new EventEmitter<FormEditorQuestionActionEvent>();
    @Output() readonly questionSurfaceClose = new EventEmitter<string>();
    @Output() readonly questionDraftSave = new EventEmitter<QuestionDto>();
    @Output() readonly questionDraftDirtyChange = new EventEmitter<{ questionEid: string; isDirty: boolean }>();
    @Output() readonly validationSessionSave = new EventEmitter<FormEditorValidationSession>();
    @Output() readonly groupWorkspaceBack = new EventEmitter<void>();
    @Output() readonly prevPage = new EventEmitter<void>();
    @Output() readonly nextPage = new EventEmitter<void>();
    @Output() readonly pageEditStart = new EventEmitter<string>();
    @Output() readonly pageEditPatch = new EventEmitter<Partial<Pick<FormEditorPageDraft, 'sayfaBaslik' | 'sayfaAciklama'>>>();
    @Output() readonly pageEditCommit = new EventEmitter<void>();
    @Output() readonly pageEditCancel = new EventEmitter<string>();
    @Output() readonly questionReorder = new EventEmitter<FormEditorQuestionReorderEvent>();
    @Output() readonly paletteDrop = new EventEmitter<FormEditorPaletteDropEvent>();
    @Output() readonly questionDragStart = new EventEmitter<void>();
    @Output() readonly backgroundClick = new EventEmitter<void>();

    @ViewChild('scrollViewport') private scrollViewport?: ElementRef<HTMLElement>;

    pageTransitionDirection: PageTransitionDirection = 'none';
    activePageViews: FormEditorCanvasPageView[] = [];
    groupWorkspaceViews: FormEditorCanvasGroupWorkspaceView[] = [];

    private pageRenderSequence = 0;
    private currentPageView: FormEditorCanvasPageView | null = null;
    private transitionCleanupId: ReturnType<typeof setTimeout> | null = null;
    private selectionScrollId: ReturnType<typeof setTimeout> | null = null;
    private selectionScrollFrameId: number | null = null;
    private lastSelectionScrollKey: string | null = null;

    constructor(
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly elementRef: ElementRef<HTMLElement>,
        private readonly sweetAlert: SweetAlertService,
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        const hasPageChange = Boolean(changes['activePage'] || changes['activePageIndex']);

        if (hasPageChange) {
            this.handleActivePageChange(changes);
        }

        if (hasPageChange || changes['groupWorkspaceStack']) {
            this.syncWorkspaceViews();
        }

        if (hasPageChange || changes['selectedNodeEid'] || changes['groupWorkspaceStack']) {
            this.scheduleSelectionScroll();
        }
    }

    ngOnDestroy(): void {
        this.clearTransitionCleanup();
        this.clearSelectionScroll();
    }

    get hasGroupWorkspaceOpen(): boolean {
        return this.groupWorkspaceViews.length > 0;
    }

    get rootQuestions(): QuestionSchema[] {
        return this.currentPageView?.schema.questions ?? [];
    }

    startPageEdit(page: PageDto): void {
        this.pageEditStart.emit(page.eid);
    }

    updatePageTitle(event: Event): void {
        const title = event.target instanceof HTMLInputElement ? event.target.value : '';
        this.pageEditPatch.emit({ sayfaBaslik: title });
    }

    updatePageDescription(event: Event): void {
        const description = event.target instanceof HTMLTextAreaElement ? event.target.value : '';
        this.pageEditPatch.emit({ sayfaAciklama: description });
    }

    savePageEdit(): void {
        this.pageEditCommit.emit();
    }

    async cancelPageEdit(page: PageDto): Promise<void> {
        if (this.hasPageDraftChanges(page)
            && !(await this.sweetAlert.confirm(FORM_EDITOR_CONFIRM.discardTitle, FORM_EDITOR_CONFIRM.discardText))) {
            return;
        }

        this.pageEditCancel.emit(page.eid);
    }

    isPageEditing(pageEid: string): boolean {
        return this.pageEditDraft?.eid === pageEid;
    }

    private hasPageDraftChanges(page: PageDto): boolean {
        return this.pageEditDraft?.eid === page.eid && this.pageEditDraft.isDirty;
    }

    private handleActivePageChange(changes: SimpleChanges): void {
        if (!this.activePage) {
            this.clearTransitionCleanup();
            this.clearSelectionScroll();
            this.pageTransitionDirection = 'none';
            this.activePageViews = [];
            this.currentPageView = null;
            this.lastSelectionScrollKey = null;
            this.groupWorkspaceViews = [];
            return;
        }

        const currentPageView = this.currentPageView;
        const isSamePage = currentPageView?.page.eid === this.activePage.eid;
        if (isSamePage && !changes['activePage']) {
            return;
        }

        const previousIndex = currentPageView?.pageIndex ?? -1;
        const nextDirection: PageTransitionDirection = previousIndex < 0 || this.activePageIndex === previousIndex
            ? 'none'
            : this.activePageIndex > previousIndex
                ? 'next'
                : 'prev';

        if (isSamePage || nextDirection === 'none') {
            this.clearTransitionCleanup();
            this.pageTransitionDirection = 'none';
            this.currentPageView = this.createPageView(this.activePage, 'idle');
            this.activePageViews = [this.currentPageView];
            this.lastSelectionScrollKey = null;
            return;
        }

        this.clearTransitionCleanup();
        this.pageTransitionDirection = nextDirection;
        const leavingPageView = currentPageView ? { ...currentPageView, phase: 'leave' as const } : null;
        const enteringPageView = this.createPageView(this.activePage, 'enter');
        this.currentPageView = enteringPageView;
        this.activePageViews = leavingPageView ? [leavingPageView, enteringPageView] : [enteringPageView];

        this.transitionCleanupId = setTimeout(() => {
            this.pageTransitionDirection = 'none';
            this.currentPageView = { ...enteringPageView, phase: 'idle' };
            this.activePageViews = [this.currentPageView];
            this.transitionCleanupId = null;
            this.scheduleSelectionScroll();
            this.changeDetectorRef.markForCheck();
        }, FormEditorCanvasComponent.PAGE_TRANSITION_MS);
    }

    private syncWorkspaceViews(): void {
        const rootPageSchema = this.currentPageView?.schema ?? null;
        if (!this.activePage || !rootPageSchema) {
            this.groupWorkspaceViews = [];
            return;
        }

        const resolvedGroups: { eid: string; title: string; questions: QuestionSchema[] }[] = [];

        for (const item of this.groupWorkspaceStack) {
            const path = this.findQuestionSchemaPath(rootPageSchema.questions, item.containerEid);
            if (!path.length) {
                break;
            }

            const groupQuestion = path[path.length - 1];
            if (!questionSchemaCanOpenChildWorkspace(groupQuestion)) {
                break;
            }

            resolvedGroups.push({
                eid: item.containerEid,
                title: this.questionSchemaLabel(groupQuestion, 'Adsiz grup'),
                questions: groupQuestion.children ?? [],
            });
        }

        const total = resolvedGroups.length;
        const breadcrumbTrail: string[] = [];
        this.groupWorkspaceViews = resolvedGroups.map((group, index) => {
            breadcrumbTrail.push(group.title);
            return {
                key: `${group.eid}-${index}`,
                containerEid: group.eid,
                title: group.title,
                breadcrumbLabels: [this.pageLabel(this.activePage!), ...breadcrumbTrail],
                questions: group.questions,
                stackOffset: total - index - 1,
                isActive: index === total - 1,
            };
        });
    }

    private createPageView(page: PageDto, phase: PageTransitionPhase): FormEditorCanvasPageView {
        this.pageRenderSequence += 1;
        return {
            key: `${page.eid}-${this.pageRenderSequence}`,
            page,
            pageIndex: this.activePageIndex,
            phase,
            schema: mapPageDtoToSchema(page),
        };
    }

    private clearTransitionCleanup(): void {
        if (!this.transitionCleanupId) {
            return;
        }

        clearTimeout(this.transitionCleanupId);
        this.transitionCleanupId = null;
    }

    private scheduleSelectionScroll(): void {
        const visibleNodeEid = this.resolveVisibleNodeEid(this.selectedNodeEid);
        const scrollScopeKey = this.resolveSelectionScrollScopeKey();
        if (!visibleNodeEid || !scrollScopeKey || !this.selectedNodeEid) {
            this.clearSelectionScroll();
            this.lastSelectionScrollKey = null;
            return;
        }

        const scrollKey = `${scrollScopeKey}:${this.selectedNodeEid}`;
        if (this.lastSelectionScrollKey === scrollKey) {
            return;
        }

        this.clearSelectionScroll();
        const delayMs = this.pageTransitionDirection === 'none' ? 0 : FormEditorCanvasComponent.PAGE_TRANSITION_MS;
        this.selectionScrollId = setTimeout(() => {
            this.selectionScrollId = null;
            this.selectionScrollFrameId = this.requestScrollFrame(() => {
                this.selectionScrollFrameId = null;
                this.scrollNodeIntoView(visibleNodeEid, scrollKey);
            });
        }, delayMs);
    }

    private resolveVisibleNodeEid(nodeEid: string | null): string | null {
        if (!nodeEid || nodeEid === this.form?.eid) {
            return null;
        }

        if (!this.hasGroupWorkspaceOpen && nodeEid === this.activePage?.eid) {
            return nodeEid;
        }

        const visibleQuestions = this.hasGroupWorkspaceOpen
            ? this.groupWorkspaceViews[this.groupWorkspaceViews.length - 1]?.questions ?? []
            : this.rootQuestions;

        return visibleQuestions.some((question) => question.eid === nodeEid) ? nodeEid : null;
    }

    private resolveSelectionScrollScopeKey(): string | null {
        if (!this.activePage) {
            return null;
        }

        const workspacePath = this.groupWorkspaceStack.map((item) => item.containerEid).join('>');
        return `${this.activePage.eid}:${workspacePath || 'root'}`;
    }

    private scrollNodeIntoView(nodeEid: string, scrollKey: string): void {
        const target = this.findEditorNodeElement(nodeEid);
        const viewport = this.scrollViewport?.nativeElement;
        if (!target || !viewport) {
            return;
        }

        const viewportRect = viewport.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const nextScrollTop = viewport.scrollTop
            + targetRect.top
            - viewportRect.top
            - ((viewportRect.height - targetRect.height) / 2);

        viewport.scrollTo({
            top: Math.max(0, nextScrollTop),
            behavior: this.getScrollBehavior(),
        });
        this.lastSelectionScrollKey = scrollKey;
    }

    private findEditorNodeElement(nodeEid: string): HTMLElement | null {
        const nodes = Array.from(
            this.elementRef.nativeElement.querySelectorAll<HTMLElement>('[data-editor-node-eid]'),
        );
        return nodes.find((node) => node.dataset['editorNodeEid'] === nodeEid) ?? null;
    }

    private getScrollBehavior(): ScrollBehavior {
        if (typeof window === 'undefined' || !window.matchMedia) {
            return 'auto';
        }

        return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    }

    private requestScrollFrame(callback: () => void): number | null {
        if (typeof window === 'undefined' || !window.requestAnimationFrame) {
            callback();
            return null;
        }

        return window.requestAnimationFrame(callback);
    }

    private clearSelectionScroll(): void {
        if (this.selectionScrollId) {
            clearTimeout(this.selectionScrollId);
            this.selectionScrollId = null;
        }

        if (this.selectionScrollFrameId !== null && typeof window !== 'undefined' && window.cancelAnimationFrame) {
            window.cancelAnimationFrame(this.selectionScrollFrameId);
            this.selectionScrollFrameId = null;
        }
    }

    onSurfaceClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (target.closest('.editor-canvas__page-window-card, .editor-canvas__group-window-card, app-question-editor-host')) {
            return;
        }

        this.backgroundClick.emit();
    }

    selectNode(nodeEid: string): void {
        this.nodeSelect.emit(nodeEid);
    }

    onQuestionAction(event: FormEditorQuestionActionEvent): void {
        this.questionAction.emit(event);
    }

    closeQuestionSurface(questionEid: string): void {
        this.questionSurfaceClose.emit(questionEid);
    }

    resolveQuestion(questionEid: string): QuestionDto | null {
        return findQuestion(this.form, questionEid);
    }

    saveQuestionDraft(questionDraft: QuestionDto): void {
        this.questionDraftSave.emit(questionDraft);
    }

    onGroupWorkspaceBack(event: MouseEvent): void {
        event.stopPropagation();
        this.groupWorkspaceBack.emit();
    }

    onQuestionDrop(event: CdkDragDrop<unknown[]>, containerEid: string): void {
        if (event.previousContainer !== event.container) {
            const paletteItem = event.item.data as FormPaletteItemDto;
            this.paletteDrop.emit({ item: paletteItem, containerEid, index: event.currentIndex });
        } else {
            if (event.previousIndex === event.currentIndex) {
                return;
            }
            const question = event.item.data as { eid: string };
            this.questionReorder.emit({
                containerEid,
                questionEid: question.eid,
                previousIndex: event.previousIndex,
                currentIndex: event.currentIndex,
            });
        }
    }

    preMeasureDragItemHeight(event: MouseEvent): void {
        const target = event.currentTarget as HTMLElement;
        const height = Math.ceil(target.getBoundingClientRect().height);
        this.elementRef.nativeElement.style.setProperty('--dragged-question-height', `${height}px`);
    }

    onQuestionDragStarted(_event: CdkDragStart): void {
        this.questionDragStart.emit();
    }

    containerDropListId(containerEid: string): string {
        return containerEid ? `qc-list-${containerEid}` : '';
    }

    isPageQuestionsDropDisabled(pageView: FormEditorCanvasPageView): boolean {
        return this.hasGroupWorkspaceOpen || pageView.phase === 'leave';
    }

    trackByEid(_: number, item: { eid: string }): string {
        return item.eid;
    }

    trackByPageView(_: number, item: FormEditorCanvasPageView): string {
        return item.key;
    }

    trackByGroupWorkspace(_: number, item: FormEditorCanvasGroupWorkspaceView): string {
        return item.key;
    }

    private findQuestionSchemaPath(
        questions: QuestionSchema[],
        questionEid: string,
        path: QuestionSchema[] = [],
    ): QuestionSchema[] {
        for (const question of questions) {
            const nextPath = [...path, question];
            if (question.eid === questionEid) {
                return nextPath;
            }

            const childPath = this.findQuestionSchemaPath(question.children ?? [], questionEid, nextPath);
            if (childPath.length) {
                return childPath;
            }
        }

        return [];
    }

    private questionSchemaLabel(question: QuestionSchema, fallback: string): string {
        return richTextToPlainText(question.label).trim() || fallback;
    }

    private pageLabel(page: PageDto): string {
        return page.sayfaBaslik?.trim() || `Sayfa ${page.sayfaNo ?? this.activePageIndex + 1}`;
    }
}
