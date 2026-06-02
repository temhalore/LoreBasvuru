import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnInit,
    OnDestroy,
    OnChanges,
    SimpleChanges,
    ChangeDetectionStrategy,
    ViewEncapsulation,
    TrackByFunction,
    ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormControl, FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Observable, Subject, debounceTime, takeUntil, combineLatest } from 'rxjs';
import { CodeSelectInputComponent } from 'app/shared/components/form-controls/code-select-input/code-select-input.component';
import { ApiSelectInputComponent } from 'app/shared/components/form-controls/api-select-input/api-select-input.component';

import { DataTableService } from './data-table.service';
import {
    DataTableConfig,
    DataTableColumn,
    DataTableAction,
    DataTableFilter,
    DataTableState
} from './data-table.types';

@Component({
    selector: 'app-data-table',
    templateUrl: './data-table.component.html',
    styleUrls: ['./data-table.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    providers: [DataTableService],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatCheckboxModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatPaginatorModule,
        MatSortModule,
        MatTooltipModule,
        MatMenuModule,
        CurrencyPipe,
        DatePipe,
        CodeSelectInputComponent,
        ApiSelectInputComponent
    ]
})
export class DataTableComponent implements OnInit, OnDestroy, OnChanges {
    @Input() config!: DataTableConfig;
    @Input() height?: string;
    @Input() stickyHeader = true;

    @Output() rowClick = new EventEmitter<any>();
    @Output() rowSelect = new EventEmitter<any[]>();
    @Output() actionClick = new EventEmitter<{ action: DataTableAction; row: any }>();
    @Output() filtersApplied = new EventEmitter<any>();

    // View mode: 'table' or 'card'
    viewMode: 'table' | 'card' = 'table';
    @Output() stateChange = new EventEmitter<DataTableState>();

    // Observables
    data$!: Observable<any[]>;
    loading$!: Observable<boolean>;
    total$!: Observable<number>;
    state$!: Observable<DataTableState>;

    // Form controls
    searchControl = new FormControl('');
    filterControls = new Map<string, FormControl>();
    filtersForm: FormGroup = new FormGroup({});

    // State - BehaviorSubject values for immediate access
    state!: DataTableState;
    selectedRows: any[] = [];
    displayedColumns: string[] = [];
    dataSource = new MatTableDataSource<any>([]); // Mat-table için MatTableDataSource
    loading = false; // Loading state for immediate access
    total = 0; // Total count for immediate access

    private _unsubscribeAll = new Subject<any>();

    constructor(
        public _dataTableService: DataTableService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _matPaginatorIntl: MatPaginatorIntl,
        private _formBuilder: FormBuilder,
        private _sanitizer: DomSanitizer
    ) {}

    getSafeHtml(value: string): SafeHtml {
        return this._sanitizer.bypassSecurityTrustHtml(value ?? '');
    }

    ngOnInit(): void {
        // Türkçe paginator etiketleri
        this._matPaginatorIntl.itemsPerPageLabel = 'Sayfa başına:';
        this._matPaginatorIntl.nextPageLabel = 'Sonraki sayfa';
        this._matPaginatorIntl.previousPageLabel = 'Önceki sayfa';
        this._matPaginatorIntl.firstPageLabel = 'İlk sayfa';
        this._matPaginatorIntl.lastPageLabel = 'Son sayfa';
        this._matPaginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
            if (length === 0 || pageSize === 0) {
                return `0 / ${length}`;
            }
            const startIndex = page * pageSize;
            const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
            return `${startIndex + 1} - ${endIndex} / ${length}`;
        };

        // Initialize the service with config
        this._dataTableService.initialize(this.config);

        // Initialize filters form
        this.setupFiltersForm();

        // Setup observables
        this.data$ = this._dataTableService.data$;
        this.loading$ = this._dataTableService.loading$;
        this.total$ = this._dataTableService.total$;
        this.state$ = this._dataTableService.state$;

        // Subscribe to all observables with a single subscription to reduce change detection calls
        combineLatest([
            this.state$,
            this.data$,
            this.loading$,
            this.total$
        ])
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(([state, data, loading, total]) => {
            // Clear cache when data changes
            if (this.dataSource.data !== data) {
                this.clearCellValueCache();
            }

            this.state = state;
            this.selectedRows = state.selectedRows;

            // Server-side pagination: Set data directly without any client-side pagination
            this.dataSource.data = data || [];

            // Disable MatTableDataSource's built-in pagination and filtering
            this.dataSource.paginator = null;
            this.dataSource.sort = null;
            this.dataSource.filter = '';

            this.loading = loading;
            this.total = total;

            this.stateChange.emit(state);
            this._changeDetectorRef.markForCheck();
        });

