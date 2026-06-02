import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { RoleWidgetModel } from 'app/base/models/security/role-widget/role-widget.model';
import { RoleModel } from 'app/base/models/security/role/role.model';
import { HttpService } from 'app/base/services/http.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';

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
  GetRoleWidgetTreeListForAdmin(roleDto:RoleModel): Observable<RoleWidgetModel> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Security/RoleWidget/GetRoleWidgetTreeListForAdmin', roleDto).pipe(
        switchMap((res: ServiceResponseModel) => {

            return of((res.data as RoleWidgetModel))
        }),
        finalize(() => this.isLoadingSubject.next(false))
    );
}


GetList(roleDto:RoleModel): Observable<RoleWidgetModel> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Security/RoleWidget/GetList', roleDto).pipe(
        switchMap((res: ServiceResponseModel) => {
            return of((res.data as RoleWidgetModel))
        }),
        finalize(() => this.isLoadingSubject.next(false))
    );
}
Set(roleWidgetDto:RoleWidgetModel): Observable<RoleWidgetModel> {
  // roleWidgetDto.widgetTreeListDto=[];
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Security/RoleWidget/Set', roleWidgetDto).pipe(
        switchMap((res: ServiceResponseModel) => {
            return of((res.data as RoleWidgetModel))
        }),
        finalize(() => this.isLoadingSubject.next(false))
    );
}
}
