import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, finalize, of, switchMap, throwError } from 'rxjs';
import { FormCreateReqModel } from './models/form-create-req.model';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { HttpService } from 'app/base/services/http.service';

export interface FormCreateResponseModel {
    eid?: string | null;
    ad?: string | null;
    aciklama?: string | null;
    durum?: number | null;
    /** @deprecated backend artık baslik kullanmıyor, ad kullanın */
    baslik?: string | null;
}

export const FORM_CREATE_RESPONSE_ERROR_MESSAGE = 'Form oluşturma yanıtı alınamadı.';

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

        // Backend BasvuruFormDTO alanı "ad" iken front-end "baslik" kullanıyor, dönüştür
        const payload = {
            ad: request.baslik,
            aciklama: request.aciklama,
            anonymousIzinliMi: request.isPublic ?? false,
        };

        return this.httpService.Post('FormBuild/FormKaydet', payload).pipe(
            switchMap((response: ServiceResponseModel) =>
                this.unwrapResponse<FormCreateResponseModel>(response, FORM_CREATE_RESPONSE_ERROR_MESSAGE)
            ),
            finalize(() => this.isLoadingSubject.next(false))
        );
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