        // Setup displayed columns
        this.setupDisplayedColumns();

        // Setup form controls
        this.setupFormControls();

        // Setup search
        this.setupSearch();

        // Setup filters
        this.setupFilters();
    }

    ngOnChanges(changes: SimpleChanges): void {
        // If config changes, re-initialize the service
        if (changes['config'] && !changes['config'].firstChange) {
            this._dataTableService.initialize(changes['config'].currentValue);
            this.setupDisplayedColumns();
            this.setupFormControls();
            this.setupFilters();
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
        this._dataTableService.destroy();
        this.clearCellValueCache();
    }

    isArray(value: unknown): value is unknown[] {
        return Array.isArray(value);
    }

    getCellHtmlValue(row: any, column: DataTableColumn): string {
        const rawValue = this.getCellValue(row, column);
        if (rawValue == null) {
            return '';
        }

        const content = String(rawValue).trim();
        if (!content) {
            return '';
        }

        const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch?.[1]) {
            return bodyMatch[1];
        }

        const htmlMatch = content.match(/<html[^>]*>([\s\S]*?)<\/html>/i);
        if (htmlMatch?.[1]) {
            return htmlMatch[1];
        }

        return content;
    }

    /**
     * Setup displayed columns
     */
    private setupDisplayedColumns(): void {
        this.displayedColumns = [];

        const visibleCols = this.config.columns.filter(col => !col.hidden);

        const stickyStartCols = visibleCols.filter(col =>
            col.sticky === 'start' || this.isDefaultStickyStart(col)
        );
        const stickyEndCols   = visibleCols.filter(col => col.sticky === 'end');
        const normalCols      = visibleCols.filter(col =>
            !stickyStartCols.includes(col) && !stickyEndCols.includes(col)
        );

        // Selection checkbox her zaman en sol
        if (this.config.selection?.enabled) {
            this.displayedColumns.push('select');
        }

        // sticky:start → normal → sticky:end
        this.displayedColumns.push(
            ...stickyStartCols.map(col => col.key),
            ...normalCols.map(col => col.key),
            ...stickyEndCols.map(col => col.key),
        );
    }

    /** actions / dropdown-actions kolonu sticky değeri verilmemişse varsayılan olarak başa alınır */
    isDefaultStickyStart(col: DataTableColumn): boolean {
        return !col.sticky && (col.type === 'actions' || col.type === 'dropdown-actions' || col.type === 'template');
    }

    /**
     * Setup form controls
     */
    private setupFormControls(): void {
        // Search control
        if (this.config.searchable) {
            this.searchControl.setValue(this.state?.search || '');
        }

        // Filter controls
        this.config.filters?.forEach(filter => {
            const control = new FormControl(this.state?.filters?.[filter.key] || '');
            this.filterControls.set(filter.key, control);
        });
    }

    /**
     * Setup search functionality
     */
    private setupSearch(): void {
        if (!this.config.searchable) return;

        this.searchControl.valueChanges
            .pipe(
                debounceTime(300),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe(value => {
                // Clear selection when search changes
                this._dataTableService.clearSelection();
                this.rowSelect.emit([]);

                this._dataTableService.setSearch(value || '');
            });
    }

    /**
     * Setup filters functionality
     * Filtreler artık otomatik olarak API çağrısı yapmaz,
     * kullanıcı "Ara" butonuna bastığında applyFilters() çağrılır
     */
    private setupFilters(): void {
        // filtersForm'daki her control'ü dinle
        if (this.filtersForm) {
            Object.keys(this.filtersForm.controls).forEach(controlName => {
                const control = this.filtersForm.get(controlName);
                if (control) {
                    // Control name'den filter key'i çıkar
                    // 'filter_profilTip' -> 'profilTip'
                    // 'filter_odemeTarihiStart' -> 'odemeTarihiStart'
                    const filterKey = controlName.replace('filter_', '');

                    control.valueChanges
                        .pipe(
                            debounceTime(100), // Kısa debounce - code-select'lerin initialize olmasını bekle
                            takeUntil(this._unsubscribeAll)
                        )
                        .subscribe(value => {
                            // Filtre değerini pending filters'a ekle - API çağrısı yapmaz
                            this._dataTableService.setFilterWithoutApply(filterKey, value);
                        });
                }
            });
        }

        // onFiltersChange callback için filtersForm'un tümünü de dinle
        if (this.filtersForm && this.config.onFiltersChange) {
            this.filtersForm.valueChanges
                .pipe(
                    debounceTime(300),
                    takeUntil(this._unsubscribeAll)
                )
                .subscribe(allFilterValues => {
                    this.config.onFiltersChange!(allFilterValues);
                });
        }
    }

    /**
     * Get filter control by key
     */
    getFilterControl(key: string): FormControl {
        // filter_ prefix'li key ile ara (örn: 'filter_ad')
        const prefixedKey = key.startsWith('filter_') ? key : `filter_${key}`;
        return this.filterControls.get(prefixedKey) || this.filterControls.get(key) || new FormControl('');
    }

    /**
     * Track by function for columns
     */
    trackByColumnKey: TrackByFunction<DataTableColumn> = (index, column) => column.key;

    /**
     * Setup filters form
     */
    private setupFiltersForm(): void {

        const filterControls: any = {};

        if (this.config.filters) {
            this.config.filters.forEach(filter => {
                if (filter.type === 'daterange') {
                    // DateRange için Start ve End kontrolleri oluştur
                    const startControlName = `filter_${filter.key}Start`;
                    const endControlName = `filter_${filter.key}End`;
                    const startControl = new FormControl('');
                    const endControl = new FormControl('');
                    filterControls[startControlName] = startControl;
                    filterControls[endControlName] = endControl;
                    // filterControls Map'ine de aynı key ile ekle (getFilterControl tutarlılığı için)
                    this.filterControls.set(`${filter.key}Start`, startControl);
                    this.filterControls.set(`${filter.key}End`, endControl);
                } else {
                    const controlName = `filter_${filter.key}`;
                    const control = new FormControl('');
                    filterControls[controlName] = control;
                    // filterControls Map'ine de aynı key ile ekle (getFilterControl tutarlılığı için)
                    this.filterControls.set(controlName, control);
                }
            });
        }

        this.filtersForm = this._formBuilder.group(filterControls);
    }

    /**
     * Track by function for filters
     */
    trackByFilterKey: TrackByFunction<DataTableFilter> = (index, filter) => filter.key;

    /**
     * Track by function for table rows
     */
    trackByFn: TrackByFunction<any> = (index, item) => {
        // Create a unique identifier for each row
        return item.identificationNumber || item.eid || item.loginName || item.id || `row-${index}`;
    };

    /**
     * Track by function for actions
     */
    trackByActionKey: TrackByFunction<any> = (index, action) => action.label;

    /**
     * Track by function for filter options
     */
    trackByOptionKey: TrackByFunction<any> = (index, option) => option.value;

    /**
     * Track by function for custom buttons
     */
    trackByButtonLabel: TrackByFunction<any> = (index, button) => button.label;

    /**
     * Handle sort change
     */
    onSortChange(sort: Sort): void {
        // Clear selection when sort changes
        this._dataTableService.clearSelection();
        this.rowSelect.emit([]);

        if (sort.active && sort.direction) {
            this._dataTableService.setSorting(sort.active, sort.direction);
        }
    }

    /**
     * Handle page change
     */
    onPageChange(event: PageEvent): void {
        // Clear selection when page changes
        this._dataTableService.clearSelection();

        this._dataTableService.setPage(event.pageIndex);
        if (event.pageSize !== this.state.pageSize) {
            this._dataTableService.setPageSize(event.pageSize);
        }

        // Emit selection change
        this.rowSelect.emit([]);
    }

    /**
     * Handle row click
     */
    onRowClick(row: any): void {
        this.rowClick.emit(row);
    }

    getRowClasses(row: any): string {
        const baseClasses = 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors';
        const customClass = this.config.rowClass ? this.config.rowClass(row) : '';
        return `${baseClasses} ${customClass}`.trim();
    }

    /**
     * Handle action click
     */
    onAction(action: DataTableAction, row: any): void {
        this.actionClick.emit({ action, row });

        // If action has API configuration, use the service to execute it
        if (action.apiUrl && action.httpMethod) {
            this._dataTableService.executeAction(action, row).subscribe({
                next: (result) => {
                    // Action completed successfully
                },
                error: (error) => {
                    console.error('Action execution failed:', error);
                }
            });
        } else {
            // Fallback to direct action execution
            action.action(row);
        }
    }

    /**
     * Memoized cache for cell values
     */
    private cellValueCache = new Map<string, any>();

    /**
     * Get cell value with memoization
     */
    getCellValue(row: any, column: DataTableColumn): any {
        // Create unique cache key using multiple possible identifiers
        const uniqueId = row.identificationNumber || row.eid || row.loginName || row.id || row.Id || JSON.stringify(row);
        // Önce dataName varsa onu cache key'e ekle, yoksa key'i kullan
        const cacheKey = `${uniqueId}-${column.dataName || column.key}`;

        // Check cache first
        if (this.cellValueCache.has(cacheKey)) {
            return this.cellValueCache.get(cacheKey);
        }

        // Öncelik: dataName ile gösterilecek alanı bul
        let value;
        if (column.dataName) {
            const dataKeys = column.dataName.split('.');
            value = row;
            for (const key of dataKeys) {
                value = value?.[key];
            }
        } else {
            // Eski key mantığıyla devam
            const keys = column.key.split('.');
            value = row;
            for (const key of keys) {
                value = value?.[key];
            }
        }

        // Eğer value undefined ise, case-insensitive denemeleri yap
        if (value === undefined) {
            const tryKey = column.dataName || column.key;
            const lowercaseKey = tryKey.charAt(0).toLowerCase() + tryKey.slice(1);
            value = row?.[lowercaseKey];
            if (value === undefined) {
                const uppercaseKey = tryKey.charAt(0).toUpperCase() + tryKey.slice(1);
                value = row?.[uppercaseKey];
            }
        }

        // Cache the result
        this.cellValueCache.set(cacheKey, value);

        return value;
    }

    /**
     * Clear cell value cache when data changes
     */
    private clearCellValueCache(): void {
        this.cellValueCache.clear();
    }

    /**
     * Get column classes
     */
    getColumnClasses(column: DataTableColumn): string {
        const classes: string[] = [];

        if (column.align) {
            classes.push(`text-${column.align}`);
        }

        if (column.sticky) {
            classes.push(`sticky-${column.sticky}`);
        }

        // Add specific classes for column types
        if (column.type === 'actions') {
            classes.push('actions-column');
        }

        if (column.type === 'boolean') {
            classes.push('text-center');
        }

        return classes.join(' ');
    }

    /**
     * Get badge classes based on value
     */
    getBadgeClasses(value: any): string {
        const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

        // You can customize this based on your needs
        switch (value?.toString().toLowerCase()) {
            case 'active':
            case 'success':
            case 'completed':
                return `${baseClasses} bg-green-100 text-green-800`;
            case 'inactive':
            case 'error':
            case 'failed':
                return `${baseClasses} bg-red-100 text-red-800`;
            case 'pending':
            case 'warning':
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'draft':
            case 'info':
                return `${baseClasses} bg-blue-100 text-blue-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    }

    /**
     * Selection methods
     */
    isRowSelected(row: any): boolean {
        return this.selectedRows.some(r => r.id === row.id);
    }

    isAllSelected(): boolean {
        return this.dataSource.data.length > 0 && this.selectedRows.length === this.dataSource.data.length;
    }

    isPartiallySelected(): boolean {
        return this.selectedRows.length > 0 && !this.isAllSelected();
    }

    toggleRowSelection(row: any): void {
        this._dataTableService.toggleRowSelection(row);
        this.rowSelect.emit(this.selectedRows);
    }

    toggleAllSelection(event: any): void {
        if (event.checked) {
            this._dataTableService.selectAllRows(this.dataSource.data);
        } else {
            this._dataTableService.clearSelection();
        }
        this.rowSelect.emit(this.selectedRows);
    }

    /**
     * Clear search
     */
    clearSearch(): void {
        this.searchControl.setValue('');
    }

    /**
     * Apply all pending filters and trigger API call
     * Tüm filtreleri uygular ve API çağrısı yapar
     */
    applyFilters(): void {
        // Clear selection when applying filters
        this._dataTableService.clearSelection();
        this.rowSelect.emit([]);

        // Apply pending filters - this will trigger API call
        this._dataTableService.applyFilters();
        // Uygulanan filtreleri emit et - parent component istatistik güncellemesi yapabilir
        this.filtersApplied.emit(this.filtersForm.value);
    }

    /**
     * Clear all filters
     */
    clearFilters(): void {
        // Clear all filters (pending + applied) first - before form controls emit changes
        this._dataTableService.clearFilters();

        // filtersForm içindeki tüm kontrolleri temizle
        // emitEvent: true olmalı ki code-select-input gibi bileşenler kendi içlerindeki
        // selectedItem/selectedItems değişkenlerini temizlesin
        if (this.filtersForm) {
            Object.keys(this.filtersForm.controls).forEach(controlName => {
                const control = this.filtersForm.get(controlName);
                if (control) {
                    control.setValue(null);
                }
            });
        }

        // Clear selection
        this._dataTableService.clearSelection();
        this.rowSelect.emit([]);

        // Filtreler temizlendiğinde emit et
        this.filtersApplied.emit({});
    }

    /**
     * Toggle between table and card view modes
     */
    toggleViewMode(): void {
        this.viewMode = this.viewMode === 'table' ? 'card' : 'table';
    }
}
