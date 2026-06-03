import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable, of, switchMap } from 'rxjs';
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

    /**
     * Ekrana ait widget listesi.
     * GET api/Yetki/EkranWidgetlariniGetir?ekranEid={eid}
     */
    GetListByPageDto(pageDto: PageModel): Observable<WidgetModel[]> {
        this.isLoadingSubject.next(true);
        return this.httpService.Get(`Yetki/EkranWidgetlariniGetir?ekranEid=${pageDto.eid}`).pipe(
            switchMap((res: ServiceResponseModel) => of(res.data as WidgetModel[])),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    Get(request: WidgetModel): Observable<WidgetModel> {
        // Backend'de tekil widget getir endpoint'i yok — mevcut objeyi döndür
        return of(request);
    }

    /**
     * Widget ekle.
     * POST api/Yetki/WidgetKaydet
     */
    Add(widgetDto: WidgetModel): Observable<string> {
        this.isLoadingSubject.next(true);
        return this.sweetAlertService.showSave<WidgetModel>(widgetDto.selector, widgetDto, 'Yetki/WidgetKaydet', '').pipe(
            switchMap((res) => of(res.data as string)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    /**
     * Widget güncelle.
     * POST api/Yetki/WidgetKaydet
     */
    Set(widgetDto: WidgetModel): Observable<string> {
        this.isLoadingSubject.next(true);
        return this.sweetAlertService.showSave<WidgetModel>('Widget Bilgileri', widgetDto, 'Yetki/WidgetKaydet', '').pipe(
            switchMap((res) => of(res.data as string)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    /**
     * Widget sil.
     * DELETE api/Yetki/WidgetSil?eid={eid}
     */
    Del(widgetDto: WidgetModel): Observable<string> {
        this.isLoadingSubject.next(true);
        return this.sweetAlertService.showDeleteByQuery(widgetDto.selector, `Yetki/WidgetSil?eid=${widgetDto.eid}`).pipe(
            switchMap((res) => of(res.data as string)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }
}
