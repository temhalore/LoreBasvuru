import { Routes } from '@angular/router';
import { IsAuthGuard } from '../../base/security/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'page', pathMatch: 'full' },
  {
    path: 'user',
    loadComponent: () => import('./pages/user/user.component').then(m => m.UserComponent),
    canActivate: [IsAuthGuard],
    data: { pathData: "/sys/admin/user", breadcrumb: 'Kullanıcı İşlemleri' }
  },
  {
    path: 'role',
    loadComponent: () => import('./pages/role/role.component').then(m => m.RoleComponent),
    canActivate: [IsAuthGuard],
    data: { pathData: "/sys/admin/role", breadcrumb: 'admin.role.header' }
  },
  {
    path: 'menu',
    loadComponent: () => import('./pages/menu/menu.component').then(m => m.MenuComponent),
    canActivate: [IsAuthGuard],
    data: { pathData: "/sys/admin/menu", breadcrumb: 'Menü İşlemleri' }
  },
  {
    path: 'page',
    loadComponent: () => import('./pages/page/page.component').then(m => m.PageComponent),
    canActivate: [IsAuthGuard],
    data: { pathData: "/sys/admin/page", breadcrumb: 'Sayfa İşlemleri' }
  },
  {
    path: 'widget',
    loadComponent: () => import('./pages/widget/widget.component').then(m => m.WidgetComponent),
    canActivate: [IsAuthGuard],
    data: { pathData: "/sys/admin/webcomponent", breadcrumb: 'Yetkiler' }
  },
  {
    path: 'widget-permission',
    loadComponent: () => import('./pages/widget-permission/widget-permission.component').then(m => m.WidgetPermissionComponent),
    canActivate: [IsAuthGuard],
    data: { pathData: "/sys/admin/widget-permission", breadcrumb: 'Komponent Yetki İşlemleri' }
  },
  {
    path: 'role-widget',
    loadComponent: () => import('./pages/role-widget/role-widget.component').then(m => m.RoleWidgetComponent),
    canActivate: [IsAuthGuard],
    data: { pathData: "/sys/admin/webcomponent", breadcrumb: 'Komponent & Yetki İşlemleri' }
  },
  {
    path: 'permission',
    loadComponent: () => import('./pages/permission/permission.component').then(m => m.PermissionComponent),
    canActivate: [IsAuthGuard],
    data: { pathData: "/sys/admin/permission", breadcrumb: 'Yetkiler' }
  },
  {
    path: 'role-user',
    loadComponent: () => import('./pages/role-user/role-user.component').then(m => m.RoleUserComponent),
    canActivate: [IsAuthGuard],
    data: { pathData: "/sys/admin/webcomponent", breadcrumb: 'Kullanıcı Yetki Grubu İşlemleri' }
  },
];

export default routes;