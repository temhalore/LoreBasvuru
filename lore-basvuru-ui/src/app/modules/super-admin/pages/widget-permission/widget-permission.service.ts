import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable, of, switchMap } from 'rxjs';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { WidgetModel } from 'app/base/models/security/widget/widget.model';
import { HttpService } from 'app/base/services/http.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';

export interface WidgetMethodBaglaReqDTO {
    widgetId: number;
    methodIds: number[];
}

@Injectable({ providedIn: 'root' })
export class WidgetPermissionService {
    isLoading$: Observable<boolean>;
    isLoadingSubject: BehaviorSubject<boolean>;

    constructor(
        private readonly httpService: HttpService,
        private readonly sweetAlertService: SweetAlertService,
    ) {
        this.isLoadingSubject = new BehaviorSubject<boolean>(false);
        this.isLoading$ = this.isLoadingSubject.asObservable();
    }

    GetList(_widgetDto?: WidgetModel): Observable<any> {
        this.isLoadingSubject.next(true);
        return this.httpService.Get('Yetki/ControllerMethodleriGetir').pipe(
            switchMap((res: ServiceResponseModel) => of(res.data)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    Set(widgetPermissionDto: any): Observable<any> {
        this.isLoadingSubject.next(true);
        const req: WidgetMethodBaglaReqDTO = {
            widgetId: (widgetPermissionDto as any)?.widgetDto?.id ?? 0,
            methodIds: ((widgetPermissionDto as any)?.permissionListDto ?? [])
                .filter((p: any) => p.isWidgetPermission)
                .map((p: any) => p.id ?? 0),
        };
        return this.httpService.Post('Yetki/WidgetControllerMethodBagla', req).pipe(
            switchMap((res: ServiceResponseModel) => of(res.data ?? widgetPermissionDto)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    Tara(): Observable<boolean> {
        this.isLoadingSubject.next(true);
        return this.httpService.Post('Yetki/ControllerMethodleriTara', {}).pipe(
            switchMap((res: ServiceResponseModel) => of(res.isSuccess ?? false)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }
}
