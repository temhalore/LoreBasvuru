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

    startUserFormSession(kullaniciFormEid: string): Observable<UserFormSession | null> {
        return this.httpService.Post<UserFormSession>('FormRespondent/Form/StartFormByUserFormId', { eid: kullaniciFormEid }).pipe(
            map(response => response.isSuccess ? response.data : null)
        );
    }

    submitUserForm(kullaniciFormEid: string): Observable<UserFormSubmitResponse | null> {
        return this.httpService.Post<UserFormSubmitResponse>('FormRespondent/Form/SubmitForm', { eid: kullaniciFormEid }).pipe(
            map(response => response.isSuccess ? response.data : null)
        );
    }

    saveUserFormPage(request: UserFormSavePageRequest): Observable<UserFormSavePageResponse | null> {
        return this.httpService.Post<UserFormSavePageResponse>('FormRespondent/Form/SaveFormPage', request).pipe(
            map(response => response.isSuccess && response.data
                ? {
                    ...response.data,
                    hatalar: (response.data.hatalar ?? []).map((issue) => this.normalizeIssue(issue)),
                }
                : null)
        );
    }

    uploadUserFormDosya(request: UserFormDosyaUploadRequest): Observable<UserFormDosyaUploadResponse | null> {
        return this.httpService.Post<UserFormDosyaUploadResponse>('FormRespondent/Dosya/Yukle', request).pipe(
            map(response => response.isSuccess && response.data
                ? {
                    ...response.data,
                    hatalar: (response.data.hatalar ?? []).map((issue) => this.normalizeIssue(issue)),
                }
                : null)
        );
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
