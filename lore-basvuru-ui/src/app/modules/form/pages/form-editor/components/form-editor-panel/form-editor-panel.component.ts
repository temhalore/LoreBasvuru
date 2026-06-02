import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FormEditorPanelSide, FormEditorPanelTabConfig, FormEditorPanelTabId } from '../../form-editor-panel.config';

@Component({
    selector: 'app-form-editor-panel',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, MatIconModule],
    templateUrl: './form-editor-panel.component.html',
    styleUrls: ['./form-editor-panel.component.scss'],
})
export class FormEditorPanelComponent {
    @Input() side: FormEditorPanelSide = 'right';
    @Input() tabs: FormEditorPanelTabConfig[] = [];
    @Input() activeTabId: FormEditorPanelTabId | null = null;
    @Input() isOpen = false;
    @Input() contentTemplate: TemplateRef<{ $implicit: FormEditorPanelTabConfig; tab: FormEditorPanelTabConfig }> | null = null;
    @Input() headerActionsTemplate: TemplateRef<{
        $implicit: FormEditorPanelTabConfig | null;
        tab: FormEditorPanelTabConfig | null;
        side: FormEditorPanelSide;
    }> | null = null;

    @Output() readonly tabChange = new EventEmitter<FormEditorPanelTabId>();
    @Output() readonly closePanel = new EventEmitter<void>();

    get activeTab(): FormEditorPanelTabConfig | null {
        return this.tabs.find((tab) => tab.id === this.activeTabId) ?? this.tabs[0] ?? null;
    }

    selectTab(tabId: FormEditorPanelTabId): void {
        const tab = this.tabs.find((candidate) => candidate.id === tabId);
        if (!tab || !tab.enabled || this.activeTab?.id === tabId) {
            return;
        }

        this.tabChange.emit(tabId);
    }

    isTabActive(tabId: FormEditorPanelTabId): boolean {
        return this.activeTab?.id === tabId;
    }

    shouldShowSeparator(index: number): boolean {
        return index > 0 && this.tabs[index - 1].group !== this.tabs[index].group;
    }

    trackByTab(_: number, tab: FormEditorPanelTabConfig): FormEditorPanelTabId {
        return tab.id;
    }
}
