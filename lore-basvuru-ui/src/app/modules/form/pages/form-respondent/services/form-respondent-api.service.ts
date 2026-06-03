import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpService } from 'app/base/services/http.service';
import { UserFormPageState, UserFormSession } from '../models/form-respondent-canonical-state.model';
import {
    EidPayload,
    UserFormIssue,
    UserFormSavePageRequest,
    UserFormSavePageResponse as SharedUserFormSavePageResponse,
    UserFormSubmitResponse,
} from '../../../models/question-answer.model';

export interface UserFormSavePageResponse extends Omit<SharedUserFormSavePageResponse, 'pageState'> {
    pageState: UserFormPageState;
}

export interface UserFormDosyaUploadRequest {
    eid: string;
    soruKokEidDto: EidPayload;
    grupInstanceEidDto?: EidPayload;
    dosyalar: UserFormDosyaUploadItem[];
}

export interface UserFormDosyaUploadItem {
    dosyaAd: string;
    uzanti: string;
    dosyaData: string;
}

export interface UserFormDosyaUploadResponse {
    dosyalar: FormDosyaUploadResponseItem[];
    hatalar: UserFormIssue[];
}

export interface FormDosyaUploadResponseItem {
    eid: string;
    modulTabloName: string;
    modulTabloId: number;
    url: string;
    dosyaDto: {
        id: number;
        dosyaAd: string;
        uzanti: string;
        boyut: number;
    };
}

@Injectable({ providedIn: 'root' })
export class FormRespondentApiService {

    constructor(private httpService: HttpService) {}

    /**
     * Forma yeni başvuru başlat.
     * POST api/FormRespondent/BasvuruBaslat?formEid={formEid}
     */
    startUserFormSession(formEid: string): Observable<UserFormSession | null> {
        return this.httpService.Post<UserFormSession>(`FormRespondent/BasvuruBaslat?formEid=${formEid}`, {}).pipe(
            map(response => response.isSuccess ? response.data : null)
        );
    }

    /**
     * Başvuruyu tamamla (gönder).
     * POST api/FormRespondent/BasvuruTamamla?basvuruEid={basvuruEid}
     */
    submitUserForm(basvuruEid: string): Observable<UserFormSubmitResponse | null> {
        return this.httpService.Post<UserFormSubmitResponse>(`FormRespondent/BasvuruTamamla?basvuruEid=${basvuruEid}`, {}).pipe(
            map(response => response.isSuccess ? response.data : null)
        );
    }

    /**
     * Sayfa cevaplarını kaydet.
     * POST api/FormRespondent/CevapKaydet
     */
    saveUserFormPage(request: UserFormSavePageRequest): Observable<UserFormSavePageResponse | null> {
        return this.httpService.Post<UserFormSavePageResponse>('FormRespondent/CevapKaydet', request).pipe(
            map(response => response.isSuccess && response.data
                ? {
                    ...response.data,
                    hatalar: (response.data.hatalar ?? []).map((issue) => this.normalizeIssue(issue)),
                }
                : null)
        );
    }

    /**
     * Dosya yükle.
     * TODO: Backend'de dosya yükleme endpoint'i eklendiğinde burası güncellenmeli.
     */
    uploadUserFormDosya(_request: UserFormDosyaUploadRequest): Observable<UserFormDosyaUploadResponse | null> {
        // Backend'de FormRespondent dosya upload endpoint yok — şimdilik null döner
        return new Observable(observer => {
            observer.next(null);
            observer.complete();
        });
    }

    private normalizeIssue(issue: Partial<UserFormIssue> | null | undefined): UserFormIssue {
        return {
            code: issue?.code ?? 'UNKNOWN',
            severity: issue?.severity ?? 'Error',
            message: issue?.message ?? 'İşlem sırasında hata oluştu',
            targetType: issue?.targetType ?? '',
            targetKey: issue?.targetKey ?? '',
            targetEid: issue?.targetEid ?? null,
            targetGroupInstanceEid: issue?.targetGroupInstanceEid ?? null,
            details: issue?.details,
        };
    }
}
