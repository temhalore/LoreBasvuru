import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { map, switchMap, debounceTime, distinctUntilChanged, catchError, filter } from 'rxjs/operators';
import { HttpService } from '../../../base/services/http.service';
import { DataTableConfig, DataTableState, DataTableRequestDTO, DataTableResponseDTO, DataTableColumns, DataTableOrder, DataTableSearch } from './data-table.types';

@Injectable()
export class DataTableService {
    private _httpClient: HttpClient;
    private _httpService: HttpService;

    private _state = new BehaviorSubject<DataTableState>({
        page: 0,
        pageSize: 10,
        search: '',
        filters: {},
        selectedRows: []
    });

    private _config = new BehaviorSubject<DataTableConfig | null>(null);
    private _data = new BehaviorSubject<any[]>([]);
    private _loading = new BehaviorSubject<boolean>(false);
    private _total = new BehaviorSubject<number>(0);
    private _dataLoadingSubscription?: any;
    
    // Pending filters - henüz API'ye gönderilmemiş filtre değerleri
    private _pendingFilters: { [key: string]: any } = {};

    constructor() {
        this._httpClient = inject(HttpClient);
        this._httpService = inject(HttpService);

        // Setup reactive data loading
        this.setupReactiveDataLoading();
    }

    /**
     * Setup reactive data loading based on state changes
     */
    private setupReactiveDataLoading(): void {
        // Combine state and config changes to trigger data loading
        this._dataLoadingSubscription = combineLatest([
            this._state.asObservable(),
            this._config.asObservable()
        ]).pipe(
            // Skip initial emission until we have config
            filter(([state, config]) => !!config),
            // Debounce to prevent multiple rapid calls
            debounceTime(300),
            // Switch to latest data loading request
            switchMap(([state, config]) => {
                return this.loadData();
            })
        ).subscribe();
    }

    // Getters
    get state$(): Observable<DataTableState> {
        return this._state.asObservable();
    }

    get config$(): Observable<DataTableConfig | null> {
        return this._config.asObservable();
    }

    get data$(): Observable<any[]> {
        return this._data.asObservable();
    }

    get loading$(): Observable<boolean> {
        return this._loading.asObservable();
    }

    get total$(): Observable<number> {
        return this._total.asObservable();
    }

    get state(): DataTableState {
        return this._state.value;
    }

    get config(): DataTableConfig | null {
        return this._config.value;
    }

    /**
     * Initialize the data table with configuration
     */
    initialize(config: DataTableConfig): void {
        this._config.next(config);

        // Set initial state based on config
        const initialState: DataTableState = {
            page: 0,
            pageSize: config.pagination?.pageSize || 10,
            search: '',
            filters: {},
            selectedRows: [],
            ...(config.sorting?.defaultSort && {
                sortColumn: config.sorting.defaultSort.column,
                sortDirection: config.sorting.defaultSort.direction
            })
        };

        this._state.next(initialState);
    }

    /**
     * Update state
     */
    private updateState(update: Partial<DataTableState>): void {
        const currentState = this._state.value;
        const newState = { ...currentState, ...update };
        this._state.next(newState);
    }

    /**
     * Load data based on current state and config
     */
    loadData(): Observable<DataTableResponseDTO<any>> {
        const config = this._config.value;
        
        if (!config || !config.apiUrl) {
            return of({ data: [], draw: 0, recordsFiltered: 0, recordsTotal: 0 });
        }

        this._loading.next(true);

        return this.loadFromApiInternal().pipe(
            map((response: DataTableResponseDTO<any>) => {
                this._data.next(response.data);
                this._total.next(response.recordsTotal);
                this._loading.next(false);
                return response;
            })
        );
    }

    /**
     * Load data from API for external use - Compatible with your C# backend
     */
    loadFromApi<T>(entityType: string, request: DataTableRequestDTO<T>): Observable<DataTableResponseDTO<T>> {
        return this._httpService.Post(entityType, request)
            .pipe(
                map(response => {
                    // HttpService ServiceResponseModel'den data'yı çıkar
                    const actualData = response.data || response;
                    return this.convertFromApiResponse(actualData);
                }),
                catchError(error => {
                    console.error('❌ [loadFromApi] API Error:', error);
                    return of({ data: [], draw: 0, recordsFiltered: 0, recordsTotal: 0 });
                })
            );
    }

