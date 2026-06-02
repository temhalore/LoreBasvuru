import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { PageModel } from 'app/base/models/security/page/page.model';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { HttpService } from 'app/base/services/http.service';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';

@Injectable({ providedIn: 'root' })
export class PageService {
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  constructor(
    private sweetAlertService: SweetAlertService,
    private readonly httpService: HttpService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();

  }
  Get(request: PageModel): Observable<PageModel> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Security/Page/Get', request).pipe(
      switchMap((res: ServiceResponseModel) => {
        return of((res.data as PageModel))
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  GetList(): Observable<PageModel[]> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Security/Page/GetList', null).pipe(
      switchMap((res: ServiceResponseModel) => {
        return of((res.data as PageModel[]))
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  Add(pageDto: PageModel): Observable<string> {

    this.isLoadingSubject.next(true);
    return this.sweetAlertService.showSave<PageModel>(pageDto.name, pageDto, "Security/Page/Add", "")
      .pipe(
        switchMap((res) => {
          return of(res.data as string)
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );

  }
  Set(pageDto: PageModel): Observable<string> {

    this.isLoadingSubject.next(true);
    return this.sweetAlertService.showSave<PageModel>("Sayfa Bilgileri", pageDto, "Security/Page/Set", "")
      .pipe(
        switchMap((res) => {


          return of(res.data as string)
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );

  }
  Del(pageDto: PageModel): Observable<string> {

    this.isLoadingSubject.next(true);
    return this.sweetAlertService.showDelete<PageModel>(pageDto.name, pageDto, "Security/Page/Del",)
      .pipe(
        switchMap((res) => {
          return of(res.data as string)
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );

  }
  MoveUp(request: PageModel) {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Security/Page/MoveUp', request).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  MoveDown(request: PageModel) {
    return this.httpService.Post('Security/Page/MoveDown', request).pipe(
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
