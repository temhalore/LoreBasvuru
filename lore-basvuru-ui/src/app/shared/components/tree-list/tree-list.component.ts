import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Observable } from 'rxjs';
import { TreeListService } from './tree-list.service';
import {
    TreeListConfig,
    TreeNode,
    TreeListState,
    TreeDisplayField,
    TreeAction,
    TreeCustomButton
} from './tree-list.types';

@Component({
    selector: 'app-tree-list',
    templateUrl: './tree-list.component.html',
    styleUrls: ['./tree-list.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatCardModule,
        MatTooltipModule,
        MatCheckboxModule
    ],
    providers: [TreeListService]
})
export class TreeListComponent implements OnInit, OnDestroy, OnChanges {
    @Input() config: TreeListConfig | null = null;
    @Input() data: TreeNode[] = [];

    data$: Observable<TreeNode[]>;
    loading$: Observable<boolean>;
    state$: Observable<TreeListState>;

    constructor(private _treeListService: TreeListService) {
        this.data$ = this._treeListService.filteredData$;
        this.loading$ = this._treeListService.loading$;
        this.state$ = this._treeListService.state$;
    }

    ngOnInit(): void {
        if (this.config) {
            this._treeListService.initialize(this.config);
            
            // If data is provided directly, set it
            if (this.data && this.data.length > 0) {
                this._treeListService.setData(this.data);
            }
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config'] && !changes['config'].firstChange && this.config) {
            this._treeListService.initialize(this.config);
        }
        
        if (changes['data'] && this.data) {
            this._treeListService.setData(this.data);
        }
    }

    ngOnDestroy(): void {
        this._treeListService.destroy();
    }

    // Event handlers
    onSearchChange(searchTerm: string): void {
        this._treeListService.setSearch(searchTerm);
    }

    onFilterChange(key: string, value: any): void {
        this._treeListService.setFilter(key, value);
    }

    onNodeToggle(node: TreeNode): void {
        this._treeListService.toggleNode(node);
    }

    onNodeSelect(node: TreeNode): void {
        this._treeListService.selectNode(node);
    }

    onNodeCheck(node: TreeNode, checked: boolean): void {
        // Update node checked state
        node.checked = checked;
        node.partialSelected = false;
        
        // Update children if any
        if (node.children) {
            this.updateChildrenCheckState(node.children, checked);
        }
        
        // Update parent states
        this.updateParentCheckState(node);
        
        // Call callback if provided
        if (this.config?.onNodeCheck) {
            this.config.onNodeCheck(node, checked);
        }
    }

    private updateChildrenCheckState(children: TreeNode[], checked: boolean): void {
        children.forEach(child => {
            child.checked = checked;
            child.partialSelected = false;
            if (child.children) {
                this.updateChildrenCheckState(child.children, checked);
            }
        });
    }

    private updateParentCheckState(node: TreeNode): void {
        let parent = this._treeListService.getParent(node);

        while (parent) {
            const children = parent.children || [];
            const allChecked = children.length > 0 && children.every(c => !!c.checked && !c.partialSelected);
            const noneChecked = children.every(c => !c.checked && !c.partialSelected);
            const someChecked = !noneChecked;

            parent.checked = allChecked;
            parent.partialSelected = someChecked && !allChecked;

            parent = this._treeListService.getParent(parent);
        }
    }

    isNodeChecked(node: TreeNode): boolean {
        return node.checked || false;
    }

    isNodePartiallySelected(node: TreeNode): boolean {
        return node.partialSelected || false;
    }

    onNodeAction(action: TreeAction, node: TreeNode): void {
        if (action.confirmMessage) {
            const confirmed = confirm(this.interpolateMessage(action.confirmMessage, node.data));
            if (!confirmed) return;
        }

        try {
            action.action(node);
            
            if (action.successMessage) {
                // Burada SweetAlert veya toast notification kullanılabilir
            }
        } catch (error) {
            console.error('Action error:', error);
            if (action.errorMessage) {
                console.error(this.interpolateMessage(action.errorMessage, node.data));
                // Burada SweetAlert veya toast notification kullanılabilir
            }
        }
    }

    onExpandAll(): void {
        this._treeListService.expandAll();
    }

    onCollapseAll(): void {
        this._treeListService.collapseAll();
    }

    onRefresh(): void {
        this._treeListService.refresh();
    }

    updateConfig(updates: Partial<TreeListConfig>): void {
        this._treeListService.updateConfig(updates);
    }

    // Helper methods
    isExpanded(node: TreeNode): boolean {
        return this._treeListService.isExpanded(node);
    }

    isSelected(node: TreeNode): boolean {
        return this._treeListService.isSelected(node);
    }

    hasChildren(node: TreeNode): boolean {
        return node.children && node.children.length > 0;
    }

    getFieldValue(node: TreeNode, field: TreeDisplayField): any {
        let value;
        
        // displayName için özel logic
        if (field.key === 'displayName') {
            value = node.data?.pageDto?.name || node.data?.name || 'Belirtilmemiş';
        } else {
            value = this.getNestedProperty(node.data, field.key);
        }
        
        return value;
    }

    getVisibleActions(node: TreeNode): TreeAction[] {
        if (!this.config?.actions) return [];
        
        return this.config.actions.filter(action => 
            !action.visible || action.visible(node)
        );
    }

    private getNestedProperty(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    private interpolateMessage(message: string, data: any): string {
        return message.replace(/\{(\w+)\}/g, (match, key) => {
            return this.getNestedProperty(data, key) || match;
        });
    }

    // Track by function for *ngFor performance
    trackByNode(index: number, node: TreeNode): any {
        return node.data?.eid || node.data?.id || index;
    }

    trackByField(index: number, field: TreeDisplayField): string {
        return field.key;
    }

    trackByAction(index: number, action: TreeAction): string {
        return action.label;
    }

    trackByButton(index: number, button: TreeCustomButton): string {
        return button.label + index;
    }

    isArray(value: unknown): value is unknown[] {
        return Array.isArray(value);
    }
}
