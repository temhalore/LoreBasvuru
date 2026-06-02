import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { FuseFullscreenComponent } from '@fuse/components/fullscreen';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import {
    FuseNavigationService,
    FuseVerticalNavigationComponent,
} from '@fuse/components/navigation';
import { FuseDrawerService } from '@fuse/components/drawer';
import { FuseConfig, FuseConfigService } from '@fuse/services/config';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { Navigation } from 'app/core/navigation/navigation.types';
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';
import { MessagesComponent } from 'app/layout/common/messages/messages.component';
import { NotificationsComponent } from 'app/layout/common/notifications/notifications.component';
import { QuickChatComponent } from 'app/layout/common/quick-chat/quick-chat.component';
import { SearchComponent } from 'app/layout/common/search/search.component';
import { ShortcutsComponent } from 'app/layout/common/shortcuts/shortcuts.component';
import { UserComponent } from 'app/layout/common/user/user.component';
import { LocalStorageService } from 'app/base/services/local-storage.service';
import { Subject, takeUntil } from 'rxjs';

interface EtikKurulOption {
    id: number;
    eid: string;
    name: string;
    theme: string;
}

@Component({
    selector: 'classic-layout',
    templateUrl: './classic.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [
        `
            .ek-etik-kurul-menu-panel {
                min-width: 280px !important;
                max-width: min(92vw, 560px) !important;
            }

            .ek-etik-kurul-menu-panel .mat-mdc-menu-content {
                padding: 6px !important;
            }

            .ek-etik-kurul-theme-default {
                background: linear-gradient(180deg, #0b1730 0%, #1c3b6d 100%) !important;
                color: #e8f1ff !important;
                box-shadow: inset 0 0 0 1px rgba(147, 197, 253, 0.34);
            }

            .ek-etik-kurul-theme-teal {
                background: linear-gradient(180deg, #062b24 0%, #0f4d3c 100%) !important;
                color: #e7fff8 !important;
                box-shadow: inset 0 0 0 1px rgba(110, 231, 183, 0.35);
            }

            .ek-etik-kurul-theme-brand {
                background: linear-gradient(180deg, #1f1638 0%, #3a2f6b 100%) !important;
                color: #f4f0ff !important;
                box-shadow: inset 0 0 0 1px rgba(196, 181, 253, 0.34);
            }

            .ek-etik-kurul-theme-default,
            .ek-etik-kurul-theme-teal,
            .ek-etik-kurul-theme-brand {
                --mat-menu-item-hover-state-layer-color: transparent !important;
                --mat-menu-item-focus-state-layer-color: transparent !important;
                --mat-menu-item-label-text-color: #ffffff !important;
                --mdc-text-button-label-text-color: #ffffff !important;
            }

            .ek-etik-kurul-theme-default:hover,
            .ek-etik-kurul-theme-default:focus,
            .ek-etik-kurul-theme-default:active,
            .ek-etik-kurul-theme-teal:hover,
            .ek-etik-kurul-theme-teal:focus,
            .ek-etik-kurul-theme-teal:active,
            .ek-etik-kurul-theme-brand:hover,
            .ek-etik-kurul-theme-brand:focus,
            .ek-etik-kurul-theme-brand:active {
                color: #ffffff !important;
                filter: none !important;
                opacity: 1 !important;
            }

            button.ek-etik-kurul-theme-default:hover,
            button.ek-etik-kurul-theme-default:focus,
            button.ek-etik-kurul-theme-default:active {
                background: linear-gradient(180deg, #0b1730 0%, #1c3b6d 100%) !important;
            }

            button.ek-etik-kurul-theme-teal:hover,
            button.ek-etik-kurul-theme-teal:focus,
            button.ek-etik-kurul-theme-teal:active {
                background: linear-gradient(180deg, #062b24 0%, #0f4d3c 100%) !important;
            }

            button.ek-etik-kurul-theme-brand:hover,
            button.ek-etik-kurul-theme-brand:focus,
            button.ek-etik-kurul-theme-brand:active {
                background: linear-gradient(180deg, #1f1638 0%, #3a2f6b 100%) !important;
            }

            .ek-etik-kurul-theme-default .mat-icon,
            .ek-etik-kurul-theme-default .mdc-button__label,
            .ek-etik-kurul-theme-default .mdc-list-item__primary-text,
            .ek-etik-kurul-theme-teal .mat-icon,
            .ek-etik-kurul-theme-teal .mdc-button__label,
            .ek-etik-kurul-theme-teal .mdc-list-item__primary-text,
            .ek-etik-kurul-theme-brand .mat-icon,
            .ek-etik-kurul-theme-brand .mdc-button__label,
            .ek-etik-kurul-theme-brand .mdc-list-item__primary-text {
                color: #ffffff !important;
            }

            .ek-etik-kurul-theme-default .mat-mdc-button-persistent-ripple::before,
            .ek-etik-kurul-theme-teal .mat-mdc-button-persistent-ripple::before,
            .ek-etik-kurul-theme-brand .mat-mdc-button-persistent-ripple::before {
                opacity: 0 !important;
            }

            .ek-etik-kurul-menu-item {
                height: auto !important;
                min-height: 44px !important;
                margin: 0 0 6px 0 !important;
                box-sizing: border-box;
                --mat-menu-item-hover-state-layer-color: transparent !important;
                --mat-menu-item-focus-state-layer-color: transparent !important;
            }

            .ek-etik-kurul-menu-item:last-child {
                margin-bottom: 0 !important;
            }

            .ek-etik-kurul-menu-item.mdc-list-item {
                padding-left: 12px !important;
                padding-right: 12px !important;
            }

            .ek-etik-kurul-menu-item .mdc-list-item__primary-text,
            .ek-etik-kurul-menu-item .mat-mdc-menu-item-text {
                display: block !important;
                width: 100% !important;
                box-sizing: border-box;
                margin: 0 !important;
                color: #ffffff !important;
            }

            .ek-etik-kurul-menu-item span {
                color: #ffffff !important;
            }

            .ek-theme-logo {
                transition: filter 180ms ease;
            }

            .ek-theme-logo-default {
                filter: hue-rotate(36deg) saturate(1.55) brightness(0.82) contrast(1.08);
            }

            .ek-theme-logo-teal {
                filter: hue-rotate(0deg) saturate(1) brightness(1);
            }

            .ek-theme-logo-brand {
                filter: hue-rotate(95deg) saturate(1.5) brightness(1.02);
            }

            @media (max-width: 640px) {
                .ek-etik-kurul-menu-panel {
                    min-width: min(90vw, 340px) !important;
                    max-width: 92vw !important;
                }
            }
        `,
    ],
    imports: [
        FuseLoadingBarComponent,
        FuseVerticalNavigationComponent,
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        LanguagesComponent,
        FuseFullscreenComponent,
        SearchComponent,
        ShortcutsComponent,
        MessagesComponent,
        NotificationsComponent,
        UserComponent,
        RouterOutlet,
        QuickChatComponent,
    ],
})
export class ClassicLayoutComponent implements OnInit, OnDestroy {
    config!: FuseConfig;
    isScreenSmall!: boolean;
    navigation!: Navigation;
    etikKurulOptions: EtikKurulOption[] = [];
    selectedEtikKurulEid: string = '';
    private isOnlyBasvurucuRole: boolean = false;
    private _isRouteRefreshing: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _navigationService: NavigationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        private _fuseConfigService: FuseConfigService,
        private _fuseDrawerService: FuseDrawerService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for current year
     */
    get currentYear(): number {
        return new Date().getFullYear();
    }

