import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { AuthService } from 'app/base/services/auth.service';
import { PageModel } from 'app/base/models/security/page/page.model';

@Injectable({
    providedIn: 'root'
})
export class DynamicNavigationService {
    private _navigation: BehaviorSubject<FuseNavigationItem[]> = new BehaviorSubject<FuseNavigationItem[]>([]);

    constructor(private authService: AuthService) {
        // AuthService'deki currentUser değişikliklerini dinle
        this.authService.currentUser$.subscribe(loginResponse => {
            const ekranlar = loginResponse?.kisiTokenDto?.ekranDtoList ?? [];
            if (loginResponse?.kisiTokenDto?.isLogin && ekranlar.length > 0) {
                const dynamicNavigation = this.convertToFuseNavigation(ekranlar);
                this._navigation.next(dynamicNavigation);
            } else {
                this._navigation.next([]);
            }
        });
    }

    get navigation$(): Observable<FuseNavigationItem[]> {
        return this._navigation.asObservable();
    }

    get navigation(): FuseNavigationItem[] {
        return this._navigation.value;
    }

    /**
     * PageModel (EkranDTO) listesini FuseNavigationItem listesine dönüştür
     */
    private convertToFuseNavigation(ekranlar: PageModel[]): FuseNavigationItem[] {
        if (!ekranlar || ekranlar.length === 0) return [];
        return ekranlar
            .filter(e => e.aktifMi !== false)
            .sort((a, b) => (a.siraNo ?? 0) - (b.siraNo ?? 0))
            .map(e => this.mapEkranToFuseNavigation(e));
    }

    private mapEkranToFuseNavigation(ekran: PageModel): FuseNavigationItem {
        const hasChildren = ekran.altEkranlar?.length > 0;

        const fuseItem: FuseNavigationItem = {
            id: `ekran-${ekran.eid ?? ekran.kod}`,
            title: ekran.ad || ekran.name || 'Menü',
            type: hasChildren ? 'collapsable' : 'basic',
            icon: this.mapIcon(ekran.ikon),
        };

        const link = ekran.yol || ekran.routerLink;
        if (link && link.trim() !== '') {
            fuseItem.link = link;
            fuseItem.exactMatch = false;
        }

        if (hasChildren) {
            fuseItem.children = ekran.altEkranlar
                .filter(c => c.aktifMi !== false)
                .sort((a, b) => (a.siraNo ?? 0) - (b.siraNo ?? 0))
                .map(c => this.mapEkranToFuseNavigation(c));
        }

        return fuseItem;
    }

    private mapIcon(icon: string): string {
        if (!icon || icon.trim() === '') return 'heroicons_outline:squares-2x2';
        if (icon.includes('heroicons_')) return icon;

        const iconMap: Record<string, string> = {
            'fa-home': 'heroicons_outline:home',
            'fa-user': 'heroicons_outline:user',
            'fa-users': 'heroicons_outline:users',
            'fa-cog': 'heroicons_outline:cog-6-tooth',
            'fa-settings': 'heroicons_outline:cog-6-tooth',
            'fa-menu': 'heroicons_outline:bars-3',
            'fa-page': 'heroicons_outline:document',
            'fa-widget': 'heroicons_outline:squares-2x2',
            'fa-permission': 'heroicons_outline:key',
            'fa-role': 'heroicons_outline:shield-check',
            'fa-lock': 'heroicons_outline:lock-closed',
            'fa-key': 'heroicons_outline:key',
            'fa-admin': 'heroicons_outline:user-circle',
            'fa-dashboard': 'heroicons_outline:chart-pie',
            'fa-list': 'heroicons_outline:list-bullet',
            'fa-edit': 'heroicons_outline:pencil',
            'fa-trash': 'heroicons_outline:trash',
            'fa-plus': 'heroicons_outline:plus',
            'fa-info': 'heroicons_outline:information-circle',
        };

        return iconMap[icon] ?? 'heroicons_outline:squares-2x2';
    }

    refreshNavigation(): void {
        const currentUser = this.authService.currentUserValue;
        const ekranlar = currentUser?.kisiTokenDto?.ekranDtoList ?? [];
        if (currentUser?.kisiTokenDto?.isLogin && ekranlar.length > 0) {
            this._navigation.next(this.convertToFuseNavigation(ekranlar));
        }
    }
}
