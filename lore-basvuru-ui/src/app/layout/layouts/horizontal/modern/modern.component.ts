import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { FuseFullscreenComponent } from '@fuse/components/fullscreen';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import {
    FuseHorizontalNavigationComponent,
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
    selector: 'modern-layout',
    templateUrl: './modern.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [`
            .ek-etik-kurul-menu-panel { min-width: 280px !important; max-width: min(92vw, 560px) !important; }
            .ek-etik-kurul-menu-panel .mat-mdc-menu-content { padding: 6px !important; }
            .ek-etik-kurul-theme-default { background: linear-gradient(180deg, #0b1730 0%, #1c3b6d 100%) !important; color: #e8f1ff !important; box-shadow: inset 0 0 0 1px rgba(147, 197, 253, 0.34); }
            .ek-etik-kurul-theme-teal { background: linear-gradient(180deg, #062b24 0%, #0f4d3c 100%) !important; color: #e7fff8 !important; box-shadow: inset 0 0 0 1px rgba(110, 231, 183, 0.35); }
            .ek-etik-kurul-theme-brand { background: linear-gradient(180deg, #1f1638 0%, #3a2f6b 100%) !important; color: #f4f0ff !important; box-shadow: inset 0 0 0 1px rgba(196, 181, 253, 0.34); }
            .ek-etik-kurul-theme-default, .ek-etik-kurul-theme-teal, .ek-etik-kurul-theme-brand { --mat-menu-item-hover-state-layer-color: transparent !important; --mat-menu-item-focus-state-layer-color: transparent !important; --mat-menu-item-label-text-color: #ffffff !important; --mdc-text-button-label-text-color: #ffffff !important; }
            .ek-etik-kurul-theme-default:hover, .ek-etik-kurul-theme-default:focus, .ek-etik-kurul-theme-default:active, .ek-etik-kurul-theme-teal:hover, .ek-etik-kurul-theme-teal:focus, .ek-etik-kurul-theme-teal:active, .ek-etik-kurul-theme-brand:hover, .ek-etik-kurul-theme-brand:focus, .ek-etik-kurul-theme-brand:active { color: #ffffff !important; filter: none !important; opacity: 1 !important; }
            button.ek-etik-kurul-theme-default:hover, button.ek-etik-kurul-theme-default:focus, button.ek-etik-kurul-theme-default:active { background: linear-gradient(180deg, #0b1730 0%, #1c3b6d 100%) !important; }
            button.ek-etik-kurul-theme-teal:hover, button.ek-etik-kurul-theme-teal:focus, button.ek-etik-kurul-theme-teal:active { background: linear-gradient(180deg, #062b24 0%, #0f4d3c 100%) !important; }
            button.ek-etik-kurul-theme-brand:hover, button.ek-etik-kurul-theme-brand:focus, button.ek-etik-kurul-theme-brand:active { background: linear-gradient(180deg, #1f1638 0%, #3a2f6b 100%) !important; }
            .ek-etik-kurul-theme-default .mat-icon, .ek-etik-kurul-theme-default .mdc-button__label, .ek-etik-kurul-theme-default .mdc-list-item__primary-text, .ek-etik-kurul-theme-teal .mat-icon, .ek-etik-kurul-theme-teal .mdc-button__label, .ek-etik-kurul-theme-teal .mdc-list-item__primary-text, .ek-etik-kurul-theme-brand .mat-icon, .ek-etik-kurul-theme-brand .mdc-button__label, .ek-etik-kurul-theme-brand .mdc-list-item__primary-text { color: #ffffff !important; }
            .ek-etik-kurul-theme-default .mat-mdc-button-persistent-ripple::before, .ek-etik-kurul-theme-teal .mat-mdc-button-persistent-ripple::before, .ek-etik-kurul-theme-brand .mat-mdc-button-persistent-ripple::before { opacity: 0 !important; }
            .ek-etik-kurul-menu-item { height: auto !important; min-height: 44px !important; margin: 0 0 6px 0 !important; box-sizing: border-box; --mat-menu-item-hover-state-layer-color: transparent !important; --mat-menu-item-focus-state-layer-color: transparent !important; }
            .ek-etik-kurul-menu-item:last-child { margin-bottom: 0 !important; }
            .ek-etik-kurul-menu-item.mdc-list-item { padding-left: 12px !important; padding-right: 12px !important; }
            .ek-etik-kurul-menu-item .mdc-list-item__primary-text, .ek-etik-kurul-menu-item .mat-mdc-menu-item-text { display: block !important; width: 100% !important; box-sizing: border-box; margin: 0 !important; color: #ffffff !important; }
            .ek-etik-kurul-menu-item span { color: #ffffff !important; }
            .ek-theme-logo { transition: filter 180ms ease; }
            .ek-theme-logo-default { filter: hue-rotate(36deg) saturate(1.55) brightness(0.82) contrast(1.08); }
            .ek-theme-logo-teal { filter: hue-rotate(0deg) saturate(1) brightness(1); }
            .ek-theme-logo-brand { filter: hue-rotate(95deg) saturate(1.5) brightness(1.02); }
            @media (max-width: 640px) { .ek-etik-kurul-menu-panel { min-width: min(90vw, 340px) !important; max-width: 92vw !important; } }
        `],
    imports: [
        FuseLoadingBarComponent,
        FuseVerticalNavigationComponent,
        FuseHorizontalNavigationComponent,
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
export class ModernLayoutComponent implements OnInit, OnDestroy {
    config!: FuseConfig;
    isScreenSmall!: boolean;
    navigation!: Navigation;
    etikKurulOptions: EtikKurulOption[] = [];
    selectedEtikKurulEid: string = '';
    private isOnlyBasvurucuRole: boolean = false;
    private _isRouteRefreshing: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _navigationService: NavigationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        private _fuseConfigService: FuseConfigService,
        private _fuseDrawerService: FuseDrawerService
    ) {}

    get currentYear(): number { return new Date().getFullYear(); }
    get logoThemeClass(): string {
        switch (this.config?.theme) {
            case 'theme-brand': return 'ek-theme-logo-brand';
            case 'theme-teal': return 'ek-theme-logo-teal';
            default: return 'ek-theme-logo-default';
        }
    }
    get showEtikKurulSelector(): boolean { return !this.isOnlyBasvurucuRole && this.etikKurulOptions.length > 1; }
    get selectedEtikKurulDisplayName(): string { return this.etikKurulOptions.find((x) => x.eid === this.selectedEtikKurulEid)?.name ?? 'Etik Kurul'; }
    get selectedEtikKurulThemeClass(): string { return this.resolveThemeClass(this.etikKurulOptions.find((x) => x.eid === this.selectedEtikKurulEid)?.theme ?? 'theme-default'); }
    get selectedEtikKurulNameLines(): string[] { return this.splitNameToLines(this.etikKurulOptions.find((x) => x.eid === this.selectedEtikKurulEid)?.name ?? 'Etik Kurul'); }

    ngOnInit(): void {
        this.initializeEtikKurulContext();
        this._fuseConfigService.config$.pipe(takeUntil(this._unsubscribeAll)).subscribe((config) => { this.config = config; });
        this._navigationService.navigation$.pipe(takeUntil(this._unsubscribeAll)).subscribe((navigation) => { this.navigation = navigation; });
        this._fuseMediaWatcherService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll)).subscribe(({ matchingAliases }) => { this.isScreenSmall = !matchingAliases.includes('md'); });
    }
    ngOnDestroy(): void { this._unsubscribeAll.next(null); this._unsubscribeAll.complete(); }

    toggleNavigation(name: string): void {
        const navigation = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(name);
        if (navigation) { navigation.toggle(); }
    }    toggleSettings(): void {
        this._fuseDrawerService.getComponent('settingsDrawer')?.toggle();
    }    onEtikKurulChange(option: EtikKurulOption): void {
        if (!option?.eid || option.eid === this.selectedEtikKurulEid) return;
        this.selectedEtikKurulEid = option.eid;
        this.applyEtikKurulContext();
        this.refreshRouteForEtikKurulChange();
    }
    trackByEtikKurul(_index: number, item: EtikKurulOption): string { return item.eid; }
    resolveThemeClass(theme: string): string {
        switch (theme) {
            case 'theme-teal': return 'ek-etik-kurul-theme-teal';
            case 'theme-brand': return 'ek-etik-kurul-theme-brand';
            default: return 'ek-etik-kurul-theme-default';
        }
    }
    getEtikKurulItemClass(item: EtikKurulOption): string {
        const baseClass = this.resolveThemeClass(item.theme);
        return item.eid === this.selectedEtikKurulEid ? `${baseClass} font-semibold` : `${baseClass} opacity-95`;
    }
    private refreshRouteForEtikKurulChange(): void {
        const currentUrl = this._router.url?.toLowerCase() ?? '';
        if (currentUrl.startsWith('/form/session/') || currentUrl.startsWith('/form/session-preview/')) { void this._router.navigate(['/application-operations/my-applications']); return; }
        if (currentUrl.startsWith('/application-operations/detail/')) { void this._router.navigate(['/application-operations/applications']); return; }
        this.refreshCurrentRoute();
    }
    private refreshCurrentRoute(): void {
        if (this._isRouteRefreshing) return;
        this._isRouteRefreshing = true;
        const currentUrl = this._router.url;
        const prev = this._router.routeReuseStrategy.shouldReuseRoute;
        const prevSame = (this._router as any).onSameUrlNavigation;
        this._router.routeReuseStrategy.shouldReuseRoute = () => false;
        (this._router as any).onSameUrlNavigation = 'reload';
        this._router.navigateByUrl(currentUrl).finally(() => { this._router.routeReuseStrategy.shouldReuseRoute = prev; (this._router as any).onSameUrlNavigation = prevSame; this._isRouteRefreshing = false; });
    }
    private initializeEtikKurulContext(): void {
        const currentUser = LocalStorageService.getDecodedLocalStorageObject();
        const roleList = currentUser?.kisiTokenDto?.kisiDto?.etikKurulRoleListDto ?? [];
        const userTypes = currentUser?.kisiTokenDto?.userTypes ?? [];
        this.isOnlyBasvurucuRole = this.resolveOnlyBasvurucuRole(roleList, userTypes);
        const seen = new Set<string>();
        this.etikKurulOptions = roleList.map((role) => {
            const id = Number(role?.etikKurulDto?.id ?? 0); const eid = role?.etikKurulDto?.eid ?? ''; const name = role?.etikKurulDto?.name ?? '';
            if (!eid || !name || seen.has(eid)) return null;
            seen.add(eid);
            return { id, eid, name, theme: this.resolveThemeByEtikKurulName(name) } as EtikKurulOption;
        }).filter((x): x is EtikKurulOption => !!x);
        const saved = LocalStorageService.getSelectedEtikKurulEid();
        const initial = this.etikKurulOptions.find((x) => x.eid === saved) ?? this.etikKurulOptions[0];
        this.selectedEtikKurulEid = initial?.eid ?? '';
        this.applyEtikKurulContext();
    }
    private resolveOnlyBasvurucuRole(roleList: any[], userTypes: string[]): boolean {
        const hasB = roleList.some((x) => !!x?.isBasvurucu);
        const hasN = roleList.some((x) => !!x?.isSekreter || !!x?.isBaskan || !!x?.isRaportor || !!x?.isUye || !!x?.isSuperAdmin);
        if (roleList.length > 0) return hasB && !hasN;
        const t = (userTypes ?? []).map((x) => x?.toLocaleLowerCase('tr-TR') ?? '');
        return t.some((x) => x.includes('basvur') || x.includes('başvur')) && !t.some((x) => x.includes('sekreter') || x.includes('baskan') || x.includes('başkan') || x.includes('raportor') || x.includes('raportör') || x.includes('uye') || x.includes('üye') || x.includes('admin'));
    }
    private applyEtikKurulContext(): void {
        const sel = this.etikKurulOptions.find((x) => x.eid === this.selectedEtikKurulEid);
        LocalStorageService.setSelectedEtikKurulEid(sel?.eid ?? '');
        this._fuseConfigService.config = { ...this.config, theme: sel?.theme ?? 'theme-teal' };
    }
    private resolveThemeByEtikKurulName(name: string): string {
        const n = name.toLocaleLowerCase('tr-TR');
        if (n.includes('hayvan deneyleri yerel etik kurulu')) return 'theme-teal';
        if (n.includes('sosyal ve beşeri bilimler araştırma etik kurulu')) return 'theme-default';
        if (n.includes('sucul omurgalı canlı deneyleri yerel etik kurulu')) return 'theme-brand';
        return 'theme-default';
    }
    private splitNameToLines(name: string): string[] {
        const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) return ['Etik Kurul'];
        const max = 22; const lines: string[] = []; let cur = '';
        for (const w of words) { const c = cur ? `${cur} ${w}` : w; if (c.length <= max) { cur = c; continue; } if (cur) lines.push(cur); cur = w; }
        if (cur) lines.push(cur);
        return lines;
    }
}
