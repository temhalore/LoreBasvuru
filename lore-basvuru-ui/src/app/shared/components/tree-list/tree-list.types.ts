export interface TreeNode {
    data: any;
    expanded?: boolean;
    children?: TreeNode[];
    checked?: boolean;
    partialSelected?: boolean;
}

export interface TreeListConfig {
    title?: string;
    subtitle?: string;
    apiUrl?: string;
    apiParams?: any;
    dataTemplate?: () => any;
    displayFields: TreeDisplayField[];
    searchable?: boolean;
    expandable?: boolean;
    selectable?: boolean;
    checkboxes?: boolean;
    actions?: TreeAction[];
    filters?: TreeFilter[];
    customButtons?: TreeCustomButton[];
    onNodeCheck?: (node: TreeNode, checked: boolean) => void;
}

export interface TreeDisplayField {
    key: string;
    label: string;
    width?: string;
    type?: 'text' | 'icon' | 'boolean' | 'link' | 'custom' | 'checkbox' | 'badge';
    template?: string; // For custom templates
    sortable?: boolean;
    searchable?: boolean;
}

export interface TreeCustomButton {
    label: string;
    icon: string;
    color?: 'primary' | 'warn' | 'accent';
    variant?: 'basic' | 'raised' | 'stroked' | 'flat';
    action: () => void;
    class?: string;
    disabled?: boolean;
    tooltip?: string;
}

export interface TreeAction {
    label: string;
    icon: string;
    color?: 'primary' | 'warn' | 'accent';
    action: (node: TreeNode) => void;
    apiUrl?: string;
    httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    confirmMessage?: string;
    successMessage?: string;
    errorMessage?: string;
    visible?: (node: TreeNode) => boolean;
}

export interface TreeFilter {
    key: string;
    label: string;
    type: 'text' | 'select' | 'boolean' | 'date';
    options?: { value: any; label: string }[];
    placeholder?: string;
}

export interface TreeListState {
    selectedNodes: TreeNode[];
    expandedNodes: Set<any>;
    search: string;
    filters: { [key: string]: any };
}

export interface TreeListResponse {
    data: TreeNode[];
    total?: number;
}
