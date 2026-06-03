import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable, of, switchMap } from 'rxjs';
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

    /**
     * Tüm ekranları getir.
     * GET api/Yetki/TumEkranlariGetir
     */
    GetList(): Observable<PageModel[]> {
        this.isLoadingSubject.next(true);
        return this.httpService.Get('Yetki/TumEkranlariGetir').pipe(
            switchMap((res: ServiceResponseModel) => of(res.data as PageModel[])),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    /**
     * Tek ekranı getir (liste içinden filtrele).
     */
    Get(request: PageModel): Observable<PageModel> {
        return this.GetList().pipe(
            switchMap((list) => {
                const found = (list ?? []).find(p => p.eid === request.eid);
                return of(found ?? request);
            })
        );
    }

    /**
     * Ekran ekle.
     * POST api/Yetki/EkranKaydet
     */
    Add(pageDto: PageModel): Observable<string> {
        this.isLoadingSubject.next(true);
        return this.sweetAlertService.showSave<PageModel>(pageDto.ad ?? pageDto.name, pageDto, 'Yetki/EkranKaydet', '').pipe(
            switchMap((res) => of(res.data as string)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    /**
     * Ekranı güncelle.
     * POST api/Yetki/EkranKaydet
     */
    Set(pageDto: PageModel): Observable<string> {
        this.isLoadingSubject.next(true);
        return this.sweetAlertService.showSave<PageModel>('Ekran Bilgileri', pageDto, 'Yetki/EkranKaydet', '').pipe(
            switchMap((res) => of(res.data as string)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    /**
     * Ekranı sil.
     * DELETE api/Yetki/EkranSil?eid={eid}
     */
    Del(pageDto: PageModel): Observable<string> {
        this.isLoadingSubject.next(true);
        return this.sweetAlertService.showDeleteByQuery(pageDto.ad ?? pageDto.name, `Yetki/EkranSil?eid=${pageDto.eid}`).pipe(
            switchMap((res) => of(res.data as string)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    /** MoveUp/MoveDown backend'de yok — no-op */
    MoveUp(_request: PageModel) {
        return of(null);
    }

    MoveDown(_request: PageModel) {
        return of(null);
    }
}
