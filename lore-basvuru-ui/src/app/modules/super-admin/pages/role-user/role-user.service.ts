import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable, of, switchMap } from 'rxjs';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { RoleUserModel } from 'app/base/models/security/role-user/role-user.model';
import { RoleModel } from 'app/base/models/security/role/role.model';
import { HttpService } from 'app/base/services/http.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';

export interface KullaniciRolReqDTO {
    userId: number;
    rolId: number;
}

@Injectable({ providedIn: 'root' })
export class RoleUserService {
    isLoading$: Observable<boolean>;
    isLoadingSubject: BehaviorSubject<boolean>;

    constructor(
        private readonly httpService: HttpService,
        private readonly sweetAlertService: SweetAlertService
    ) {
        this.isLoadingSubject = new BehaviorSubject<boolean>(false);
        this.isLoading$ = this.isLoadingSubject.asObservable();
    }

    /**
     * Tenant rol listesi (rol-kullanıcı tablosu için).
     * GET api/Yetki/TenantRolleriniGetir
     */
    GetDataTableList(): Observable<RoleModel[]> {
        this.isLoadingSubject.next(true);
        return this.httpService.Get('Yetki/TenantRolleriniGetir').pipe(
            switchMap((res: ServiceResponseModel) => of(res.data as RoleModel[])),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    /**
     * Kullanıcıya rol ata.
     * POST api/Yetki/KullaniciRolAta  body: { userId, rolId }
     */
    Add(roleUserDto: RoleUserModel): Observable<string> {
        this.isLoadingSubject.next(true);
        const req: KullaniciRolReqDTO = {
            userId: (roleUserDto as any)?.userDto?.id ?? 0,
            rolId: (roleUserDto as any)?.roleDto?.id ?? 0,
        };
        return this.sweetAlertService.showSave<KullaniciRolReqDTO>(
            'Seçili Kişiye Rol Eklenecektir',
            req,
            'Yetki/KullaniciRolAta',
            ''
        ).pipe(
            switchMap((res) => of(res.data as string)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    /**
     * Kullanıcıdan rol kaldır.
     * DELETE api/Yetki/KullaniciRolKaldir?userId={id}&rolId={id}
     */
    Del(roleUserDto: RoleUserModel): Observable<string> {
        this.isLoadingSubject.next(true);
        const fullName = `${(roleUserDto as any)?.userDto?.name ?? ''} ${(roleUserDto as any)?.userDto?.lastName ?? ''}`.trim();
        const deleteText = fullName ? `${fullName} adlı kişiye ait rol` : 'Seçili rol-kullanıcı kaydı';
        const userId = (roleUserDto as any)?.userDto?.id ?? 0;
        const rolId = (roleUserDto as any)?.roleDto?.id ?? 0;
        return this.sweetAlertService.showDeleteByQuery(
            deleteText,
            `Yetki/KullaniciRolKaldir?userId=${userId}&rolId=${rolId}`
        ).pipe(
            switchMap((res) => {
                const isSuccess = !!res?.isSuccess;
                const dataValue = (res?.data as string | undefined) ?? '';
                const normalized = isSuccess || dataValue === 'success' ? 'success' : dataValue;
                return of(normalized);
            }),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }
}
