import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { HttpService } from './http.service';
import { SweetAlertService } from './sweet-alert.service';
import { ServiceResponseModel } from '../models/general/service-response.model';
import { KodModel } from '../models/common/kod.model';

@Injectable({ providedIn: 'root' })
export class CodeService {
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  constructor(
    private readonly httpService: HttpService,
    private readonly sweetAlertService: SweetAlertService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }
  // admin-code-list
  GetCodeList(request: any): Observable<KodModel[]> {
    let req = { Value: request };
    return this.httpService.Post('Common/Kod/getKodListByKodTipId', req)
      .pipe(
        switchMap((data) => {
          return of((data.data as KodModel[]))
        })
      );
  }

  GetAllCodeList(): Observable<KodModel[]> {
    return this.httpService.Post('Common/Kod/getAllKodDtoList', {})
      .pipe(
        switchMap((data) => of(data.data as KodModel[]))
      );
  }

  RefreshAllCodeList(): Observable<KodModel[]> {
    return this.httpService.Post('Common/Kod/refreshAllKodDtoList', {})
      .pipe(
        switchMap((data) => of(data.data as KodModel[]))
      );
  }

  GetCodeListbyId(request: any): Observable<KodModel[]> {
    let req = { Value: request };
    return this.httpService.Post('Common/Kod/getKodDtoById', req)
      .pipe(
        switchMap((data) => {
          return of((data.data as KodModel[]))
        })
      );
  }
  SaveCode(kodDto: KodModel): Observable<string> {
    this.isLoadingSubject.next(true);
    return this.sweetAlertService.showSave<KodModel>(
      kodDto.kod, kodDto, "Common/Kod/saveKodDtoByKodDto", "")
      .pipe(
        switchMap((res) => of(res.data as string)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  SaveBulkCode(kodList: KodModel[]): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Common/Kod/saveBulkKod', kodList).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  DeleteCode(kodDto: KodModel): Observable<string> {
    this.isLoadingSubject.next(true);
    return this.sweetAlertService.showDelete<KodModel>(
      kodDto.kod, kodDto, "Common/Kod/getDeleteByKodDto")
      .pipe(
        switchMap((res) => of(res.data as string)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

}