    get logoTextLightSrc(): string {
        return this.config?.theme === 'theme-teal'
            ? 'images/logo/logo-text.svg'
            : 'images/logo/logo-text-default.svg';
    }

    get logoTextDarkSrc(): string {
        return this.config?.theme === 'theme-teal'
            ? 'images/logo/logo-text-on-dark.svg'
            : 'images/logo/logo-text-on-dark-default.svg';
    }

    get logoThemeClass(): string {
        switch (this.config?.theme) {
            case 'theme-brand':
                return 'ek-theme-logo-brand';
            case 'theme-teal':
                return 'ek-theme-logo-teal';
            default:
                return 'ek-theme-logo-default';
        }
    }

    get showEtikKurulSelector(): boolean {
        return !this.isOnlyBasvurucuRole && this.etikKurulOptions.length > 1;
    }

    get selectedEtikKurulDisplayName(): string {
        return (
            this.etikKurulOptions.find((x) => x.eid === this.selectedEtikKurulEid)?.name ??
            'Etik Kurul'
        );
    }

    get selectedEtikKurulShortName(): string {
        const name = this.etikKurulOptions.find((x) => x.eid === this.selectedEtikKurulEid)?.name ?? 'Etik Kurul';
        return name.length > 22 ? name.slice(0, 22) + '…' : name;
    }

