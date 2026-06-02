import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormEditorPanelComponent } from './form-editor-panel.component';
import { FormEditorPanelTabConfig, FormEditorPanelTabId } from '../../form-editor-panel.config';

@Component({
    standalone: true,
    imports: [FormEditorPanelComponent],
    template: `
        <app-form-editor-panel
            side="right"
            [tabs]="tabs"
            [activeTabId]="activeTabId"
            [isOpen]="isOpen"
            [contentTemplate]="content"
            [headerActionsTemplate]="actions"
            (tabChange)="tabChanges.push($event)"
            (closePanel)="handleClose()"></app-form-editor-panel>

        <ng-template #actions>
            <button type="button" class="header-action">Action</button>
        </ng-template>

        <ng-template #content let-tab>
            <div class="content">{{ tab.label }}</div>
        </ng-template>
    `,
})
class TestHostComponent {
    isOpen = true;
    activeTabId: FormEditorPanelTabId = 'add';
    closeCount = 0;
    tabChanges: FormEditorPanelTabId[] = [];
    tabs: FormEditorPanelTabConfig[] = [
        {
            id: 'add',
            side: 'right',
            label: 'Ekle',
            icon: 'add',
            group: 'insert',
            visible: true,
            enabled: true,
            implemented: true,
            showInLauncher: true,
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
    ];

    handleClose(): void {
        this.closeCount += 1;
    }
}

describe('FormEditorPanelComponent', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('renders tabs and group separators', () => {
        expect(fixture.nativeElement.querySelectorAll('.editor-panel__tab-btn').length).toBe(2);
        expect(fixture.nativeElement.querySelector('.editor-panel__tab-sep')).not.toBeNull();
    });

    it('emits tab changes for non-active tabs', () => {
        const buttons = fixture.debugElement.queryAll(By.css('.editor-panel__tab-btn'));
        buttons[1].nativeElement.click();

        expect(host.tabChanges).toEqual(['diagnostics']);
    });

    it('lazy mounts the content only while open', () => {
        expect(fixture.nativeElement.querySelector('.content')?.textContent).toContain('Ekle');

        host.isOpen = false;
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.content')).toBeNull();
    });

    it('emits close from the chrome button', () => {
        fixture.debugElement.query(By.css('.editor-panel__close-btn')).nativeElement.click();
        expect(host.closeCount).toBe(1);
    });

    it('renders the header action slot', () => {
        expect(fixture.nativeElement.querySelector('.header-action')?.textContent).toContain('Action');
    });
});