    /**
     * Load data from JSON file (for examples)
     */
    loadFromJson(jsonFile: string): Observable<DataTableResponseDTO<any>> {
        const config = this._config.value!;
        const state = this._state.value;

        return this._httpClient.get<any>(`/data/${jsonFile}`)
            .pipe(
                map(response => {
                    // JSON dosyası zaten doğru formatta gelecek
                    let dataArray = response.data || response;
                    let totalRecords = response.recordsTotal || response.data?.length || dataArray.length;

                    // Client-side filtering uygula
                    if (state.search) {
                        dataArray = dataArray.filter((item: any) =>
                            Object.values(item).some((value: any) =>
                                value?.toString().toLowerCase().includes(state.search!.toLowerCase())
                            )
                        );
                    }

                    // Client-side filtering (filters)
                    const filters = Object.entries(state.filters).map(([key, value]) => ({ key, value: value as string }));
                    if (filters && filters.length > 0) {
                        filters.forEach(filter => {
                            if (filter.value) {
                                dataArray = dataArray.filter((item: any) =>
                                    item[filter.key]?.toString().toLowerCase().includes(filter.value.toLowerCase())
                                );
                            }
                        });
                    }

                    // Client-side sorting
                    if (state.sortColumn) {
                        dataArray.sort((a: any, b: any) => {
                            const aVal = a[state.sortColumn!];
                            const bVal = b[state.sortColumn!];

                            const isDescending = state.sortDirection === 'desc';
                            if (aVal < bVal) return isDescending ? 1 : -1;
                            if (aVal > bVal) return isDescending ? -1 : 1;
                            return 0;
                        });
                    }

                    // Client-side pagination
                    const startIndex = state.page * state.pageSize;
                    const endIndex = startIndex + state.pageSize;
                    const paginatedData = dataArray.slice(startIndex, endIndex);

                    const result: DataTableResponseDTO<any> = {
                        data: paginatedData,
                        draw: 0,
                        recordsTotal: totalRecords,
                        recordsFiltered: dataArray.length
                    };

                    return result;
                }),
                catchError(error => {
                    console.error('📁 JSON file error:', error);
                    return of({ data: [], draw: 0, recordsFiltered: 0, recordsTotal: 0 });
                })
            );
    }
    /**
     * Load data from API (internal use)
     */
    private loadFromApiInternal(): Observable<DataTableResponseDTO<any>> {
        const config = this._config.value!;

        // JSON file desteği - eğer apiUrl bir JSON dosyası ise
        if (config.apiUrl.endsWith('.json')) {
            return this.loadFromJson(config.apiUrl);
        }

        // Normal API çağrısı
        const state = this._state.value;


        // Build DataTableRequestDTO directly
        const dataTableRequest = this.buildDataTableRequest(state, config);


        // Send DataTableRequestDTO directly to backend
        return this._httpService.Post(config.apiUrl, dataTableRequest)
            .pipe(
                map(response => {
                    // HttpService ServiceResponseModel'den data'yı çıkar

                    const actualData = response.data || response;

                    const convertedResponse = this.convertFromApiResponse(actualData);

                    return convertedResponse;
                }),
                catchError(error => {
                    console.error('API Error:', error);
                    this._loading.next(false);
                    return of({ data: [], draw: 0, recordsFiltered: 0, recordsTotal: 0 });
                })
            );
    }

    /**
     * Convert API response to internal format
     */
    private convertFromApiResponse(apiResponse: any): DataTableResponseDTO<any> {

        // API response has nested structure: { data: { data: [...], recordsTotal: ..., etc. } }
        const innerData = apiResponse.data || apiResponse;

        // Farklı response yapıları için kontrol edelim
        let dataArray = [];
        let totalRecords = 0;
        let filteredRecords = 0;

        // Try to extract total records from various possible locations
        if (innerData.data && Array.isArray(innerData.data)) {
            // Standard DataTable response: { data: [...], recordsTotal: ... }
            dataArray = innerData.data;
            totalRecords = innerData.recordsTotal || innerData.recordsFiltered || innerData.total || 0;
            filteredRecords = innerData.recordsFiltered || innerData.recordsTotal || totalRecords;
        } else if (Array.isArray(innerData)) {
            // Direct array response - might be the main response or nested
            dataArray = innerData;
            
            // Check if parent object has total records info
            if (apiResponse.recordsTotal !== undefined) {
                totalRecords = apiResponse.recordsTotal;
                filteredRecords = apiResponse.recordsFiltered || apiResponse.recordsTotal;
            } else {
                // CRITICAL: If this is paginated data from backend, we shouldn't use array length as total
                totalRecords = innerData.length; // This is WRONG for paginated data!
                filteredRecords = totalRecords;
            }
        } else if (innerData.items && Array.isArray(innerData.items)) {
            // Paged response with items: { items: [...], totalCount: ... }
            dataArray = innerData.items;
            totalRecords = innerData.totalCount || innerData.total || 0;
            filteredRecords = totalRecords;
        } else {
            console.warn('🔄 Unknown response structure, using empty array');
        }

        
        // CRITICAL DEBUG: Show where total came from
        
        // Check if all records are the same (pagination issue)
        if (dataArray.length > 1) {
            const firstRecord = JSON.stringify(dataArray[0]);
            const allSame = dataArray.every(record => JSON.stringify(record) === firstRecord);
            if (allSame) {
                console.error('❌ PAGINATION ISSUE: All records are identical!');
                console.error('❌ This suggests backend pagination is not working correctly');
                console.error('❌ First record:', dataArray[0]);
            } else {
            }
        }

        const result: DataTableResponseDTO<any> = {
            data: dataArray,
            draw: 0,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords
        };

        return result;
    }

