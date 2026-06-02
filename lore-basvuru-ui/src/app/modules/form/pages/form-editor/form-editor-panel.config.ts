export type FormEditorPanelSide = 'left' | 'right';

export type FormEditorRightPanelTabId =
    | 'add'
    | 'library'
    | 'general'
    | 'validation'
    | 'view'
    | 'conditions'
    | 'advanced'
    | 'diagnostics'
    | 'effects';

export type FormEditorPanelTabId = 'structure' | FormEditorRightPanelTabId;

export interface FormEditorPanelLauncherConfig {
    id: FormEditorPanelTabId;
    side: FormEditorPanelSide;
    label: string;
    icon: string;
}

export type FormEditorPanelTabGroup = 'navigation' | 'insert' | 'context' | 'quality';

export interface FormEditorPanelTabConfig {
    id: FormEditorPanelTabId;
    side: FormEditorPanelSide;
    label: string;
    icon: string;
    group: FormEditorPanelTabGroup;
    visible: boolean;
    enabled: boolean;
    implemented: boolean;
    showInLauncher: boolean;
    placeholder?: string;
}

export const FORM_EDITOR_PANEL_TABS: FormEditorPanelTabConfig[] = [
    {
        id: 'structure',
        side: 'left',
        label: 'Yapi',
        icon: 'account_tree',
        group: 'navigation',
        visible: true,
        enabled: true,
        implemented: true,
        showInLauncher: true,
    },
    {
        id: 'add',
        side: 'right',
        label: 'Ekle',
        icon: 'add_box',
        group: 'insert',
        visible: true,
        enabled: true,
        implemented: true,
        showInLauncher: true,
    },
    {
        id: 'library',
        side: 'right',
        label: 'Kutuphane',
        icon: 'collections_bookmark',
        group: 'insert',
        visible: true,
        enabled: true,
        implemented: false,
        showInLauncher: true,
        placeholder: 'Soru sablon kutuphanesi gelistirme asamasinda.',
    },
    {
        id: 'general',
        side: 'right',
        label: 'Genel',
        icon: 'tune',
        group: 'context',
        visible: false,
        enabled: false,
        implemented: false,
        showInLauncher: false,
        placeholder: 'Genel alan ayarlari sonraki iterasyonda acilacak.',
    },
    {
        id: 'validation',
        side: 'right',
        label: 'Dogrulama',
        icon: 'rule',
        group: 'context',
        visible: false,
        enabled: false,
        implemented: false,
        showInLauncher: false,
        placeholder: 'Alan bazli dogrulama paneli sonraki iterasyonda acilacak.',
    },
    {
        id: 'view',
        side: 'right',
        label: 'Gorunum',
        icon: 'visibility',
        group: 'context',
        visible: false,
        enabled: false,
        implemented: false,
        showInLauncher: false,
        placeholder: 'Gorunum ayarlari sonraki iterasyonda acilacak.',
    },
    {
        id: 'conditions',
        side: 'right',
        label: 'Kosullar',
        icon: 'filter_alt',
        group: 'context',
        visible: true,
        enabled: true,
        implemented: false,
        showInLauncher: true,
        placeholder: 'Kural ve kosul editoru gelistirme asamasinda.',
    },
    {
        id: 'advanced',
        side: 'right',
        label: 'Gelismis',
        icon: 'settings',
        group: 'context',
        visible: false,
        enabled: false,
        implemented: false,
        showInLauncher: false,
        placeholder: 'Gelismis ayarlar sonraki iterasyonda acilacak.',
    },
    {
        id: 'diagnostics',
        side: 'right',
        label: 'Tanilar',
        icon: 'bug_report',
        group: 'quality',
        visible: true,
        enabled: true,
        implemented: true,
        showInLauncher: true,
    },
    {
        id: 'effects',
        side: 'right',
        label: 'Etkiler',
        icon: 'bolt',
        group: 'quality',
        visible: false,
        enabled: false,
        implemented: false,
        showInLauncher: false,
        placeholder: 'Kural etkileri ve bagimlilik grafigi sonraki fazda eklenecek.',
    },
];

export function getTabs(side: FormEditorPanelSide): FormEditorPanelTabConfig[] {
    return FORM_EDITOR_PANEL_TABS.filter((tab) => tab.side === side && tab.visible);
}

export function getLauncherTabs(side?: FormEditorPanelSide): FormEditorPanelLauncherConfig[] {
    return FORM_EDITOR_PANEL_TABS
        .filter((tab) => tab.visible && tab.showInLauncher && (!side || tab.side === side))
        .map((tab) => ({
            id: tab.id,
            side: tab.side,
            label: tab.label,
            icon: tab.icon,
        }));
}

export function findTab(tabId: FormEditorPanelTabId): FormEditorPanelTabConfig | null {
    return FORM_EDITOR_PANEL_TABS.find((tab) => tab.id === tabId) ?? null;
}

export function defaultTab(side: FormEditorPanelSide): FormEditorPanelTabId {
    return getTabs(side).find((tab) => tab.enabled)?.id ?? getTabs(side)[0]?.id ?? 'structure';
}
