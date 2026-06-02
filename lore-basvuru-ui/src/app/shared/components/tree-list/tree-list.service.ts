import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpService } from '../../../base/services/http.service';
import {
    TreeListConfig,
    TreeListResponse,
    TreeListState,
    TreeNode
} from './tree-list.types';

@Injectable()
export class TreeListService {
    private _httpClient: HttpClient;
    private _httpService: HttpService;

    private _state = new BehaviorSubject<TreeListState>({
        selectedNodes: [],
        expandedNodes: new Set(),
        search: '',
        filters: {}
    });

    private _config = new BehaviorSubject<TreeListConfig | null>(null);
    private _data = new BehaviorSubject<TreeNode[]>([]);
    private _loading = new BehaviorSubject<boolean>(false);
    private _filteredData = new BehaviorSubject<TreeNode[]>([]);

    private _parentMap = new WeakMap<TreeNode, TreeNode | null>();

    constructor() {
        this._httpClient = inject(HttpClient);
        this._httpService = inject(HttpService);
    }

    // Getters
    get state$(): Observable<TreeListState> {
        return this._state.asObservable();
    }

    get config$(): Observable<TreeListConfig | null> {
        return this._config.asObservable();
    }

    get data$(): Observable<TreeNode[]> {
        return this._data.asObservable();
    }

    get filteredData$(): Observable<TreeNode[]> {
        return this._filteredData.asObservable();
    }

    get loading$(): Observable<boolean> {
        return this._loading.asObservable();
    }

    get state(): TreeListState {
        return this._state.value;
    }

    get config(): TreeListConfig | null {
        return this._config.value;
    }

    /**
     * Initialize the tree list with configuration
     */
    initialize(config: TreeListConfig): void {
        this._config.next(config);
        this.loadData();
    }

    /**
     * Set data directly (for external data sources)
     */
    setData(data: TreeNode[]): void {
        this.buildParentMap(data);
        this._data.next(data);
        this.applyFilters();
    }

    /**
     * Update configuration and reload data
     */
    updateConfig(updates: Partial<TreeListConfig>): void {
        const currentConfig = this._config.value;
        if (currentConfig) {
            const newConfig = { ...currentConfig, ...updates };
            this._config.next(newConfig);
            this.loadData();
        }
    }

    /**
     * Load data from API
     */
    loadData(): void {
        const config = this._config.value;
        
        if (!config) {
            console.warn('🌳 TreeListService: No config provided');
            this._data.next([]);
            this._filteredData.next([]);
            return;
        }

        // If no apiUrl, just use external data
        if (!config.apiUrl) {
            this.applyFilters();
            return;
        }

        this._loading.next(true);

        this.loadFromApi(config.apiUrl, config.apiParams).subscribe({
            next: (response) => {
                this.buildParentMap(response.data);
                this._data.next(response.data);
                this.applyFilters();
                this._loading.next(false);
            },
            error: (error) => {
                console.error('🌳 TreeListService: Error loading data:', error);
                this._data.next([]);
                this._filteredData.next([]);
                this._loading.next(false);
            }
        });
    }

    /**
     * Load data from API
     */
    private loadFromApi(apiUrl: string, apiParams?: any): Observable<TreeListResponse> {
        
        return this._httpService.Post(apiUrl, apiParams || {})
            .pipe(
                map(response => {
                    // HttpService ServiceResponseModel'den data'yı çıkar
                    const actualData = response.data || response;
                    
                    // API'den gelen veri RoleWidgetModel içinde widgetTreeListDto olarak gelir
                    let treeData = [];
                    if (actualData && actualData.widgetTreeListDto) {
                        treeData = this.convertApiDataToTreeNodes(actualData.widgetTreeListDto);
                    } else if (Array.isArray(actualData)) {
                        treeData = this.convertApiDataToTreeNodes(actualData);
                    }
                    
                    return {
                        data: treeData,
                        total: Array.isArray(treeData) ? treeData.length : 0
                    };
                }),
                catchError(error => {
                    console.error('🌳 API Error:', error);
                    return of({ data: [], total: 0 });
                })
            );
    }

    /**
     * Convert API data to TreeNode format
     */
    private convertApiDataToTreeNodes(apiData: any[]): TreeNode[] {
        if (!Array.isArray(apiData)) return [];
        
        return apiData.map(item => this.mapApiItemToTreeNode(item));
    }

    private mapApiItemToTreeNode(item: any): TreeNode {
        return {
            data: item.data,
            expanded: item.expanded !== false, // Default to true
            checked: item.data?.isRoleWidget || false,
            children: item.children ? item.children.map((child: any) => this.mapApiItemToTreeNode(child)) : []
        };
    }

    /**
     * Build parent references for current data tree.
     * Note: This relies on object identity of TreeNode, so it works best when search/filtering
     * is disabled (or when filteredData keeps the same node references).
     */
    private buildParentMap(nodes: TreeNode[], parent: TreeNode | null = null): void {
        for (const node of nodes) {
            this._parentMap.set(node, parent);
            if (node.children && node.children.length > 0) {
                this.buildParentMap(node.children, node);
            }
        }
    }

    getParent(node: TreeNode): TreeNode | null {
        return this._parentMap.get(node) ?? null;
    }

