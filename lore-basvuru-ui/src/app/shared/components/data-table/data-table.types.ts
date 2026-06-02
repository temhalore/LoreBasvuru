export interface DataTableColumn {
    key: string; // DB'deki kolon adı (order, filter vs. için)
    dataName?: string; // DTO'dan dönen alan adı (ekranda gösterilecek veri için)
    label: string;

    type?: 'text' | 'number' | 'date' | 'boolean' | 'image' | 'currency' | 'badge' | 'html' | 'actions' | 'dropdown-actions' | 'template';

    sortable?: boolean;
    searchable?: boolean;
    filterable?: boolean;
    width?: string;
    sticky?: 'start' | 'end';
    hidden?: boolean;
    align?: 'left' | 'center' | 'right';
    format?: string; // For dates, numbers etc.
    pipe?: string; // Angular pipe name
    template?: any; // Custom template
}

export interface DataTableAction {
    label: string;
    icon?: string;
    color?: 'primary' | 'accent' | 'warn';
    action: (row: any) => void;
    visible?: (row: any) => boolean;
    disabled?: (row: any) => boolean;
    apiUrl?: string; // Optional API URL for the action
    httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE'; // HTTP method to use
    confirmMessage?: string; // Optional confirmation message
    successMessage?: string; // Optional success message
    errorMessage?: string; // Optional error message
}

export interface DataTableFilter {
    key: string;
    label: string;
    type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'code-select' | 'api-select';
    options?: { value: any; label: string }[];
    placeholder?: string;
    codeId?: number; // Code-select için kod ID'si
    multiple?: boolean; // Multiple selection için
    apiUrl?: string; // API-select için API URL'i
    displayField?: string; // API-select için görüntülenecek alan
    displayFields?: string[]; // API-select için birden fazla görüntü alanı
    displaySeparator?: string; // API-select için ayırıcı
    searchFields?: string[]; // API-select için arama alanları
    colSize?: 'w-full' | 'w-1/2' | 'w-1/3' | 'w-1/4' | 'w-1/6' | 'w-2/3' | 'w-3/4' | 'w-5/6' |
            'md:w-full' | 'md:w-1/2' | 'md:w-1/3' | 'md:w-1/4' | 'md:w-1/6' | 'md:w-2/3' | 'md:w-3/4' | 'md:w-5/6' |
            'lg:w-full' | 'lg:w-1/2' | 'lg:w-1/3' | 'lg:w-1/4' | 'lg:w-1/6' | 'lg:w-2/3' | 'lg:w-3/4' | 'lg:w-5/6'; // Tailwind width classes - default: md:w-1/4
}

// Custom button interface for header buttons
export interface DataTableCustomButton {
    label: string;
    icon?: string;
    color?: 'primary' | 'accent' | 'warn' | 'success' | 'info' | 'secondary';
    variant?: 'flat' | 'raised' | 'stroked' | 'fab' | 'mini-fab' | 'icon';
    action: () => void;
    disabled?: boolean;
    tooltip?: string;
}

export interface DataTableConfig {
    title?: string;
    subtitle?: string;
    showTitle?: boolean;
    columns: DataTableColumn[];
    actions?: DataTableAction[];
    rowClass?: (row: any) => string;
    filters?: DataTableFilter[];
    apiUrl: string; // Now required - only API mode supported
    dataTemplate?: any | (() => any); // DTO template for API requests
    onFiltersChange?: (filters: any) => void; // Filter değişikliklerini dinlemek için
    customButtons?: DataTableCustomButton[]; // Header'a custom button'lar eklemek için
    pagination?: {
        enabled: boolean;
        pageSize: number;
        pageSizeOptions?: number[];
    };
    sorting?: {
        enabled: boolean;
        defaultSort?: { column: string; direction: 'asc' | 'desc' };
    };
    selection?: {
        enabled: boolean;
        multiple: boolean;
    };
    searchable?: boolean;
    exportable?: boolean;
    responsive?: boolean;
    loading?: boolean;
}

// API Response DTO - Backend'den gelen format
export interface DataTableResponseDTO<T> {
    data: T[];
    draw: number;
    recordsFiltered: number;
    recordsTotal: number;
}

// API Request DTO - Backend'e gönderilen format (C# ile uyumlu)
export interface DataTableRequestDTO<T> {
    columns: DataTableColumns[]; // C# tarafındaki isimle uyumlu
    start: number;
    length: number;
    draw: number;
    order: DataTableOrder[]; // C# tarafındaki isimle uyumlu
    search: DataTableSearch; // C# tarafındaki isimle uyumlu
    data: T; // Mutlaka T tipinde data gerekli
}

export interface DataTableColumns { // C# tarafındaki isimle uyumlu
    data: string;
    name: string;
    orderable: boolean;
    searchable: boolean;
    search?: DataTableSearch; // Column-level search (opsiyonel)
}

export interface DataTableOrder { // C# tarafındaki isimle uyumlu
    column: number;
    dir: string;
}

export interface DataTableSearch { // C# tarafındaki isimle uyumlu
    regex: boolean;
    value: string;
}

export interface DataTableState {
    page: number;
    pageSize: number;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    search?: string;
    filters: { [key: string]: any };
    selectedRows: any[];
}
