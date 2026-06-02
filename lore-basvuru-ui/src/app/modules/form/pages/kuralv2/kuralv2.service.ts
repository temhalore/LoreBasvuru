import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable, of, shareReplay, switchMap } from 'rxjs';
import { KuralEditorConfigModel, KuralV2TopluKaydetReqModel, ReqKuralV2Model, ResKuralV2Model } from 'app/base/models/form/kuralV2';
import { EidModel } from 'app/base/models/general/eid.model';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { HttpService } from 'app/base/services/http.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';

@Injectable({ providedIn: 'root' })
export class KuralV2Service {
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  // Editor config servis ömrü boyunca tek seferlik fetch; sayfa reload'da yeniden çekilir.
  private editorConfig$?: Observable<KuralEditorConfigModel>;

  constructor(
    private readonly sweetAlertService: SweetAlertService,
    private readonly httpService: HttpService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  Get(request: EidModel): Observable<ResKuralV2Model> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Form/KuralV2/Get', request).pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as ResKuralV2Model)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  GetList(): Observable<ResKuralV2Model[]> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Form/KuralV2/GetList', null).pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as ResKuralV2Model[])),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  GetByFormKokId(request: EidModel): Observable<ResKuralV2Model[]> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Form/KuralV2/GetByFormKokId', request).pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as ResKuralV2Model[])),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  GetBySoruKokId(request: EidModel): Observable<ResKuralV2Model[]> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Form/KuralV2/GetBySoruKokId', request).pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as ResKuralV2Model[])),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Soru bazlı tüm V2 kuralları (aktif + pasif, her tipte) döner.
   * Editor pasif kuralları da görebilmek için bunu kullanır.
   */
  GetTumKurallarBySoruKokId(request: EidModel): Observable<ResKuralV2Model[]> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Form/KuralV2/GetTumKurallarBySoruKokId', request).pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as ResKuralV2Model[])),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Form bazlı tüm V2 kuralları (aktif + pasif, her tipte) döner.
   */
  GetTumKurallarByFormKokId(request: EidModel): Observable<ResKuralV2Model[]> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Form/KuralV2/GetTumKurallarByFormKokId', request).pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as ResKuralV2Model[])),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Soru bazlı VALIDASYON tipindeki tüm V2 kuralları (aktif + pasif) döner.
   * Inline validation editor'ün ana endpoint'i — client-side tip filtresine gerek bırakmaz.
   */
  GetValidasyonBySoruKokId(request: EidModel): Observable<ResKuralV2Model[]> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Form/KuralV2/GetValidasyonBySoruKokId', request).pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as ResKuralV2Model[])),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * KuralV2 editorunun soru tipine göre render/validasyon config'ini döner (backend tek kaynak).
   * shareReplay(1) ile servis ömrü boyunca tek fetch; tüm tüketiciler aynı snapshot'ı paylaşır.
   */
  GetKuralEditorConfig(): Observable<KuralEditorConfigModel> {
    if (!this.editorConfig$) {
      this.editorConfig$ = this.httpService.Post('Form/KuralV2/GetKuralEditorConfig', {}).pipe(
        switchMap((res: ServiceResponseModel) => of(res.data as KuralEditorConfigModel)),
        shareReplay(1)
      );
    }
    return this.editorConfig$;
  }

  AddDirect(kuralDto: ReqKuralV2Model): Observable<ResKuralV2Model> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Form/KuralV2/Add', kuralDto).pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as ResKuralV2Model)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  SetDirect(kuralDto: ReqKuralV2Model): Observable<ResKuralV2Model> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Form/KuralV2/Set', kuralDto).pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as ResKuralV2Model)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  DelDirect(request: EidModel): Observable<ServiceResponseModel> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Form/KuralV2/Del', request).pipe(
      switchMap((res: ServiceResponseModel) => of(res)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * V2 kurallarını tek transaction'da toplu upsert + siler (all-or-nothing).
   * Modal onayı açmaz; inline editör tek çağrı için bunu kullanır.
   * Upsert edilen kuralların yetkili listesini döner.
   */
  TopluKaydet(request: KuralV2TopluKaydetReqModel): Observable<ResKuralV2Model[]> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Form/KuralV2/TopluKaydet', request).pipe(
      switchMap((res: ServiceResponseModel) => of((res.data ?? []) as ResKuralV2Model[])),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  Add(kuralDto: ReqKuralV2Model): Observable<ResKuralV2Model> {
    this.isLoadingSubject.next(true);
    const displayName = kuralDto.kuralTipKodDto?.kod ?? 'Kural';
    return this.sweetAlertService.showSave<ReqKuralV2Model>(displayName, kuralDto, 'Form/KuralV2/Add', '').pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as ResKuralV2Model)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  Set(kuralDto: ReqKuralV2Model): Observable<ResKuralV2Model> {
    this.isLoadingSubject.next(true);
    const displayName = kuralDto.kuralTipKodDto?.kod ?? 'Kural';
    return this.sweetAlertService.showSave<ReqKuralV2Model>(displayName, kuralDto, 'Form/KuralV2/Set', '').pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as ResKuralV2Model)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  Del(kuralDto: ResKuralV2Model): Observable<string> {
    this.isLoadingSubject.next(true);
    const displayName = kuralDto.kuralTipKodDto?.kod ?? 'Kural';
    return this.sweetAlertService.showDelete<ResKuralV2Model>(displayName, kuralDto, 'Form/KuralV2/Del').pipe(
      switchMap((res: ServiceResponseModel) => of(res.data as string)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
}
