import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./pages/basvuru-listesi/basvuru-listesi.component').then(m => m.BasvuruListesiComponent),
  },
  {
    path: ':eid',
    loadComponent: () =>
      import('./pages/basvuru-detay/basvuru-detay.component').then(m => m.BasvuruDetayComponent),
  },
] as Routes;
