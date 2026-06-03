import { Routes } from '@angular/router';
import { IsAuthGuard } from 'app/base/security/auth.guard';

export default [
    {
        path: 'list',
        canActivate: [IsAuthGuard],
        loadComponent: () =>
            import('./pages/form-list/form-list.component').then(
                (m) => m.FormListComponent,
            ),
    },
    {
        path: ':eid/editor',
        canActivate: [IsAuthGuard],
        loadComponent: () =>
            import('./pages/form-editor/form-editor.component').then(
                (m) => m.FormEditorComponent,
            ),
    },
    {
        path: 'kural',
        canActivate: [IsAuthGuard],
        loadComponent: () =>
            import('./pages/kural/kural.component').then(
                (m) => m.KuralComponent,
            ),
    },
    {
        path: 'kuralv2',
        canActivate: [IsAuthGuard],
        loadComponent: () =>
            import('./pages/kuralv2/kuralv2.component').then(
                (m) => m.KuralV2Component,
            ),
    },
    // Başvuruya bağlı form oturumunu aç (kullaniciForm eid ile) — spesifik route, ':formEid'den önce olmalı
    {
        path: 'session/:kullaniciFormEid',
        canActivate: [IsAuthGuard],
        data: { mode: 'session' },
        loadComponent: () =>
            import('./pages/form-respondent/components/form-respondent-shell/form-respondent-shell.component').then(
                (m) => m.FormRespondentShellComponent,
            ),
    },
    // Form önizleme — DB yazılmaz, yalnızca projeksiyon yüklenir
    {
        path: 'preview/:formKokEid',
        canActivate: [IsAuthGuard],
        data: { previewSource: 'draft' },
        loadComponent: () =>
            import('./pages/form-preview/form-preview-screen.component').then(
                (m) => m.FormPreviewScreenComponent,
            ),
    },
    {
        path: 'session-preview/:kullaniciFormEid',
        canActivate: [IsAuthGuard],
        data: { previewSource: 'session' },
        loadComponent: () =>
            import('./pages/form-preview/form-preview-screen.component').then(
                (m) => m.FormPreviewScreenComponent,
            ),
    },
] as Routes;
