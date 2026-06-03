import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable, of, switchMap } from 'rxjs';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { RoleWidgetModel } from 'app/base/models/security/role-widget/role-widget.model';
import { RoleModel } from 'app/base/models/security/role/role.model';
import { HttpService } from 'app/base/services/http.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';

export interface RolWidgetYetkisiReqDTO {
    rolId: number;
    idler: number[];
}

@Injectable({ providedIn: 'root' })
export class RoleWidgetService {
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
     * Rol-Widget ağacı (backend'de yok — boş döner, UI'da kaldıramazsak yorumla).
     * Yakın eşdeğeri: Yetki/EkranWidgetlariniGetir ile birleşik çekilir.
     */
    GetRoleWidgetTreeListForAdmin(_roleDto: RoleModel): Observable<RoleWidgetModel> {
        // TODO: Backend widget tree endpoint eklendikten sonra burası güncellenmeli
        return of({} as RoleWidgetModel);
    }

    GetList(_roleDto: RoleModel): Observable<RoleWidgetModel> {
        return of({} as RoleWidgetModel);
    }

    /**
     * Role widget yetkisi kaydet.
     * POST api/Yetki/RolWidgetYetkisiKaydet  body: { rolId, idler }
     */
    Set(req: RolWidgetYetkisiReqDTO): Observable<RoleWidgetModel> {
        this.isLoadingSubject.next(true);
        return this.httpService.Post('Yetki/RolWidgetYetkisiKaydet', req).pipe(
            switchMap((res: ServiceResponseModel) => of(res.data as RoleWidgetModel)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }
}
