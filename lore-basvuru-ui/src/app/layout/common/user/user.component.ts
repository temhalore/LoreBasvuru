import { BooleanInput } from '@angular/cdk/coercion';
import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { LoginRequestModel } from 'app/base/models/security/auth/login-request.model';
import { LoginResponseModel } from 'app/base/models/security/auth/login-response.model';
import { KisiModel } from 'app/base/models/security/user/kisi.model';
import { AuthService } from 'app/base/services/auth.service';
import { User } from 'app/core/user/user.types';
import { Subject, takeUntil } from 'rxjs';
import { FuseConfig, FuseConfigService } from '@fuse/services/config';
// import { FuseConfig } from '@fuse/services/config';

@Component({
    selector: 'user',
    templateUrl: './user.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'user',
    imports: [
        MatButtonModule,
        MatMenuModule,
        MatIconModule,
        NgClass,
        MatDividerModule,
    ],
})
export class UserComponent implements OnInit, OnDestroy {
    /* eslint-disable @typescript-eslint/naming-convention */
    static ngAcceptInputType_showAvatar: BooleanInput;
    /* eslint-enable @typescript-eslint/naming-convention */

@Input() showAvatar: boolean = true;
user!: KisiModel;
config?: FuseConfig;
private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        // private _userService: UserSrvice
                private _authService: AuthService,
                private _fuseConfigService: FuseConfigService,

    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to user changes
        this._authService.currentUser$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((loginResponse: LoginResponseModel) => {
                this.user = loginResponse.kisiTokenDto.kisiDto;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

            // Subscribe to config changes
                    this._fuseConfigService.config$
                        .pipe(takeUntil(this._unsubscribeAll))
                        .subscribe((config: FuseConfig) => {
                            // Store the config
                            this.config = config;
                        });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Update the user status
     *
     * @param status
     */
    updateUserStatus(status: string): void {
        // Return if user is not available
        if (!this.user) {
            return;
        }

        // Update the user
        // this._authService
        //     .update({
        //         ...this.user,
        //         status,
        //     })
        //     .subscribe();
    }

    /**
     * Sign out
     */
    signOut(): void {
        this._authService.Logout();
    }

    openUsageGuide(): void {
        const usageGuideUrl = this._router.serializeUrl(
            this._router.createUrlTree(['/kullanim-kilavuzu']),
        );

        window.open(usageGuideUrl, '_blank', 'noopener,noreferrer');
    }
}
