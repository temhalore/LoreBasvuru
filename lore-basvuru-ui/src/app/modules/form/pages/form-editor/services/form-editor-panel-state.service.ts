import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, combineLatest, distinctUntilChanged, map, takeUntil } from 'rxjs';
import { FormDto, QuestionDto } from '../../../models';
import { defaultTab, findTab, FormEditorPanelSide, FormEditorPanelTabId } from '../form-editor-panel.config';
import { FormEditorStoreService } from './form-editor-store.service';

interface FormEditorPanelUiState {
    left: {
        isOpen: boolean;
        activeTabId: FormEditorPanelTabId;
    };
    right: {
        isOpen: boolean;
        activeTabId: FormEditorPanelTabId;
    };
    structureTree: {
        collapsedPageEids: string[];
        collapsedQuestionEids: string[];
        pendingRevealNodeEid: string | null;
        revealRevision: number;
    };
}

const DEFAULT_STATE: FormEditorPanelUiState = {
    left: {
        isOpen: false,
        activeTabId: defaultTab('left'),
    },
    right: {
        isOpen: false,
        activeTabId: defaultTab('right'),
    },
    structureTree: {
        collapsedPageEids: [],
        collapsedQuestionEids: [],
        pendingRevealNodeEid: null,
        revealRevision: 0,
    },
};

@Injectable()
export class FormEditorPanelStateService implements OnDestroy {
    private readonly stateSubject = new BehaviorSubject<FormEditorPanelUiState>(DEFAULT_STATE);
    private readonly destroy$ = new Subject<void>();

    readonly state$ = this.stateSubject.asObservable();