    // State management methods
    setPage(page: number): void {
        this.updateState({ page });
        // Reactive loading will handle data reload automatically
    }

    setPageSize(pageSize: number): void {
        this.updateState({ pageSize, page: 0 });
        // Reactive loading will handle data reload automatically
    }

    setSearch(search: string): void {
        this.updateState({ search, page: 0 });
        // Reactive loading will handle data reload automatically
    }

    setSorting(column: string, direction: 'asc' | 'desc' | ''): void {
        this.updateState({
            sortColumn: column,
            sortDirection: direction as 'asc' | 'desc',
            page: 0
        });
        // Reactive loading will handle data reload automatically
    }

    /**
     * Apply multiple filters
     */
    filter(filters: { [key: string]: any }): void {
        // Clean up empty values
        const cleanFilters: { [key: string]: any } = {};
        Object.keys(filters).forEach(key => {
            const value = filters[key];
            if (value !== null && value !== undefined && value !== '') {
                cleanFilters[key] = value;
            }
        });
        
        this.updateState({ filters: cleanFilters, page: 0 });
    }

    setFilter(key: string, value: any): void {
        const filters = { ...this._state.value.filters };
        if (value === null || value === undefined || value === '') {
            delete filters[key];
        } else {
            filters[key] = value;
        }
        this.updateState({ filters, page: 0 });
        // Reactive loading will handle data reload automatically
    }

    /**
     * Set filter without triggering API call - for manual search button
     * Filtre değerini pending filters'a ekler, API çağrısı yapmaz
     */
    setFilterWithoutApply(key: string, value: any): void {
        if (value === null || value === undefined || value === '') {
            delete this._pendingFilters[key];
        } else {
            this._pendingFilters[key] = value;
        }
    }

    /**
     * Apply all pending filters and trigger API call
     * Tüm pending filtreleri uygular ve API çağrısı yapar
     */
    applyFilters(): void {
        
        // Clean up empty values
        const cleanFilters: { [key: string]: any } = {};
        Object.keys(this._pendingFilters).forEach(key => {
            const value = this._pendingFilters[key];
            if (value !== null && value !== undefined && value !== '') {
                cleanFilters[key] = value;
            }
        });
        
        
        // Update state with pending filters - this will trigger API call
        this.updateState({ filters: cleanFilters, page: 0 });
        
    }

    /**
     * Clear all pending filters without triggering API call
     */
    clearPendingFilters(): void {
        this._pendingFilters = {};
    }

    /**
     * Clear all filters and pending filters, then trigger API call
     */
    clearFilters(): void {
        this._pendingFilters = {};
        this.updateState({ filters: {}, page: 0 });
    }

    /**
     * Get current pending filters
     */
    getPendingFilters(): { [key: string]: any } {
        return { ...this._pendingFilters };
    }

    setSelection(rows: any[]): void {
        this.updateState({ selectedRows: rows });
    }

    toggleRowSelection(row: any): void {
        const currentSelection = this._state.value.selectedRows;
        const index = currentSelection.findIndex(item => item === row);

        let newSelection;
        if (index > -1) {
            newSelection = currentSelection.filter(item => item !== row);
        } else {
            newSelection = [...currentSelection, row];
        }

        this.updateState({ selectedRows: newSelection });
    }

    selectAllRows(rows: any[]): void {
        this.updateState({ selectedRows: [...rows] });
    }

    clearSelection(): void {
        this.updateState({ selectedRows: [] });
    }

    refresh(): void {
        // Force a refresh by updating state (even if no actual change)
        const currentState = this._state.value;
        this._state.next({ ...currentState });
    }

    reset(): void {
        const config = this._config.value;
        if (config) {
            this.initialize(config);
        }
    }

    destroy(): void {
        // Clean up reactive data loading subscription
        if (this._dataLoadingSubscription) {
            this._dataLoadingSubscription.unsubscribe();
        }

        this._state.complete();
        this._config.complete();
        this._data.complete();
        this._loading.complete();
        this._total.complete();
    }

