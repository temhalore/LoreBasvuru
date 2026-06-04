import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable, of, switchMap } from 'rxjs';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { RoleWidgetModel } from 'app/base/models/security/role-widget/role-widget.model';
import { RoleModel } from 'app/base/models/security/role/role.model';
import { HttpService } from 'app/base/services/http.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';

export interface RolWidgetYetkisiReqDTO {
    rolId: number;
    idler: number[];
}

@Injectable({ providedIn: 'root' })
export class RoleWidgetService {
    isLoading$: Observable<boolean>;
    isLoadingSubject: BehaviorSubject<boolean>;

    constructor(
        private readonly httpService: HttpService,
        private readonly sweetAlertService: SweetAlertService,
    ) {
        this.isLoadingSubject = new BehaviorSubject<boolean>(false);
        this.isLoading$ = this.isLoadingSubject.asObservable();
    }

    GetRoleWidgetTreeListForAdmin(_roleDto: RoleModel): Observable<RoleWidgetModel> {
        return of({} as RoleWidgetModel);
    }

    GetList(_roleDto: RoleModel): Observable<RoleWidgetModel> {
        return of({} as RoleWidgetModel);
    }

    Set(roleWidgetDto: RoleWidgetModel): Observable<RoleWidgetModel> {
        this.isLoadingSubject.next(true);
        const widgetId = (roleWidgetDto as any)?.widgetDto?.id ?? 0;
        const req: RolWidgetYetkisiReqDTO = {
            rolId: (roleWidgetDto as any)?.roleDto?.id ?? 0,
            idler: widgetId ? [widgetId] : [],
        };
        return this.httpService.Post('Yetki/RolWidgetYetkisiKaydet', req).pipe(
            switchMap((res: ServiceResponseModel) => of((res.data as RoleWidgetModel) ?? roleWidgetDto)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }
}
