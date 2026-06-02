import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { WidgetPermissionModel } from 'app/base/models/security/widget-permission/widget-permission.model';
import { WidgetModel } from 'app/base/models/security/widget/widget.model';
import { HttpService } from 'app/base/services/http.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';


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


  GetList(widgetDto: WidgetModel): Observable<WidgetPermissionModel> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Security/WidgetPermission/GetList', widgetDto).pipe(
      switchMap((res: ServiceResponseModel) => {
        return of((res.data as WidgetPermissionModel))
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  Set(widgetPermissionDto: WidgetPermissionModel): Observable<WidgetPermissionModel> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Security/WidgetPermission/Set', widgetPermissionDto).pipe(
      switchMap((res: ServiceResponseModel) => {
        return of((res.data as WidgetPermissionModel))
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
}
