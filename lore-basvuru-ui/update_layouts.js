const fs = require('fs');
const path = require('path');

// Remaining layouts to update
const remainingLayouts = [
    'src/app/layout/layouts/vertical/dense',
    'src/app/layout/layouts/vertical/futuristic', 
    'src/app/layout/layouts/vertical/thin',
    'src/app/layout/layouts/horizontal/centered',
    'src/app/layout/layouts/horizontal/enterprise',
    'src/app/layout/layouts/horizontal/material',
    'src/app/layout/layouts/horizontal/modern'
];

function updateLayoutFiles() {
    remainingLayouts.forEach(layoutPath => {
        const tsFile = path.join(layoutPath, path.basename(layoutPath) + '.component.ts');
        const htmlFile = path.join(layoutPath, path.basename(layoutPath) + '.component.html');
        
        console.log(`\nUpdating ${layoutPath}...`);
        
        // Update TypeScript file
        if (fs.existsSync(tsFile)) {
            updateTsFile(tsFile);
        }
        
        // Update HTML file  
        if (fs.existsSync(htmlFile)) {
            updateHtmlFile(htmlFile);
        }
    });
}

function updateTsFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add FuseConfig import
    if (!content.includes('FuseConfig, FuseConfigService')) {
        content = content.replace(
            'import { FuseMediaWatcherService } from \'@fuse/services/media-watcher\';',
            'import { FuseConfig, FuseConfigService } from \'@fuse/services/config\';\nimport { FuseMediaWatcherService } from \'@fuse/services/media-watcher\';'
        );
    }
    
    // Add config property to class
    if (!content.includes('config: FuseConfig;')) {
        content = content.replace(
            /export class \w+LayoutComponent implements OnInit, OnDestroy \{/,
            '$&\n    config: FuseConfig;'
        );
    }
    
    // Add config service to constructor
    if (!content.includes('private _fuseConfigService: FuseConfigService')) {
        content = content.replace(
            /private _fuseNavigationService: FuseNavigationService/,
            '$&,\n        private _fuseConfigService: FuseConfigService'
        );
    }
    
    // Add config subscription to ngOnInit
    if (!content.includes('this._fuseConfigService.config$')) {
        content = content.replace(
            /ngOnInit\(\): void \{/,
            `ngOnInit(): void {
        // Subscribe to config changes
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: FuseConfig) => {
                // Store the config
                this.config = config;
            });
`
        );
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
}

function updateHtmlFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Update header components section
    const headerPattern = /<div class="ml-auto flex items-center space-x-0\.5 pl-2 sm:space-x-2">([\s\S]*?)<\/div>/;
    
    if (headerPattern.test(content) && !content.includes('@if (config?.headerButtons?.showLanguages')) {
        const newHeaderSection = `<div class="ml-auto flex items-center space-x-0.5 pl-2 sm:space-x-2">
            @if (config?.headerButtons?.showLanguages !== false) {
                <languages></languages>
            }
            @if (config?.headerButtons?.showFullscreen !== false) {
                <fuse-fullscreen class="hidden md:block"></fuse-fullscreen>
            }
            @if (config?.headerButtons?.showSearch !== false) {
                <search [appearance]="'bar'"></search>
            }
            @if (config?.headerButtons?.showShortcuts !== false) {
                <shortcuts></shortcuts>
            }
            @if (config?.headerButtons?.showMessages !== false) {
                <messages></messages>
            }
            @if (config?.headerButtons?.showNotifications !== false) {
                <notifications></notifications>
            }
            @if (config?.headerButtons?.showQuickChat !== false) {
                <button
                    class="lg:hidden"
                    mat-icon-button
                    (click)="quickChat.toggle()"
                >
                    <mat-icon
                        [svgIcon]="'heroicons_outline:chat-bubble-left-right'"
                    ></mat-icon>
                </button>
            }
            @if (config?.headerButtons?.showUser !== false) {
                <user></user>
            }
        </div>`;
        
        content = content.replace(headerPattern, newHeaderSection);
    }
    
    // Update quick chat section
    if (content.includes('<quick-chat #quickChat="quickChat"></quick-chat>') && 
        !content.includes('@if (config?.headerButtons?.showQuickChat !== false)')) {
        content = content.replace(
            '<quick-chat #quickChat="quickChat"></quick-chat>',
            `@if (config?.headerButtons?.showQuickChat !== false) {
    <quick-chat #quickChat="quickChat"></quick-chat>
}`
        );
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
}

updateLayoutFiles();
console.log('\nAll layouts updated successfully!');