    /**
     * Apply search and filters to data
     */
    private applyFilters(): void {
        const data = this._data.value;
        const state = this._state.value;
        
        let filteredData = [...data];

        // Apply search
        if (state.search) {
            filteredData = this.filterNodesBySearch(filteredData, state.search);
        }

        // Apply filters
        Object.keys(state.filters).forEach(key => {
            const filterValue = state.filters[key];
            if (filterValue !== null && filterValue !== undefined && filterValue !== '') {
                filteredData = this.filterNodesByKey(filteredData, key, filterValue);
            }
        });

        this._filteredData.next(filteredData);
    }

    /**
     * Filter nodes by search term
     */
    private filterNodesBySearch(nodes: TreeNode[], searchTerm: string): TreeNode[] {
        const filtered: TreeNode[] = [];
        
        for (const node of nodes) {
            const matchesSearch = this.nodeMatchesSearch(node, searchTerm);
            const filteredChildren = node.children ? this.filterNodesBySearch(node.children, searchTerm) : [];
            
            if (matchesSearch || filteredChildren.length > 0) {
                filtered.push({
                    ...node,
                    children: filteredChildren
                });
            }
        }
        
        return filtered;
    }

    /**
     * Check if node matches search term
     */
    private nodeMatchesSearch(node: TreeNode, searchTerm: string): boolean {
        const config = this._config.value;
        if (!config) return false;

        const searchLower = searchTerm.toLowerCase();
        
        return config.displayFields.some(field => {
            if (!field.searchable) return false;
            
            const value = this.getNestedProperty(node.data, field.key);
            return value?.toString().toLowerCase().includes(searchLower);
        });
    }

    /**
     * Filter nodes by specific key-value
     */
    private filterNodesByKey(nodes: TreeNode[], key: string, value: any): TreeNode[] {
        const filtered: TreeNode[] = [];
        
        for (const node of nodes) {
            const nodeValue = this.getNestedProperty(node.data, key);
            const matches = nodeValue === value || (typeof value === 'string' && nodeValue?.toString().toLowerCase().includes(value.toLowerCase()));
            const filteredChildren = node.children ? this.filterNodesByKey(node.children, key, value) : [];
            
            if (matches || filteredChildren.length > 0) {
                filtered.push({
                    ...node,
                    children: filteredChildren
                });
            }
        }
        
        return filtered;
    }

    /**
     * Get nested property value
     */
    private getNestedProperty(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Update state
     */
    private updateState(update: Partial<TreeListState>): void {
        const currentState = this._state.value;
        const newState = { ...currentState, ...update };
        this._state.next(newState);
        this.applyFilters();
    }

    // Public methods for state management
    setSearch(search: string): void {
        this.updateState({ search });
    }

    setFilter(key: string, value: any): void {
        const filters = { ...this._state.value.filters };
        if (value === null || value === undefined || value === '') {
            delete filters[key];
        } else {
            filters[key] = value;
        }
        this.updateState({ filters });
    }

    toggleNode(node: TreeNode): void {
        const state = this._state.value;
        const expandedNodes = new Set(state.expandedNodes);
        
        const nodeId = this.getNodeId(node);
        if (expandedNodes.has(nodeId)) {
            expandedNodes.delete(nodeId);
        } else {
            expandedNodes.add(nodeId);
        }
        
        this.updateState({ expandedNodes });
    }

    expandAll(): void {
        const expandedNodes = new Set<any>();
        this.collectAllNodeIds(this._data.value, expandedNodes);
        this.updateState({ expandedNodes });
    }

    collapseAll(): void {
        this.updateState({ expandedNodes: new Set() });
    }

    selectNode(node: TreeNode): void {
        const selectedNodes = [node];
        this.updateState({ selectedNodes });
    }

    toggleSelection(node: TreeNode): void {
        const currentSelection = this._state.value.selectedNodes;
        const nodeId = this.getNodeId(node);
        const index = currentSelection.findIndex(n => this.getNodeId(n) === nodeId);
        
        let newSelection;
        if (index > -1) {
            newSelection = currentSelection.filter(n => this.getNodeId(n) !== nodeId);
        } else {
            newSelection = [...currentSelection, node];
        }
        
        this.updateState({ selectedNodes: newSelection });
    }

    isExpanded(node: TreeNode): boolean {
        const nodeId = this.getNodeId(node);
        return this._state.value.expandedNodes.has(nodeId);
    }

    isSelected(node: TreeNode): boolean {
        const nodeId = this.getNodeId(node);
        return this._state.value.selectedNodes.some(n => this.getNodeId(n) === nodeId);
    }

    private getNodeId(node: TreeNode): any {
        return node.data?.eid || node.data?.id || node.data?.title || JSON.stringify(node.data);
    }

    private collectAllNodeIds(nodes: TreeNode[], expandedNodes: Set<any>): void {
        for (const node of nodes) {
            if (node.children && node.children.length > 0) {
                expandedNodes.add(this.getNodeId(node));
                this.collectAllNodeIds(node.children, expandedNodes);
            }
        }
    }

    refresh(): void {
        this.loadData();
    }

    destroy(): void {
        this._state.complete();
        this._config.complete();
        this._data.complete();
        this._loading.complete();
        this._filteredData.complete();
    }
}
