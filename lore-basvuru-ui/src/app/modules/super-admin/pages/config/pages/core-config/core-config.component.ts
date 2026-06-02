import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { FuseConfigService } from '@fuse/services/config';
import { HeaderButtons } from '@fuse/services/config/config.types';

@Component({
    selector: 'app-core-config',
    templateUrl: './core-config.component.html',
    styleUrls: ['./core-config.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatSlideToggleModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatDividerModule,
        MatFormFieldModule,
        MatSelectModule
    ]
})
export class CoreConfigComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    
    headerButtons: HeaderButtons = {
        showLanguages: true,
        showFullscreen: true,
        showSearch: false,
        showShortcuts: false,
        showMessages: false,
        showNotifications: false,
        showQuickChat: false,
        showUser: true
    };

    // Available layouts
    layouts = [
        { value: 'classy', label: 'Classy' },
        { value: 'classic', label: 'Classic' },
        { value: 'compact', label: 'Compact' },
        { value: 'dense', label: 'Dense' },
        { value: 'futuristic', label: 'Futuristic' },
        { value: 'thin', label: 'Thin' },
        { value: 'centered', label: 'Centered' },
        { value: 'enterprise', label: 'Enterprise' },
        { value: 'material', label: 'Material' },
        { value: 'modern', label: 'Modern' }
    ];

    // Available themes
    themes = [
        { value: 'theme-default', label: 'Default' },
        { value: 'theme-brand', label: 'Brand' },
        { value: 'theme-teal', label: 'Teal' },
        { value: 'theme-rose', label: 'Rose' },
        { value: 'theme-purple', label: 'Purple' },
        { value: 'theme-amber', label: 'Amber' }
    ];

    // Available schemes
    schemes = [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'auto', label: 'Auto' }
    ];

    currentLayout: string = 'classy';
    currentTheme: string = 'theme-default';
    currentScheme: string = 'light';

    constructor(private _fuseConfigService: FuseConfigService) {}

    ngOnInit(): void {
        // Subscribe to config changes
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config) => {
                if (config.fuse?.headerButtons) {
                    this.headerButtons = { ...config.fuse.headerButtons };
                }
                if (config.fuse?.layout) {
                    this.currentLayout = config.fuse.layout;
                }
                if (config.fuse?.theme) {
                    this.currentTheme = config.fuse.theme;
                }
                if (config.fuse?.scheme) {
                    this.currentScheme = config.fuse.scheme;
                }
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    /**
     * Toggle header button
     */
    toggleHeaderButton(buttonName: keyof HeaderButtons): void {
        this.headerButtons[buttonName] = !this.headerButtons[buttonName];
        this._updateConfig();
    }

    /**
     * Change layout
     */
    changeLayout(layout: string): void {
        this.currentLayout = layout;
        this._fuseConfigService.config = {
            layout: layout
        };
    }

    /**
     * Change theme
     */
    changeTheme(theme: string): void {
        this.currentTheme = theme;
        this._fuseConfigService.config = {
            theme: theme
        };
    }

    /**
     * Change scheme
     */
    changeScheme(scheme: string): void {
        this.currentScheme = scheme;
        this._fuseConfigService.config = {
            scheme: scheme
        };
    }

    /**
     * Reset to defaults
     */
    resetToDefaults(): void {
        this.headerButtons = {
            showLanguages: true,
            showFullscreen: true,
            showSearch: false,
            showShortcuts: false,
            showMessages: false,
            showNotifications: false,
            showQuickChat: false,
            showUser: true
        };
        this.currentLayout = 'classy';
        this.currentTheme = 'theme-default';
        this.currentScheme = 'light';
        
        this._fuseConfigService.config = {
            layout: this.currentLayout,
            theme: this.currentTheme,
            scheme: this.currentScheme,
            headerButtons: this.headerButtons
        };
    }

    /**
     * Get active buttons count
     */
    getActiveButtonsCount(): number {
        return Object.values(this.headerButtons).filter(value => value === true).length;
    }

    /**
     * Get total buttons count
     */
    getTotalButtonsCount(): number {
        return Object.keys(this.headerButtons).length;
    }

    /**
     * Update configuration
     */
    private _updateConfig(): void {
        this._fuseConfigService.config = {
            headerButtons: this.headerButtons
        };
    }
}
