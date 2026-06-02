import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DatePipe, NgClass, NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild,
    ViewContainerRef,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { NotificationsService } from 'app/layout/common/notifications/notifications.service';
import { Notification } from 'app/layout/common/notifications/notifications.types';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'notifications',
    standalone: true,
    templateUrl: './notifications.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'notifications',
    imports: [
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        NgClass,
        NgTemplateOutlet,
        RouterLink,
        DatePipe,
    ],
})
export class NotificationsComponent implements OnInit, OnDestroy {
    @ViewChild('notificationsOrigin', { read: ElementRef })
    private _notificationsOrigin?: ElementRef<HTMLElement>;

    @ViewChild('notificationsPanel')
    private _notificationsPanel?: TemplateRef<any>;

    notifications: Notification[] = [];
    unreadCount = 0;
    private _overlayRef: OverlayRef | null = null;
    private readonly _unsubscribeAll = new Subject<void>();

    constructor(
        private readonly _changeDetectorRef: ChangeDetectorRef,
        private readonly _notificationsService: NotificationsService,
        private readonly _overlay: Overlay,
        private readonly _viewContainerRef: ViewContainerRef,
    ) {}

    ngOnInit(): void {
        this._notificationsService.notifications$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((notifications: Notification[]) => {
                this.notifications = notifications ?? [];
                this._calculateUnreadCount();
                this._changeDetectorRef.markForCheck();
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();

        if (this._overlayRef) {
            this._overlayRef.dispose();
            this._overlayRef = null;
        }
    }

    openPanel(): void {
        if (!this._notificationsPanel || !this._notificationsOrigin) {
            return;
        }

        if (!this._overlayRef) {
            this._createOverlay();
        }

        if (!this._overlayRef?.hasAttached()) {
            this._overlayRef?.attach(
                new TemplatePortal(this._notificationsPanel, this._viewContainerRef),
            );
        }
    }

    closePanel(): void {
        if (this._overlayRef?.hasAttached()) {
            this._overlayRef.detach();
        }
    }

    markAllAsRead(): void {
        this._notificationsService.markAllAsRead().subscribe(() => {
            this._calculateUnreadCount();
            this._changeDetectorRef.markForCheck();
        });
    }

    toggleRead(notification: Notification): void {
        notification.read = !notification.read;

        this._notificationsService.update(notification.id, notification).subscribe(() => {
            this._calculateUnreadCount();
            this._changeDetectorRef.markForCheck();
        });
    }

    delete(notification: Notification): void {
        this._notificationsService.delete(notification.id).subscribe(() => {
            this._calculateUnreadCount();
            this._changeDetectorRef.markForCheck();
        });
    }

    trackByFn(index: number, item: Notification): any {
        return item.id ?? index;
    }

    private _createOverlay(): void {
        if (!this._notificationsOrigin) {
            return;
        }

        this._overlayRef = this._overlay.create({
            hasBackdrop: true,
            backdropClass: 'fuse-backdrop-on-mobile',
            scrollStrategy: this._overlay.scrollStrategies.block(),
            positionStrategy: this._overlay
                .position()
                .flexibleConnectedTo(this._notificationsOrigin)
                .withLockedPosition(true)
                .withPush(true)
                .withPositions([
                    {
                        originX: 'start',
                        originY: 'bottom',
                        overlayX: 'start',
                        overlayY: 'top',
                    },
                    {
                        originX: 'start',
                        originY: 'top',
                        overlayX: 'start',
                        overlayY: 'bottom',
                    },
                    {
                        originX: 'end',
                        originY: 'bottom',
                        overlayX: 'end',
                        overlayY: 'top',
                    },
                    {
                        originX: 'end',
                        originY: 'top',
                        overlayX: 'end',
                        overlayY: 'bottom',
                    },
                ]),
        });

        this._overlayRef.backdropClick().subscribe(() => {
            this.closePanel();
        });
    }

    private _calculateUnreadCount(): void {
        this.unreadCount = this.notifications.filter((notification) => !notification.read).length;
    }
}
