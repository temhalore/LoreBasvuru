import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { PageModel } from 'app/base/models/security/page/page.model';
import { WidgetModel } from 'app/base/models/security/widget/widget.model';
import { HttpService } from 'app/base/services/http.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';

@Injectable({ providedIn: 'root' })
export class WidgetService {
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  constructor(
    private readonly httpService: HttpService,
    private readonly sweetAlertService: SweetAlertService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();

  }
  Get(request: WidgetModel): Observable<WidgetModel> {
    this.isLoadingSubject.next(true);

    return this.httpService.Post('Security/Widget/Get', request).pipe(
      switchMap((res: ServiceResponseModel) => {
        return of((res.data as WidgetModel))
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  GetListByPageDto(pageDto: PageModel): Observable<WidgetModel[]> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Security/Widget/GetListByPageDto', pageDto).pipe(
      switchMap((res: ServiceResponseModel) => {
        return of((res.data as WidgetModel[]))
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  Set(widgetDto: WidgetModel): Observable<string> {

    this.isLoadingSubject.next(true);
    return this.sweetAlertService.showSave<WidgetModel>("Sayfa Bilgileri", widgetDto, "Security/Widget/Set", "")
      .pipe(
        switchMap((res) => {


          return of(res.data as string)
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );

  }
  Del(widgetDto: WidgetModel): Observable<string> {

    this.isLoadingSubject.next(true);
    return this.sweetAlertService.showDelete<WidgetModel>(widgetDto.selector, widgetDto, "Security/Widget/Del",)
      .pipe(
        switchMap((res) => {
          return of(res.data as string)
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );

  }
  Add(widgetDto: WidgetModel): Observable<string> {

    this.isLoadingSubject.next(true);
    return this.sweetAlertService.showSave<WidgetModel>(widgetDto.selector, widgetDto, "Security/Widget/Add", "")
      .pipe(
        switchMap((res) => {
          return of(res.data as string)
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );

  }
}
