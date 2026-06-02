import { Route } from '@angular/router';
import { initialDataResolver } from 'app/app.resolvers';
import { LayoutComponent } from 'app/layout/layout.component';
import { IsAntiAuthGuard } from './base/security/anti-auth.guard';
import { IsAuthGuard } from './base/security/auth.guard';

export const appRoutes: Route[] = [
  // Varsayılan yönlendirme
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'dashboard' },

  // Auth (giriş sayfası - giriş yapmamış kullanıcılar için)
  {
    path: 'auth',
    loadChildren: () => import('app/modules/auth/auth.routes')
  },

  // Dashboard (ana sayfa)
  {
    path: 'dashboard',
    canActivate: [IsAuthGuard],
    component: LayoutComponent,
    resolve: { initialData: initialDataResolver },
    children: [
      { path: '', loadChildren: () => import('app/modules/dashboard/dashboard.routes') }
    ]
  },

  // Form Builder (form tasarımı - admin)
  {
    path: 'form-builder',
    canActivate: [IsAuthGuard],
    component: LayoutComponent,
    resolve: { initialData: initialDataResolver },
    children: [
      { path: '', loadChildren: () => import('app/modules/form/form.routes') }
    ]
  },

  // Başvurular (kullanıcı başvuruları)
  {
    path: 'basvurular',
    canActivate: [IsAuthGuard],
    component: LayoutComponent,
    resolve: { initialData: initialDataResolver },
    children: [
      { path: '', loadChildren: () => import('app/modules/basvuru/basvuru.routes') }
    ]
  },

  // Admin (yetki yönetimi)
  {
    path: 'admin',
    canActivate: [IsAuthGuard],
    component: LayoutComponent,
    resolve: { initialData: initialDataResolver },
    loadChildren: () => import('app/modules/super-admin/super-admin.routes')
  },
];
