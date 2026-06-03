import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable, of, switchMap } from 'rxjs';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { RoleModel } from 'app/base/models/security/role/role.model';
import { HttpService } from 'app/base/services/http.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';

@Injectable({ providedIn: 'root' })
export class RoleService {
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
     * Tenant rollerini getir.
     * GET api/Yetki/TenantRolleriniGetir
     */
    GetList(): Observable<RoleModel[]> {
        this.isLoadingSubject.next(true);
        return this.httpService.Get('Yetki/TenantRolleriniGetir').pipe(
            switchMap((res: ServiceResponseModel) => of(res.data as RoleModel[])),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    Get(request: RoleModel): Observable<RoleModel> {
        return this.GetList().pipe(
            switchMap((list) => {
                const found = (list ?? []).find(r => r.eid === request.eid);
                return of(found ?? request);
            })
        );
    }

    /**
     * Rol ekle.
     * POST api/Yetki/RolKaydet
     */
    Add(roleDto: RoleModel): Observable<string> {
        this.isLoadingSubject.next(true);
        return this.sweetAlertService.showSave<RoleModel>(roleDto.name, roleDto, 'Yetki/RolKaydet', '').pipe(
            switchMap((res: ServiceResponseModel) => of(res.data as string)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    /**
     * Rol güncelle.
     * POST api/Yetki/RolKaydet
     */
    Set(roleDto: RoleModel): Observable<string> {
        this.isLoadingSubject.next(true);
        return this.sweetAlertService.showSave<RoleModel>(roleDto.name, roleDto, 'Yetki/RolKaydet', '').pipe(
            switchMap((res: ServiceResponseModel) => of(res.data as string)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    /**
     * Rol sil.
     * DELETE api/Yetki/RolSil?eid={eid}
     */
    Del(roleDto: RoleModel): Observable<string> {
        this.isLoadingSubject.next(true);
        return this.sweetAlertService.showDeleteByQuery(roleDto.name, `Yetki/RolSil?eid=${roleDto.eid}`).pipe(
            switchMap((res: ServiceResponseModel) => of(res.data as string)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }
}