    /**
     * Execute action via API
     */
    executeAction(action: any, row: any): Observable<any> {
        if (!action.apiUrl || !action.httpMethod) {
            console.warn('Action does not have apiUrl or httpMethod configured');
            return of(null);
        }

        let url = action.apiUrl;
        const method = action.httpMethod.toLowerCase();

        // Replace placeholders in URL with row data
        Object.keys(row).forEach(key => {
            url = url.replace(`{${key}}`, row[key]);
        });

        switch (method) {
            case 'get':
                // GET istekleri için HttpService'de ayrı method gerekebilir, şimdilik HttpClient kullanıyoruz
                return this._httpClient.get(url);
            case 'post':
                // POST action'lar için URL'nin sadece action kısmını alıp HttpService'e gönder
                const actionUrl = url.startsWith('http') ? url.split('/Api/')[1] || url : url;
                return this._httpService.Post(actionUrl, row);
            case 'put':
                return this._httpClient.put(url, row);
            case 'delete':
                return this._httpClient.delete(url);
            default:
                console.warn(`Unsupported HTTP method: ${method}`);
                return of(null);
        }
    }

    /**
     * Build DataTableRequestDTO from current state and config
     */
    private buildDataTableRequest<T>(state: DataTableState, config: DataTableConfig): DataTableRequestDTO<T> {
        // UI kolonları filtrele: template/actions/dropdown-actions tipleri backend'e gönderilmez
        const NON_DATA_TYPES = new Set(['template', 'actions', 'dropdown-actions']);
        const dataColumns = config.columns.filter(col => !NON_DATA_TYPES.has(col.type as string));

        // Build columns array from config (sadece veri kolonları)
        const columns: DataTableColumns[] = dataColumns.map(col => ({
            data: col.key,
            name: col.key,
            orderable: col.sortable === true,
            searchable: col.searchable === true
        }));

        // Build order array
        const order: DataTableOrder[] = [];
        if (state.sortColumn) {
            const columnIndex = columns.findIndex(col => col.name === state.sortColumn);
            if (columnIndex >= 0) {
                order.push({
                    column: columnIndex,
                    dir: state.sortDirection === 'desc' ? 'desc' : 'asc'
                });
            }
        }

        // Sıralama belirtilmemişse ilk sıralanabilir kolona göre sırala
        if (order.length === 0) {
            const firstSortableIndex = columns.findIndex(col => col.orderable);
            order.push({
                column: firstSortableIndex >= 0 ? firstSortableIndex : 0,
                dir: 'asc'
            });
        }

        // Build search object
        const search: DataTableSearch = {
            regex: false,
            value: state.search || ''
        };

        // Build data object with current filters applied
        const dataObj = this.buildDataObject(config, state);


        return {
            columns,
            start: state.page * state.pageSize,
            length: state.pageSize,
            draw: Date.now(), // Unique draw number
            order,
            search,
            data: dataObj as T
        };
    }

    /**
     * Build data object based on config and current state - for DTO
     */
    private buildDataObject(config: DataTableConfig, state: DataTableState): any {
        if (!config || !config.dataTemplate) {
            return {}; // Empty object instead of null
        }

        let dataObj: any = {};
        let templateObj: any = {};

        // If dataTemplate is provided in config, use it as base
        // IMPORTANT: Create a fresh copy to avoid mutating the original object
        if (typeof config.dataTemplate === 'function') {
            templateObj = config.dataTemplate();
        } else if (typeof config.dataTemplate === 'object') {
            templateObj = config.dataTemplate;
        }

        // Copy values from templateObj - this preserves parent component's filterModel values
        // Parent component can set values like odemeTarihiStart/End directly on filterModel
        // and they will be included in the API request
        Object.keys(templateObj).forEach(key => {
            const value = templateObj[key];
            // Preserve the actual value from templateObj (not reset to defaults)
            // This allows parent to set filter values directly on the model
            dataObj[key] = value;
        });

        // Apply current filters to the data object
        // This allows C# backend to use the data object for filtering
        
        Object.keys(state.filters).forEach(key => {
            const filterValue = state.filters[key];
            
            // Handle daterange filters - remove 'Start' and 'End' suffixes for matching
            let targetKey = key;
            if (key.endsWith('Start') || key.endsWith('End')) {
                // Keep the key as is for daterange fields
                targetKey = key;
            }
            
            
            let transformedValue = filterValue;
            if (targetKey.endsWith('KID') && filterValue && typeof filterValue === 'object' && 'id' in filterValue) {
                transformedValue = filterValue.id;
            }
            
            // Set the value if the property exists in dataObj
            if (transformedValue !== null && transformedValue !== undefined && transformedValue !== '' && dataObj.hasOwnProperty(targetKey)) {
                dataObj[targetKey] = transformedValue;
            } else {
            }
        });

        return dataObj;
    }
}
