import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable, of, switchMap } from 'rxjs';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { KisiModel } from 'app/base/models/security/user/kisi.model';
import { HttpService } from 'app/base/services/http.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';

export interface KullaniciKaydetReqDTO {
    eid?: string;
    ad: string;
    soyad: string;
    email: string;
    telefon?: string;
    kullaniciAdi: string;
    parola?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
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
     * Kullanıcı listesini getir.
     * GET api/Tenant/KullaniciListesiGetir
     */
    GetUserList(): Observable<KisiModel[]> {
        this.isLoadingSubject.next(true);
        return this.httpService.Get('Tenant/KullaniciListesiGetir').pipe(
            switchMap((res: ServiceResponseModel) => of(res.data as KisiModel[])),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    GetList(request?: any): Observable<KisiModel[]> {
        return this.GetUserList();
    }

    /**
     * Kullanıcı ekle / güncelle.
     * POST api/Tenant/KullaniciKaydet
     */
    Add(userDto: KisiModel): Observable<string> {
        this.isLoadingSubject.next(true);
        const payload: KullaniciKaydetReqDTO = {
            eid: userDto.eid,
            ad: userDto.ad ?? userDto.name ?? '',
            soyad: userDto.soyad ?? userDto.lastName ?? '',
            email: userDto.email ?? '',
            telefon: userDto.telefon,
            kullaniciAdi: userDto.email ?? '',
        };
        return this.sweetAlertService.showSave<KullaniciKaydetReqDTO>(
            userDto.adSoyad || userDto.name || 'Kullanıcı',
            payload,
            'Tenant/KullaniciKaydet',
            ''
        ).pipe(
            switchMap((res: ServiceResponseModel) => of(res.data as string)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    Set(userDto: KisiModel): Observable<KisiModel> {
        this.isLoadingSubject.next(true);
        const payload: KullaniciKaydetReqDTO = {
            eid: userDto.eid,
            ad: userDto.ad ?? userDto.name ?? '',
            soyad: userDto.soyad ?? userDto.lastName ?? '',
            email: userDto.email ?? '',
            telefon: userDto.telefon,
            kullaniciAdi: userDto.email ?? '',
        };
        return this.sweetAlertService.showSave<KullaniciKaydetReqDTO>(
            'Kullanıcı Bilgileri',
            payload,
            'Tenant/KullaniciKaydet',
            ''
        ).pipe(
            switchMap((res: ServiceResponseModel) => of(res.data as KisiModel)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    /**
     * Kullanıcı sil.
     * DELETE api/Tenant/KullaniciSil?eid={eid}
     */
    Del(userDto: KisiModel): Observable<string> {
        this.isLoadingSubject.next(true);
        return this.sweetAlertService.showDeleteByQuery(
            userDto.adSoyad || userDto.name || 'Kullanıcı',
            `Tenant/KullaniciSil?eid=${userDto.eid}`
        ).pipe(
            switchMap((res: ServiceResponseModel) => of(res.data as string)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }
}
