import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable, of, switchMap } from 'rxjs';
import { HttpService } from 'app/base/services/http.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { MenuModel } from 'app/base/models/security/menu/menu.model';

@Injectable({ providedIn: 'root' })
export class MenuService {
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
     * Menü listesi (ekran hiyerarşisi).
     * GET api/Yetki/TumEkranlariGetir
     */
    GetList(): Observable<MenuModel[]> {
        this.isLoadingSubject.next(true);
        return this.httpService.Get('Yetki/TumEkranlariGetir').pipe(
            switchMap((res: ServiceResponseModel) => of(res.data as MenuModel[])),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    /**
     * Menü öğesi ekle.
     * POST api/Yetki/EkranKaydet
     */
    Add(menuDto: MenuModel): Observable<string> {
        this.isLoadingSubject.next(true);
        return this.sweetAlertService.showSave<MenuModel>(menuDto.title, menuDto, 'Yetki/EkranKaydet', '').pipe(
            switchMap((res) => of(res.data as string)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    /**
     * Menü öğesi güncelle.
     * POST api/Yetki/EkranKaydet
     */
    Set(menuDto: MenuModel): Observable<string> {
        this.isLoadingSubject.next(true);
        return this.sweetAlertService.showSave<MenuModel>(menuDto.title, menuDto, 'Yetki/EkranKaydet', '').pipe(
            switchMap((res) => of(res.data as string)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    /**
     * Menü öğesi sil.
     * DELETE api/Yetki/EkranSil?eid={eid}
     */
    Del(menuDto: MenuModel): Observable<string> {
        this.isLoadingSubject.next(true);
        return this.sweetAlertService.showDeleteByQuery(menuDto.title, `Yetki/EkranSil?eid=${(menuDto as any).eid}`).pipe(
            switchMap((res) => of(res.data as string)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    /** Sıralama backend'de yok — no-op */
    MoveUp(_request: MenuModel) { return of(null); }
    MoveDown(_request: MenuModel) { return of(null); }
}
