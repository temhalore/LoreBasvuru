import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, map, Observable, of, Subscription, switchMap, } from 'rxjs';
import { DataTableResponseModel } from 'app/base/models/general/datatable-response.model';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { RoleUserModel } from 'app/base/models/security/role-user/role-user.model';
import { RoleWidgetModel } from 'app/base/models/security/role-widget/role-widget.model';
import { RoleModel } from 'app/base/models/security/role/role.model';
import { HttpService } from 'app/base/services/http.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';

@Injectable({ providedIn: 'root' })
export class RoleUserService {
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  constructor(
    private readonly httpService: HttpService,
    private readonly sweetAlertService: SweetAlertService
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  GetDataTableList(): Observable<RoleModel[]> {
    this.isLoadingSubject.next(true);

    return this.httpService.Post('Security/RoleUser/GetDataTableList', { Value: 0 }).pipe(
      switchMap((res: ServiceResponseModel) => {
        return of((res.data as RoleModel[]))
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  Add(roleUserDto: RoleUserModel): Observable<string> {
    this.isLoadingSubject.next(true);

    return this.sweetAlertService
      .showSave<RoleUserModel>("Seçili Kişiye Rol Eklenecektir", roleUserDto, 'Security/RoleUser/Add', '')
      .pipe(switchMap((res) => {
        return of(res.data as string);
      }),

        finalize(() => this.isLoadingSubject.next(false))
      );
  }
  //  Del(roleUserDto: RoleUserModel): Observable<string> {
  //     this.isLoadingSubject.next(true);
  //     return this.sweetAlertService
  //       .showDelete<RoleUserModel>(" Seçili Rol Kullanıcıdan'", roleUserDto, 'Security/RoleUser/Del')
  //       .pipe(
  //         switchMap((res) => {
  //           return of(res.data as string);
  //         }),
  //         finalize(() => this.isLoadingSubject.next(false))
  //       );
  //   }
  Del(roleUserDto: RoleUserModel): Observable<string> {
    this.isLoadingSubject.next(true);
    const fullName = `${roleUserDto?.userDto?.name ?? ''} ${roleUserDto?.userDto?.lastName ?? ''}`.trim();
    const deleteText = fullName ? `${fullName} adlı kişiye ait rol` : 'Seçili rol-kullanıcı kaydı';

    return this.sweetAlertService.showDelete<RoleUserModel>(deleteText, roleUserDto, "Security/RoleUser/Del")
      .pipe(
        switchMap((res) => {
          const isSuccess = !!res?.isSuccess;
          const dataValue = (res?.data as string | undefined) ?? '';
          const normalized = isSuccess || dataValue === 'success' ? 'success' : dataValue;
          return of(normalized);
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

}