    constructor(private readonly store: FormEditorStoreService) {
        // Reveal/scroll orkestrasyonu burada toplanır (eskiden shell ngOnInit'te).
        // Seçim değiştiğinde ilgili node'un atalarını açıp scroll tetiklenir.
        combineLatest([this.store.form$, this.store.selectedNodeEid$])
            .pipe(
                map(([form, selectedNodeEid]) => ({
                    form,
                    selectedNodeEid,
                    key: `${form?.eid ?? ''}:${selectedNodeEid ?? ''}`,
                })),
                distinctUntilChanged((left, right) => left.key === right.key),
                takeUntil(this.destroy$),
            )
            .subscribe(({ form, selectedNodeEid }) => this.revealNode(form, selectedNodeEid));
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    readonly leftPanelState$ = this.state$.pipe(
        map((state) => state.left),
        distinctUntilChanged((left, right) => left.isOpen === right.isOpen && left.activeTabId === right.activeTabId),
    );

    readonly rightPanelState$ = this.state$.pipe(
        map((state) => state.right),
        distinctUntilChanged((left, right) => left.isOpen === right.isOpen && left.activeTabId === right.activeTabId),
    );

    // B2: tek JSON.stringify distinct yerine alan-bazlı ayrı selector'lar.
    // collapsed dizileri immutable değiştirilir → referans eşitliği yeterli;
    // reveal bump'ı collapsed akışlarını churn etmez (revealNode yalnız
    // gerçekten değişen diziyi patch'ler).
    readonly collapsedPageEids$ = this.state$.pipe(
        map((state) => state.structureTree.collapsedPageEids),
        distinctUntilChanged(),
    );

    readonly collapsedQuestionEids$ = this.state$.pipe(
        map((state) => state.structureTree.collapsedQuestionEids),
        distinctUntilChanged(),
    );

    readonly reveal$ = this.state$.pipe(
        map((state) => ({
            nodeEid: state.structureTree.pendingRevealNodeEid,
            revision: state.structureTree.revealRevision,
        })),
        distinctUntilChanged((left, right) => left.nodeEid === right.nodeEid && left.revision === right.revision),
    );

    openPanel(side: FormEditorPanelSide, requestedTabId?: FormEditorPanelTabId | null): void {
        const state = this.stateSubject.value;
        const current = state[side];
        const nextTabId = this.normalizeTabId(side, requestedTabId ?? current.activeTabId);

        this.patchState({
            [side]: {
                isOpen: true,
                activeTabId: nextTabId,
            },
        } as Partial<FormEditorPanelUiState>);
    }

    closePanel(side: FormEditorPanelSide): void {
        const state = this.stateSubject.value;
        if (!state[side].isOpen) {
            return;
        }

        this.patchState({
            [side]: {
                ...state[side],
                isOpen: false,
            },
        } as Partial<FormEditorPanelUiState>);
    }

    setActiveTab(side: FormEditorPanelSide, tabId: FormEditorPanelTabId): void {
        const state = this.stateSubject.value;
        const nextTabId = this.normalizeTabId(side, tabId);
        if (state[side].activeTabId === nextTabId) {
            return;
        }

        this.patchState({
            [side]: {
                ...state[side],
                activeTabId: nextTabId,
            },
        } as Partial<FormEditorPanelUiState>);
    }

    togglePage(pageEid: string): void {
        this.patchStructureTreeState({
            collapsedPageEids: this.toggleEid(this.stateSubject.value.structureTree.collapsedPageEids, pageEid),
        });
    }

    toggleQuestion(questionEid: string): void {
        this.patchStructureTreeState({
            collapsedQuestionEids: this.toggleEid(this.stateSubject.value.structureTree.collapsedQuestionEids, questionEid),
        });
    }

    collapseAll(form: FormDto | null): void {
        if (!form) {
            return;
        }

        const collapsedPageEids = (form.sayfalar ?? []).map((page) => page.eid);
        const collapsedQuestionEids: string[] = [];
        for (const page of form.sayfalar ?? []) {
            this.collectCollapsibleQuestionEids(page.sorular ?? [], collapsedQuestionEids);
        }

        this.patchStructureTreeState({
            collapsedPageEids,
            collapsedQuestionEids,
        });
    }

    expandAll(): void {
        this.patchStructureTreeState({
            collapsedPageEids: [],
            collapsedQuestionEids: [],
        });
    }

    revealNode(form: FormDto | null, nodeEid: string | null): void {
        if (!form || !nodeEid?.trim()) {
            return;
        }

        const trimmedNodeEid = nodeEid.trim();
        const path = this.findRevealPath(form, trimmedNodeEid);
        if (!path) {
            return;
        }

        const structureTree = this.stateSubject.value.structureTree;
        const collapsedPages = new Set(structureTree.collapsedPageEids);
        const collapsedQuestions = new Set(structureTree.collapsedQuestionEids);

        const pagesChanged = collapsedPages.delete(path.pageEid);
        let questionsChanged = false;
        for (const questionEid of path.questionPath) {
            questionsChanged = collapsedQuestions.delete(questionEid) || questionsChanged;
        }

        // Yalnız gerçekten açılan dizileri patch'le — reveal-only bump
        // collapsed selector'larını churn etmesin.
        this.patchStructureTreeState({
            ...(pagesChanged ? { collapsedPageEids: Array.from(collapsedPages) } : {}),
            ...(questionsChanged ? { collapsedQuestionEids: Array.from(collapsedQuestions) } : {}),
            pendingRevealNodeEid: trimmedNodeEid,
            revealRevision: structureTree.revealRevision + 1,
        });
    }

    private normalizeTabId(side: FormEditorPanelSide, tabId: FormEditorPanelTabId | null | undefined): FormEditorPanelTabId {
        const resolvedTab = tabId ? findTab(tabId) : null;
        if (!resolvedTab || resolvedTab.side !== side || !resolvedTab.visible) {
            return defaultTab(side);
        }

        return resolvedTab.id;
    }

    private collectCollapsibleQuestionEids(questions: QuestionDto[], output: string[]): void {
        for (const question of questions) {
            if ((question.altSorular?.length ?? 0) > 0) {
                output.push(question.eid);
                this.collectCollapsibleQuestionEids(question.altSorular ?? [], output);
            }
        }
    }

    private findRevealPath(
        form: FormDto,
        nodeEid: string,
    ): { pageEid: string; questionPath: string[] } | null {
        for (const page of form.sayfalar ?? []) {
            if (page.eid === nodeEid) {
                return { pageEid: page.eid, questionPath: [] };
            }

            const questionPath = this.findQuestionParentPath(page.sorular ?? [], nodeEid);
            if (questionPath) {
                return { pageEid: page.eid, questionPath };
            }
        }

        return null;
    }

    private findQuestionParentPath(questions: QuestionDto[], nodeEid: string, parents: string[] = []): string[] | null {
        for (const question of questions) {
            if (question.eid === nodeEid) {
                return parents;
            }

            const nextParents = [...parents, question.eid];
            const childResult = this.findQuestionParentPath(question.altSorular ?? [], nodeEid, nextParents);
            if (childResult) {
                return childResult;
            }
        }

        return null;
    }

    private toggleEid(current: string[], eid: string): string[] {
        if (!eid.trim()) {
            return current;
        }

        const next = new Set(current);
        if (next.has(eid)) {
            next.delete(eid);
        } else {
            next.add(eid);
        }
        return Array.from(next);
    }

    private patchStructureTreeState(partial: Partial<FormEditorPanelUiState['structureTree']>): void {
        const current = this.stateSubject.value.structureTree;
        this.patchState({
            structureTree: {
                ...current,
                ...partial,
            },
        });
    }

    private patchState(partial: Partial<FormEditorPanelUiState>): void {
        this.stateSubject.next({
            ...this.stateSubject.value,
            ...partial,
        });
    }
}
