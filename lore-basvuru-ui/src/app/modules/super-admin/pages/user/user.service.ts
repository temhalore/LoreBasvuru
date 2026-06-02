// import { UserModel } from 'app/base/models/security/user/user.model';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { DataTableResponseModel } from 'app/base/models/general/datatable-response.model';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { KisiModel } from 'app/base/models/security/user/kisi.model';
import { HttpService } from 'app/base/services/http.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  constructor(
    private readonly httpService: HttpService,
    private readonly sweetAlertService: SweetAlertService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();

  }


  // GetDataTableList(request: any): Observable<DataTableResponseModel> {

  //   this.isLoadingSubject.next(true);
  //   return this.httpService
  //     .Post('Security/User/GetDataTableList', request)
  //     .pipe(
  //       switchMap((res: ServiceResponseModel) => {
  //         return of(res.data as DataTableResponseModel);
  //       }),
  //       finalize(() => this.isLoadingSubject.next(false))
  //     );
  // }

  GetUserList(): Observable<  KisiModel[]> {

    this.isLoadingSubject.next(true);

    return this.httpService.Post('Security/User/GetUserList', KisiModel).pipe(
      switchMap((res: ServiceResponseModel) => {
        return of((res.data as KisiModel[]))
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
   GetList(request: any): Observable<DataTableResponseModel> {

    this.isLoadingSubject.next(true);

    return this.httpService.Post('Security/User/GetList', request).pipe(
      switchMap((res: ServiceResponseModel) => {
        return of((res.data as DataTableResponseModel))
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  Add(userDto: KisiModel): Observable<string> {

    this.isLoadingSubject.next(true);
    return this.sweetAlertService.showSave<KisiModel>(userDto.name, userDto, "Security/User/Add", "")
      .pipe(
        switchMap((res:ServiceResponseModel) => {
          return of(res.data as string)
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );

  }
  Set(userDto: KisiModel): Observable<KisiModel> {
    this.isLoadingSubject.next(true);
    return this.sweetAlertService.showSave<KisiModel>("Sayfa Bilgileri", userDto, "Security/User/Set", "")
      .pipe(
        switchMap((res:ServiceResponseModel) => {
          return of(res.data as KisiModel)
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );

  }


  Del(userDto: KisiModel): Observable<string> {

    this.isLoadingSubject.next(true);
    return this.sweetAlertService.showDelete<KisiModel>(userDto.name, userDto, "Security/User/Del",)
      .pipe(
        switchMap((res:ServiceResponseModel) => {
          return of(res.data as string)
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );

  }
}