    get selectedEtikKurulThemeClass(): string {
        const selected = this.etikKurulOptions.find((x) => x.eid === this.selectedEtikKurulEid);
        return this.resolveThemeClass(selected?.theme ?? 'theme-default');
    }

    get selectedEtikKurulNameLines(): string[] {
        const fallback = 'Etik Kurul';
        const selectedName =
            this.etikKurulOptions.find((x) => x.eid === this.selectedEtikKurulEid)?.name ??
            fallback;

        return this.splitNameToLines(selectedName);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.initializeEtikKurulContext();

        // Subscribe to config changes
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: FuseConfig) => {
                // Store the config
                this.config = config;
            });

        // Subscribe to navigation data
        this._navigationService.navigation$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation: Navigation) => {
                this.navigation = navigation;
            });

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                // Check if the screen is small
                this.isScreenSmall = !matchingAliases.includes('md');
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle navigation
     *
     * @param name
     */
    toggleNavigation(name: string): void {
        // Get the navigation
        const navigation =
            this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(
                name
            );

        if (navigation) {
            // Toggle the opened status
            navigation.toggle();
        }
    }
    toggleSettings(): void {
        this._fuseDrawerService.getComponent('settingsDrawer')?.toggle();
    }

    onEtikKurulChange(option: EtikKurulOption): void {
        if (!option?.eid || option.eid === this.selectedEtikKurulEid) {
            return;
        }

        this.selectedEtikKurulEid = option.eid;
        this.applyEtikKurulContext();
        this.refreshRouteForEtikKurulChange();
    }

    trackByEtikKurul(_index: number, item: EtikKurulOption): string {
        return item.eid;
    }

    private refreshRouteForEtikKurulChange(): void {
        const currentUrl = this._router.url?.toLowerCase() ?? '';

        // Başvurucu form doldurma/önizleme ekranındayken etik kurul değişirse
        // kullanıcı deneyimi için doğrudan "Başvurularım" ekranına dön.
        if (
            currentUrl.startsWith('/form/session/') ||
            currentUrl.startsWith('/form/session-preview/')
        ) {
            void this._router.navigate(['/application-operations/my-applications']);
            return;
        }

        // Başvuru detay ekranında etik kurul değiştiyse, farklı kurulun detayı açık kalmasın.
        if (currentUrl.startsWith('/application-operations/detail/')) {
            void this._router.navigate(['/application-operations/applications']);
            return;
        }

        this.refreshCurrentRoute();
    }

    private refreshCurrentRoute(): void {
        if (this._isRouteRefreshing) {
            return;
        }

        this._isRouteRefreshing = true;

        const currentUrl = this._router.url;
        const previousShouldReuseRoute =
            this._router.routeReuseStrategy.shouldReuseRoute;
        const previousOnSameUrlNavigation = (this._router as any).onSameUrlNavigation;

        this._router.routeReuseStrategy.shouldReuseRoute = () => false;
        (this._router as any).onSameUrlNavigation = 'reload';

        this._router
            .navigateByUrl(currentUrl)
            .finally(() => {
                this._router.routeReuseStrategy.shouldReuseRoute =
                    previousShouldReuseRoute;
                (this._router as any).onSameUrlNavigation = previousOnSameUrlNavigation;
                this._isRouteRefreshing = false;
            });
    }

    private initializeEtikKurulContext(): void {
        const currentUser = LocalStorageService.getDecodedLocalStorageObject();
        const roleList = currentUser?.kisiTokenDto?.kisiDto?.etikKurulRoleListDto ?? [];
        const userTypes = currentUser?.kisiTokenDto?.userTypes ?? [];

        this.isOnlyBasvurucuRole = this.resolveOnlyBasvurucuRole(roleList, userTypes);

        const seen = new Set<string>();
        this.etikKurulOptions = roleList
            .map((role) => {
                const id = Number(role?.etikKurulDto?.id ?? 0);
                const eid = role?.etikKurulDto?.eid ?? '';
                const name = role?.etikKurulDto?.name ?? '';
                if (!eid || !name || seen.has(eid)) {
                    return null;
                }

                seen.add(eid);
                return {
                    id,
                    eid,
                    name,
                    theme: this.resolveThemeByEtikKurulName(name),
                } as EtikKurulOption;
            })
            .filter((x): x is EtikKurulOption => !!x);

        const savedSelection = LocalStorageService.getSelectedEtikKurulEid();
        const savedOption = this.etikKurulOptions.find((x) => x.eid === savedSelection);
        const initialOption = savedOption ?? this.etikKurulOptions[0];

        this.selectedEtikKurulEid = initialOption?.eid ?? '';

        this.applyEtikKurulContext();
    }

    private resolveOnlyBasvurucuRole(roleList: any[], userTypes: string[]): boolean {
        const hasBasvurucuRole = roleList.some((x) => !!x?.isBasvurucu);
        const hasNonBasvurucuRole = roleList.some(
            (x) => !!x?.isSekreter || !!x?.isBaskan || !!x?.isRaportor || !!x?.isUye || !!x?.isSuperAdmin
        );

        if (roleList.length > 0) {
            return hasBasvurucuRole && !hasNonBasvurucuRole;
        }

        const normalizedTypes = (userTypes ?? []).map((x) => x?.toLocaleLowerCase('tr-TR') ?? '');
        const hasBasvurucuType = normalizedTypes.some((x) => x.includes('basvur') || x.includes('başvur'));
        const hasNonBasvurucuType = normalizedTypes.some(
            (x) =>
                x.includes('sekreter') ||
                x.includes('baskan') ||
                x.includes('başkan') ||
                x.includes('raportor') ||
                x.includes('raportör') ||
                x.includes('uye') ||
                x.includes('üye') ||
                x.includes('admin')
        );

        return hasBasvurucuType && !hasNonBasvurucuType;
    }

    private applyEtikKurulContext(): void {
        const selectedEtikKurul = this.etikKurulOptions.find(
            (x) => x.eid === this.selectedEtikKurulEid
        );

        LocalStorageService.setSelectedEtikKurulEid(selectedEtikKurul?.eid ?? '');

        const selectedTheme = selectedEtikKurul?.theme ?? 'theme-teal';
        this._fuseConfigService.config = {
            ...this.config,
            theme: selectedTheme,
        };
    }

    private resolveThemeByEtikKurulName(name: string): string {
        const normalizedName = name.toLocaleLowerCase('tr-TR');

        if (normalizedName.includes('hayvan deneyleri yerel etik kurulu')) {
            return 'theme-teal';
        }

        if (normalizedName.includes('sosyal ve beşeri bilimler araştırma etik kurulu')) {
            return 'theme-default';
        }

        if (normalizedName.includes('sucul omurgalı canlı deneyleri yerel etik kurulu')) {
            return 'theme-brand';
        }

        return 'theme-default';
    }

    private splitNameToLines(name: string): string[] {
        const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) {
            return ['Etik Kurul'];
        }

        const maxCharsPerLine = 22;
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const candidate = currentLine ? `${currentLine} ${word}` : word;
            if (candidate.length <= maxCharsPerLine) {
                currentLine = candidate;
                continue;
            }

            if (currentLine) {
                lines.push(currentLine);
            }

            currentLine = word;
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    resolveThemeClass(theme: string): string {
        switch (theme) {
            case 'theme-teal':
                return 'ek-etik-kurul-theme-teal';
            case 'theme-brand':
                return 'ek-etik-kurul-theme-brand';
            default:
                return 'ek-etik-kurul-theme-default';
        }
    }

    getEtikKurulItemClass(item: EtikKurulOption): string {
        const baseClass = this.resolveThemeClass(item.theme);
        if (item.eid === this.selectedEtikKurulEid) {
            return `${baseClass} font-semibold`;
        }

        return `${baseClass} opacity-95`;
    }
}
