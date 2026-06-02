import {
    HTTP_INTERCEPTORS,
    provideHttpClient,
    withInterceptorsFromDi,
} from '@angular/common/http';
import {
    ApplicationConfig,
    ErrorHandler,
    inject,
    isDevMode,
    provideAppInitializer,
} from '@angular/core';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { LuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideFuse } from '@fuse';
import { TranslocoService, provideTransloco } from '@jsverse/transloco';
import { appRoutes } from 'app/app.routes';
import { provideIcons } from 'app/core/icons/icons.provider';

import { firstValueFrom } from 'rxjs';
import { TranslocoHttpLoader } from './core/transloco/transloco.http-loader';
import { GlobalErrorHandler } from './core/error-handler/global-error-handler';
import { AuthInterceptor } from './base/interceptors/auth-interceptor';
import { ErrorInterceptor } from './base/interceptors/error-interceptor';
import { NullInterceptor } from './base/interceptors/null-interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideAnimations(),
        provideHttpClient(withInterceptorsFromDi()),
        provideRouter(
            appRoutes,
            withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
        ),

        // Hash Location Strategy (IIS uyumlu)
        // { provide: LocationStrategy, useClass: HashLocationStrategy },

        // Global Error Handler
        { provide: ErrorHandler, useClass: GlobalErrorHandler },

        // HTTP Interceptors
        { provide: HTTP_INTERCEPTORS, useClass: NullInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorInterceptor,
            multi: true,
        },

        // Material Date Adapter
        {
            provide: DateAdapter,
            useClass: LuxonDateAdapter,
        },
        {
            provide: MAT_DATE_FORMATS,
            useValue: {
                parse: {
                    dateInput: 'dd/LL/yyyy',
                },
                display: {
                    dateInput: 'dd/LL/yyyy',
                    monthYearLabel: 'LLL yyyy',
                    dateA11yLabel: 'DD',
                    monthYearA11yLabel: 'LLLL yyyy',
                },
            },
        },

        // Transloco Config
        provideTransloco({
            config: {
                availableLangs: [
                    // {
                    //     id: 'en',
                    //     label: 'English',
                    // },
                    {
                        id: 'tr',
                        label: 'Turkish',
                    },
                ],
                defaultLang: 'tr',
                fallbackLang: 'tr',
                reRenderOnLangChange: true,
                prodMode: !isDevMode(),
            },
            loader: TranslocoHttpLoader,
        }),
        provideAppInitializer(() => {
            const translocoService = inject(TranslocoService);
            const defaultLang = translocoService.getDefaultLang();
            translocoService.setActiveLang(defaultLang);

            return firstValueFrom(translocoService.load(defaultLang));
        }),

        // Fuse
        // provideAuth(),
        provideIcons(),
        provideFuse({
            fuse: {
                layout: 'modern',
                scheme: 'light',
                screens: {
                    sm: '600px',
                    md: '960px',
                    lg: '1280px',
                    xl: '1440px',
                },
                theme: 'theme-teal',
                themes: [
                    {
                        id: 'theme-default',
                        name: 'Default',
                    },
                    {
                        id: 'theme-brand',
                        name: 'Brand',
                    },
                    {
                        id: 'theme-teal',
                        name: 'Teal',
                    },
                    {
                        id: 'theme-rose',
                        name: 'Rose',
                    },
                    {
                        id: 'theme-purple',
                        name: 'Purple',
                    },
                    {
                        id: 'theme-amber',
                        name: 'Amber',
                    },
                ],
                headerButtons: {
                    showLanguages: true,
                    showFullscreen: true,
                    showSearch: false,
                    showShortcuts: false,
                    showMessages: false,
                    showNotifications: false,
                    showQuickChat: false,
                    showUser: true,
                    showSettings: true,
                    showProfilButton: false,
                },
                settingsConfig: {
                    showTheme: false, // renk seçici ama tam olrak ayarlı değil ondan kapalı kalsın seçilemesin ae
                    showScheme: false, // dark mod falans eçici ama dark modta temada renkler düzgün değil elden geçmesi lazım ondan kapalı ae
                    showLayout: true, // bu düzgün çalışır 
                    showHeaderButtons: false, // headar ayarları için ksımı kullnıcıya bırakılmasın o denle hep false olsun ae
                    buttonPosition: 'header', // 'floating' | 'header' — header: en sağda ikon olarak, floating: kayan kırmızı buton
                },
            },
        }),
    ],
};
