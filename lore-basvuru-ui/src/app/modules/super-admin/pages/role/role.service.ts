import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { RoleModel } from 'app/base/models/security/role/role.model';
import { HttpService } from 'app/base/services/http.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';

@Injectable({ providedIn: 'root' })
export class RoleService {
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  constructor(
    private sweetAlertService: SweetAlertService,
    private readonly httpService: HttpService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();

  }

  GetList(): Observable<RoleModel[]> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Security/Role/GetList', null).pipe(
      switchMap((res: ServiceResponseModel) => {
        return of((res.data as RoleModel[]))
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  Get(request: RoleModel): Observable<RoleModel> {
    this.isLoadingSubject.next(true);

    return this.httpService.Post('Security/Role/Get', request).pipe(
      switchMap((res: ServiceResponseModel) => {
        return of((res.data as RoleModel))
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  Set(pageDto: RoleModel): Observable<string> {

    this.isLoadingSubject.next(true);
    return this.sweetAlertService.showSave<RoleModel>("Sayfa Bilgileri", pageDto, "Security/Role/Set", "")
      .pipe(
        switchMap((res:ServiceResponseModel) => {


          return of(res.data as string)
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );

  }
  Del(roleDto: RoleModel): Observable<string> {

    this.isLoadingSubject.next(true);
    return this.sweetAlertService.showDelete<RoleModel>(roleDto.name, roleDto, "Security/Role/Del",)
      .pipe(
        switchMap((res:ServiceResponseModel) => {
          return of(res.data as string)
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );

  }
  Add(roleDto: RoleModel): Observable<string> {

    this.isLoadingSubject.next(true);
    return this.sweetAlertService.showSave<RoleModel>(roleDto.name, roleDto, "Security/Role/Add", "")
      .pipe(
        switchMap((res:ServiceResponseModel) => {
          return of(res.data as string)
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );

  }

  // GetModulePermissionList(widgetDto:WidgetModel): Observable<WidgetPermissionModel> {
  //     this.isLoadingSubject.next(true);
  //     return this.httpService.Post('Security/ModulePermission/GetModulePermissionList', widgetDto).pipe(
  //         switchMap((res: ServiceResponseModel) => {
  //             return of((res.data as WidgetPermissionModel))
  //         }),
  //         finalize(() => this.isLoadingSubject.next(false))
  //     );
  // }
  // SetModulePermission(widgetPermissionDto:WidgetPermissionModel): Observable<WidgetPermissionModel> {
  //     this.isLoadingSubject.next(true);
  //     return this.httpService.Post('Security/ModulePermission/SetModulePermission', widgetPermissionDto).pipe(
  //         switchMap((res: ServiceResponseModel) => {
  //             return of((res.data as WidgetPermissionModel))
  //         }),
  //         finalize(() => this.isLoadingSubject.next(false))
  //     );
  // }
}
