import { Routes } from '@angular/router';
import { AuthComponent } from './auth.component';
import { LogoutComponent } from './components/logout/logout.component';
import { LoginWithTokenComponent } from './components/login-with-token/login-with-token.component';

export default [
  {
    path: '',
    component: AuthComponent,
    children: [
      { path: '', redirectTo: 'giris', pathMatch: 'full' },
      {
        path: 'giris',
        loadComponent: () =>
          import('./components/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'sso-callback',
        component: LoginWithTokenComponent,
        data: { returnUrl: '' },
      },
      {
        path: 'cikis',
        component: LogoutComponent,
      },
    ],
  },
] as Routes;
