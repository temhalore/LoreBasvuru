/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
    {
        id   : 'dashboard',
        title: 'Ana Sayfa',
        type : 'basic',
        icon : 'heroicons_outline:home',
        link : '/dashboard',
    },
    {
        id      : 'basvurular',
        title   : 'Başvurularım',
        type    : 'basic',
        icon    : 'heroicons_outline:document-text',
        link    : '/basvurular',
    },
    {
        id      : 'form-builder',
        title   : 'Form Yönetimi',
        type    : 'collapsable',
        icon    : 'heroicons_outline:clipboard-document-list',
        children: [
            {
                id   : 'form-builder.listesi',
                title: 'Form Listesi',
                type : 'basic',
                link : '/form-builder',
            },
        ],
    },
    {
        id      : 'admin',
        title   : 'Yönetim',
        type    : 'collapsable',
        icon    : 'heroicons_outline:cog-6-tooth',
        children: [
            {
                id   : 'admin.rol',
                title: 'Rol Yönetimi',
                type : 'basic',
                link : '/admin/role',
            },
            {
                id   : 'admin.ekran',
                title: 'Ekran Yönetimi',
                type : 'basic',
                link : '/admin/page',
            },
            {
                id   : 'admin.widget',
                title: 'Widget Yönetimi',
                type : 'basic',
                link : '/admin/widget',
            },
            {
                id   : 'admin.kullanici',
                title: 'Kullanıcı-Rol',
                type : 'basic',
                link : '/admin/role-user',
            },
        ],
    },
];

export const compactNavigation: FuseNavigationItem[] = defaultNavigation;
export const futuristicNavigation: FuseNavigationItem[] = defaultNavigation;
export const horizontalNavigation: FuseNavigationItem[] = defaultNavigation;
