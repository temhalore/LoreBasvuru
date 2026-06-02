import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, finalize, of, switchMap, throwError } from 'rxjs';
import { EtikKurulModel } from 'app/base/models/definition-operations/etik-kurul.model';
import { FormListItemModel } from 'app/base/models/form/form-list-item.model';
import { FormCreateReqModel } from './models/form-create-req.model';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { LocalStorageService } from 'app/base/services/local-storage.service';
import { HttpService } from 'app/base/services/http.service';

export interface FormCreateResponseModel {
    eid?: string | null;
    baslik?: string | null;
    aciklama?: string | null;
    isPublic?: boolean | null;
    yayinDurumKID?: number | null;
}

export const FORM_CREATE_RESPONSE_ERROR_MESSAGE = 'Form oluşturma yanıtı alınamadı.';
export const FORM_CREATE_CONTEXT_ERROR_MESSAGE = 'Form oluşturmak için seçili etik kurul bulunamadı.';
export const ETIK_KURUL_RESPONSE_ERROR_MESSAGE = 'Etik kurul bilgisi alınamadı.';

@Injectable({ providedIn: 'root' })
export class FormListService {
    private readonly isLoadingSubject = new BehaviorSubject<boolean>(false);
    readonly isLoading$ = this.isLoadingSubject.asObservable();

    constructor(private readonly httpService: HttpService) {}

    get isLoading(): boolean {
        return this.isLoadingSubject.value;
    }

    createForm(request: FormCreateReqModel): Observable<FormCreateResponseModel> {
        this.isLoadingSubject.next(true);

        const selectedEtikKurulEid = this.resolveSelectedEtikKurulEid();
        if (!selectedEtikKurulEid) {
            return throwError(() => new Error(FORM_CREATE_CONTEXT_ERROR_MESSAGE)).pipe(
                finalize(() => this.isLoadingSubject.next(false))
            );
        }

        return this.httpService.Post('FormBuild/Form/Kaydet', request).pipe(
            switchMap((response: ServiceResponseModel) => this.unwrapResponse<FormCreateResponseModel>(response, FORM_CREATE_RESPONSE_ERROR_MESSAGE)),
            switchMap((form) => this.bindFormToEtikKurul(selectedEtikKurulEid, form)),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }

    private bindFormToEtikKurul(etikKurulEid: string, form: FormCreateResponseModel): Observable<FormCreateResponseModel> {
        if (!form.eid) {
            return throwError(() => new Error(FORM_CREATE_RESPONSE_ERROR_MESSAGE));
        }

        return this.httpService.Post('DefinitionOperations/EtikKurul/Get', { eid: etikKurulEid }).pipe(
            switchMap((response: ServiceResponseModel) => this.unwrapResponse<EtikKurulModel>(response, ETIK_KURUL_RESPONSE_ERROR_MESSAGE)),
            switchMap((etikKurul) =>
                this.httpService.Post('DefinitionOperations/EtikKurul/Set', this.buildEtikKurulUpdateRequest(etikKurul, form)).pipe(
                    switchMap((response: ServiceResponseModel) => {
                        if (response.isSuccess === false) {
                            return EMPTY;
                        }

                        return of(form);
                    })
                )
            )
        );
    }

    private buildEtikKurulUpdateRequest(etikKurul: EtikKurulModel, form: FormCreateResponseModel): EtikKurulModel {
        return {
            ...etikKurul,
            basvuruFormKokId: null,
            basvuruFormu: this.buildFormListItem(form),
        };
    }

    private buildFormListItem(form: FormCreateResponseModel): FormListItemModel {
        return {
            eid: form.eid ?? '',
            formKokId: 0,
            baslik: form.baslik ?? '',
            olusturulmaTarihi: null,
        };
    }

    private resolveSelectedEtikKurulEid(): string {
        const selectedEtikKurulEid = LocalStorageService.getSelectedEtikKurulEid();
        if (selectedEtikKurulEid) {
            return selectedEtikKurulEid;
        }

        const firstEtikKurulEid =
            LocalStorageService.getDecodedLocalStorageObject()?.kisiTokenDto?.kisiDto?.etikKurulRoleListDto?.[0]?.etikKurulDto?.eid ?? '';

        if (firstEtikKurulEid) {
            LocalStorageService.setSelectedEtikKurulEid(firstEtikKurulEid);
        }

        return firstEtikKurulEid;
    }

    private unwrapResponse<T>(response: ServiceResponseModel, errorMessage: string): Observable<T> {
        if (response.isSuccess === false) {
            return EMPTY;
        }

        if (!response.data) {
            return throwError(() => new Error(errorMessage));
        }

        return of(response.data as T);
    }
}