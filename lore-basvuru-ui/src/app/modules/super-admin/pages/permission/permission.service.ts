import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable, of, switchMap } from 'rxjs';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { HttpService } from 'app/base/services/http.service';

export interface EkranYetkisiReqDTO {
    rolId: number;
    idler: number[];
}

@Injectable({ providedIn: 'root' })
export class PermissionService {
    isLoading$: Observable<boolean>;
    isLoadingSubject: BehaviorSubject<boolean>;

    constructor(
        private readonly httpService: HttpService,
    ) {
        this.isLoadingSubject = new BehaviorSubject<boolean>(false);
        this.isLoading$ = this.isLoadingSubject.asObservable();
    }

    /**
     * Tüm ekranları getir (yetki atama için).
     * GET api/Yetki/TumEkranlariGetir
     */
    GetList(): Observable<any[]> {
        this.isLoadingSubject.next(true);
        return this.httpService.Get('Yetki/TumEkranlariGetir').pipe(
            switchMap((res: ServiceResponseModel) => of(res.data as any[])),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    /**
     * Role ekran yetkisi kaydet.
     * POST api/Yetki/RolEkranYetkisiKaydet  body: { rolId, idler }
     */
    SetRolEkranYetkisi(req: EkranYetkisiReqDTO): Observable<boolean> {
        this.isLoadingSubject.next(true);
        return this.httpService.Post('Yetki/RolEkranYetkisiKaydet', req).pipe(
            switchMap((res: ServiceResponseModel) => of(res.isSuccess ?? false)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    /** @deprecated Eski endpoint — yetki kontrolü artık backend'de */
    Check(): Observable<boolean> {
        return of(true);
    }
}
