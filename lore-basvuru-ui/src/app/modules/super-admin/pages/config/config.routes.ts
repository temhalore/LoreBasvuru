import { Routes } from '@angular/router';
import { IsAuthGuard } from '../../../../base/security/auth.guard';

const routes: Routes = [
    { path: '', redirectTo: 'core-config', pathMatch: 'full' },
    {
        path: 'core-config',
        loadComponent: () => import('./pages/core-config/core-config.component').then(m => m.CoreConfigComponent),
        canActivate: [IsAuthGuard],
        data: { 
            pathData: "/sys/admin/config/core-config", 
            breadcrumb: 'Core Configuration' 
        }
    }
];

export default routes;
