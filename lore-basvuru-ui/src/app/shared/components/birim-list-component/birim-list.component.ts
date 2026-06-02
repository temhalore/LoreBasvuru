// TODO: Hiçbir yerde kullanılmıyor. Kaldırılacak!

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { BirimService } from './birim.service';
import { UnitModel } from '../../../base/models/mobile-permission/role-filter/unit.model';
import { TreeListComponent } from '../tree-list/tree-list.component';
import { TreeListConfig, TreeNode } from '../tree-list/tree-list.types';
import { KodModel } from 'app/base/models/common/kod.model';
import { CodeModel } from 'app/base/models/definition-operations/code.model';

@Component({
    selector: 'app-birim-list',
    standalone: true,
    imports: [
        CommonModule,
        MatCheckboxModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        TreeListComponent
    ],
    templateUrl: './birim-list.component.html',
    styleUrl: './birim-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BirimListComponent implements OnInit, OnChanges {
    @Input() birimTipKodId: number | null = null;
    @Input() preselectedRefIds: number[] = [];

    /** Seçili tüm birimleri (checked olan node'lar) dışarı verir. */
    @Output() selectionChange = new EventEmitter<UnitModel[]>();

    isLoading = false;
    treeNodes: TreeNode[] = [];

    isAllChecked = false;
    isAllIndeterminate = false;
    selectedCount = 0;

    private suppressNextEmit = true;
    private readonly unitsCache = new Map<number, UnitModel[]>();
    private loadRequestId = 0;

    readonly treeConfig: TreeListConfig = {
        title: 'Birimler',
        displayFields: [
            { key: 'ad', label: 'Birim', type: 'text' }
        ],
        searchable: false,
        expandable: true,
        selectable: false,
        checkboxes: true,
        onNodeCheck: () => {
            this.updateSelectionState();
        }
    };

    private readonly destroyRef = inject(DestroyRef);

    constructor(
        private readonly birimService: BirimService,
        private readonly cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.loadTree();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['birimTipKodId']) {
            this.loadTree();
            return;
        }

        if (changes['preselectedRefIds'] && !changes['preselectedRefIds'].firstChange) {
            this.applyPreselection();
            this.updateSelectionState(false);
        }
    }

    onToggleAll(checked: boolean): void {
        this.setAllChecked(checked);
        this.updateSelectionState(true);
    }

    clearSelection(): void {
        this.setAllChecked(false);
        this.updateSelectionState(true);
    }

    getSelectedUnits(): UnitModel[] {
        const selected: UnitModel[] = [];
        this.collectSelectedUnits(this.treeNodes, selected);
        return selected;
    }

    private loadTree(): void {
        const typeId = this.birimTipKodId ?? null;

        if (typeId === null) {
            this.treeNodes = [];
            this.updateSelectionState();
            this.isLoading = false;
            this.cdr.markForCheck();
            return;
        }

        const cachedUnits = this.unitsCache.get(typeId);
        if (cachedUnits) {
            this.treeNodes = this.mapUnitsToTreeNodes(cachedUnits);
            this.applyPreselection();
            this.updateSelectionState();
            this.isLoading = false;
            this.cdr.markForCheck();
            return;
        }

        this.isLoading = true;
        const requestId = ++this.loadRequestId;
        const birimTipKodDto = { id: typeId } as KodModel;
        const request = new UnitModel();
        request.birimTipKodDto = birimTipKodDto;

        this.birimService
            .getBirimTreeList(request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (units) => {
                    if (requestId !== this.loadRequestId) {
                        return;
                    }

                    const resolvedUnits = units ?? [];
                    this.unitsCache.set(typeId, resolvedUnits);
                    this.treeNodes = this.mapUnitsToTreeNodes(resolvedUnits);
                    this.applyPreselection();
                    this.updateSelectionState();
                    this.isLoading = false;
                    this.cdr.markForCheck();
                },
                error: () => {
                    if (requestId !== this.loadRequestId) {
                        return;
                    }

                    this.treeNodes = [];
                    this.updateSelectionState();
                    this.isLoading = false;
                    this.cdr.markForCheck();
                }
            });
    }

    private mapUnitsToTreeNodes(units: UnitModel[]): TreeNode[] {
        if (!Array.isArray(units)) {
            return [];
        }

        return units.map((unit) => this.mapUnitToNode(unit));
    }

    private mapUnitToNode(unit: UnitModel): TreeNode {
        const children = (unit?.altBirimlerDto ?? []).map((child) => this.mapUnitToNode(child));

        return {
            data: unit,
            expanded: true,
            checked: false,
            partialSelected: false,
            children
        };
    }

    private applyPreselection(): void {
        const selectedSet = new Set<number>(this.preselectedRefIds ?? []);
        if (selectedSet.size === 0) {
            return;
        }

        for (const node of this.treeNodes) {
            this.applyPreselectionToNode(node, selectedSet);
        }

        // Preselection sonrası parent partial/checked durumlarını hesapla
        for (const node of this.treeNodes) {
            this.recalculateFromChildren(node);
        }
    }

    private applyPreselectionToNode(node: TreeNode, selectedSet: Set<number>): void {
        const unit = node.data as UnitModel;
        const isSelected = typeof unit?.refId === 'number' && selectedSet.has(unit.refId);

        if (isSelected) {
            this.setSubtreeChecked(node, true);
            return;
        }

        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                this.applyPreselectionToNode(child, selectedSet);
            }
        }
    }

    private setAllChecked(checked: boolean): void {
        for (const node of this.treeNodes) {
            this.setSubtreeChecked(node, checked);
        }
    }

    private setSubtreeChecked(node: TreeNode, checked: boolean): void {
        node.checked = checked;
        node.partialSelected = false;

        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                this.setSubtreeChecked(child, checked);
            }
        }
    }

    private recalculateFromChildren(node: TreeNode): { anySelected: boolean; allSelected: boolean } {
        const children = node.children ?? [];
        if (children.length === 0) {
            return { anySelected: !!node.checked, allSelected: !!node.checked };
        }

        const childStates = children.map((c) => this.recalculateFromChildren(c));
        const anySelected = childStates.some((s) => s.anySelected);
        const allSelected = childStates.every((s) => s.allSelected);

        node.checked = allSelected;
        node.partialSelected = anySelected && !allSelected;

        return { anySelected: node.checked || node.partialSelected, allSelected: node.checked };
    }

    private updateSelectionState(emit: boolean = true): void {
        const total = this.countNodes(this.treeNodes);
        const selected = this.countCheckedNodes(this.treeNodes);

        this.selectedCount = selected;
        this.isAllChecked = total > 0 && selected === total;
        this.isAllIndeterminate = selected > 0 && selected < total;

        if (this.suppressNextEmit) {
            this.suppressNextEmit = false;
            return;
        }

        if (emit) {
            this.selectionChange.emit(this.getSelectedUnits());
        }
    }

    private countNodes(nodes: TreeNode[]): number {
        let count = 0;
        for (const node of nodes) {
            count += 1;
            if (node.children && node.children.length > 0) {
                count += this.countNodes(node.children);
            }
        }
        return count;
    }

    private countCheckedNodes(nodes: TreeNode[]): number {
        let count = 0;
        for (const node of nodes) {
            if (node.checked) {
                count += 1;
            }
            if (node.children && node.children.length > 0) {
                count += this.countCheckedNodes(node.children);
            }
        }
        return count;
    }

    private collectSelectedUnits(nodes: TreeNode[], selected: UnitModel[]): void {
        for (const node of nodes) {
            if (node.checked) {
                selected.push(node.data as UnitModel);
            }
            if (node.children && node.children.length > 0) {
                this.collectSelectedUnits(node.children, selected);
            }
        }
    }
}
