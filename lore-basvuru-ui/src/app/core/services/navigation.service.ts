import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { AuthService } from 'app/base/services/auth.service';
import { MenuModel, BadgeModel } from 'app/base/models/security/menu/menu.model';

@Injectable({
  providedIn: 'root'
})
export class DynamicNavigationService {
  private _navigation: BehaviorSubject<FuseNavigationItem[]> = new BehaviorSubject<FuseNavigationItem[]>([]);

  constructor(private authService: AuthService) {
    // AuthService'deki currentUser değişikliklerini dinle
    this.authService.currentUser$.subscribe(loginResponse => {
      if (loginResponse?.kisiTokenDto?.isLogin && loginResponse.menuListDto) {
        const dynamicNavigation = this.convertToFuseNavigation(loginResponse.menuListDto);
        this._navigation.next(dynamicNavigation);
      } else {
        this._navigation.next([]);
      }
    });
  }

  /**
   * Navigation observable'ını döndür
   */
  get navigation$(): Observable<FuseNavigationItem[]> {
    return this._navigation.asObservable();
  }

  /**
   * Güncel navigation değerini döndür
   */
  get navigation(): FuseNavigationItem[] {
    return this._navigation.value;
  }

  /**
   * MenuModel listesini FuseNavigationItem listesine dönüştür
   */
  private convertToFuseNavigation(menuItems: MenuModel[]): FuseNavigationItem[] {
    if (!menuItems || menuItems.length === 0) {
      return [];
    }

    // Direkt olarak her item'ı dönüştür (children zaten model içinde var)
    return menuItems.map(item => this.mapMenuItemToFuseNavigation(item));
  }

  /**
   * Tek bir MenuModel'i FuseNavigationItem'e dönüştür
   */
  private mapMenuItemToFuseNavigation(menuItem: MenuModel): FuseNavigationItem {
    const fuseItem: FuseNavigationItem = {
      id: `menu-${menuItem.eid}`,
      title: menuItem.title || 'Menü',
      type: this.getFuseNavigationType(menuItem.type, menuItem.children?.length > 0),
      icon: this.mapIcon(menuItem.icon),
    };

    // Subtitle varsa ekle
    if (menuItem.subtitle && menuItem.subtitle.trim() !== '') {
      fuseItem.subtitle = menuItem.subtitle;
    }

    // Link varsa ekle
    if (menuItem.link && menuItem.link.trim() !== '') {
      fuseItem.link = menuItem.link;
      fuseItem.exactMatch = menuItem.exactMatch || false;
    }

    // Target varsa ekle
    if (menuItem.target) {
      fuseItem.target = menuItem.target as '_blank' | '_self' | '_parent' | '_top' | string;
    }

    // Tooltip varsa ekle
    if (menuItem.tooltip) {
      fuseItem.tooltip = menuItem.tooltip;
    }

    // Disabled durumu
    if (menuItem.disabled) {
      fuseItem.disabled = menuItem.disabled;
    }

    // Badge varsa ekle
    if (menuItem.badge) {
      fuseItem.badge = {
        title: menuItem.badge.title,
        classes: menuItem.badge.classes
      };
    }

    // Alt menüler varsa recursively dönüştür
    if (menuItem.children && menuItem.children.length > 0) {
      fuseItem.children = menuItem.children.map(child => this.mapMenuItemToFuseNavigation(child));
    }

    return fuseItem;
  }

  /**
   * MenuModel type'ını Fuse navigation type'ına dönüştür
   */
  private getFuseNavigationType(type: string, hasChildren: boolean): 'basic' | 'collapsable' | 'group' | 'divider' {
    if (hasChildren) {
      return 'collapsable';
    }

    switch (type?.toLowerCase()) {
      case 'group':
        return 'group';
      case 'divider':
        return 'divider';
      case 'collapsable':
        return 'collapsable';
      default:
        return 'basic';
    }
  }

  /**
   * İkon adını Fuse format'ına dönüştür
   */
  private mapIcon(icon: string): string {
    if (!icon || icon.trim() === '') {
      return 'heroicons_outline:squares-2x2';
    }

    // Eğer zaten heroicons formatında ise direkt kullan
    if (icon.includes('heroicons_')) {
      return icon;
    }

    // FontAwesome iconları heroicons'a dönüştür
    const iconMap: { [key: string]: string } = {
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

    return iconMap[icon] || 'heroicons_outline:squares-2x2';
  }

  /**
   * Navigation'ı yeniden yükle
   */
  refreshNavigation(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser?.kisiTokenDto?.isLogin && currentUser.menuListDto) {
      const dynamicNavigation = this.convertToFuseNavigation(currentUser.menuListDto);
      this._navigation.next(dynamicNavigation);
    }
  }

  /**
   * Development ortamında debug için navigation'ı console'da göster
   */
  debugNavigation(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser?.kisiTokenDto?.isLogin) {
      return;
    }
  }
}
