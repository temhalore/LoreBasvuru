import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable, of, switchMap } from 'rxjs';
import { ReqKuralModel, ResKuralModel, ReqKuralTipMapperModel, KuralTipMapperModel } from 'app/base/models/form/kural';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { HttpService } from 'app/base/services/http.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';

@Injectable({ providedIn: 'root' })
export class KuralService {
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  constructor(
    private readonly sweetAlertService: SweetAlertService,
    private readonly httpService: HttpService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  /**
   * Kural detayını getirir
   */
  Get(request: ReqKuralModel): Observable<ResKuralModel> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Form/Kural/Get', request).pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as ResKuralModel)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Tüm kuralları listeler
   */
  GetList(): Observable<ResKuralModel[]> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Form/Kural/GetList', null).pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as ResKuralModel[])),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Form köküne ait aktif kuralları getirir
   */
  GetByFormKokId(formKokId: number): Observable<ResKuralModel[]> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Form/Kural/GetByFormKokId', { formKokId }).pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as ResKuralModel[])),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Soru köküne ait aktif kuralları getirir
   */
  GetBySoruKokId(soruKokId: number): Observable<ResKuralModel[]> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Form/Kural/GetBySoruKokId', { soruKokId }).pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as ResKuralModel[])),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Yeni kural ekler
   */
  Add(kuralDto: ReqKuralModel): Observable<string> {
    this.isLoadingSubject.next(true);
    const displayName = this.getKuralDisplayName(kuralDto);
    return this.sweetAlertService.showSave<ReqKuralModel>(displayName, kuralDto, 'Form/Kural/Add', '').pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as string)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Kural günceller
   */
  Set(kuralDto: ReqKuralModel): Observable<string> {
    this.isLoadingSubject.next(true);
    const displayName = this.getKuralDisplayName(kuralDto);
    return this.sweetAlertService.showSave<ReqKuralModel>(displayName, kuralDto, 'Form/Kural/Set', '').pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as string)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Kural siler
   */
  Del(kuralDto: ResKuralModel): Observable<string> {
    this.isLoadingSubject.next(true);
    const displayName = this.getKuralDisplayNameFromRes(kuralDto);
    return this.sweetAlertService.showDelete<ResKuralModel>(displayName, kuralDto, 'Form/Kural/Del').pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as string)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Kural Model'e göre seçilebilir Kural Tipleri ve alan zorunluluklarını döner
   */
  GetKuralTipMapper(request: ReqKuralTipMapperModel): Observable<KuralTipMapperModel> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Form/Kural/GetKuralTipMapper', request).pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as KuralTipMapperModel)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Kural için görüntüleme adını oluşturur (Request için)
   */
  private getKuralDisplayName(kural: ReqKuralModel): string {
    if (!kural) return 'Kural';
    
    const tip = kural.KuralTipKodDto?.kod || 'Kural';
    const model = kural.KuralModelKodDto?.kod || '';
    
    return model ? `${tip} (${model})` : tip;
  }

  /**
   * Kural için görüntüleme adını oluşturur (Response için)
   */
  private getKuralDisplayNameFromRes(kural: ResKuralModel): string {
    if (!kural) return 'Kural';
    
    const tip = kural.KuralTipKodDto?.kod || 'Kural';
    const model = kural.KuralModelKodDto?.kod || '';
    
    return model ? `${tip} (${model})` : tip;
  }
}
