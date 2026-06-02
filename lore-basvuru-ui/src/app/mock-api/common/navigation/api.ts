import { Injectable } from '@angular/core';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { FuseMockApiService } from '@fuse/lib/mock-api';
import {
    compactNavigation,
    defaultNavigation,
    futuristicNavigation,
    horizontalNavigation,
} from 'app/mock-api/common/navigation/data';
import { DynamicNavigationService } from 'app/core/services/navigation.service';
import { cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class NavigationMockApi {
    private readonly _compactNavigation: FuseNavigationItem[] =
        compactNavigation;
    private readonly _defaultNavigation: FuseNavigationItem[] =
        defaultNavigation;
    private readonly _futuristicNavigation: FuseNavigationItem[] =
        futuristicNavigation;
    private readonly _horizontalNavigation: FuseNavigationItem[] =
        horizontalNavigation;

    /**
     * Constructor
     */
    constructor(
        private _fuseMockApiService: FuseMockApiService,
        private dynamicNavigationService: DynamicNavigationService
    ) {
        // Register Mock API handlers
        this.registerHandlers();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
        // -----------------------------------------------------------------------------------------------------
        // @ Navigation - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService.onGet('api/common/navigation').reply(() => {
            
            // AuthManager'daki currentUser'dan dinamik navigation al
            const dynamicNavigation = this.dynamicNavigationService.navigation;

            // Eğer dinamik navigation varsa kullan, yoksa fallback olarak static navigation kullan
            const defaultNav = dynamicNavigation.length > 0 ? dynamicNavigation : this._defaultNavigation;

            // Fill compact navigation children using the dynamic/default navigation
            this._compactNavigation.forEach((compactNavItem) => {
                defaultNav.forEach((defaultNavItem) => {
                    if (defaultNavItem.id === compactNavItem.id) {
                        compactNavItem.children = cloneDeep(
                            defaultNavItem.children
                        );
                    }
                });
            });

            // Fill futuristic navigation children using the dynamic/default navigation
            this._futuristicNavigation.forEach((futuristicNavItem) => {
                defaultNav.forEach((defaultNavItem) => {
                    if (defaultNavItem.id === futuristicNavItem.id) {
                        futuristicNavItem.children = cloneDeep(
                            defaultNavItem.children
                        );
                    }
                });
            });

            // Fill horizontal navigation children using the dynamic/default navigation
            this._horizontalNavigation.forEach((horizontalNavItem) => {
                defaultNav.forEach((defaultNavItem) => {
                    if (defaultNavItem.id === horizontalNavItem.id) {
                        horizontalNavItem.children = cloneDeep(
                            defaultNavItem.children
                        );
                    }
                });
            });

            // Development ortamında navigation debug yap
            if (!window.location.href.includes('production')) {
            }

            // Return the response with dynamic navigation
            return [
                200,
                {
                    compact: cloneDeep(this._compactNavigation),
                    default: cloneDeep(defaultNav),
                    futuristic: cloneDeep(this._futuristicNavigation),
                    horizontal: cloneDeep(this._horizontalNavigation),
                },
            ];
        });
    }
}
