import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpService } from 'app/base/services/http.service';
import {
    DiagnosticDto,
    FormPaletteItemDto,
    FormDto,
    PageDto,
    PublishResponseDto,
    QuestionDto,
    ValidateResponseDto,
} from '../../../models';

export interface FormBuildLoadResult {
    form: FormDto | null;
    diagnostics: DiagnosticDto[];
}

export interface FormBuildPublishResult {
    isSuccessful: boolean;
    publishStatusId: number;
    diagnostics: DiagnosticDto[];
}

export interface FormBuildValidateResult {
    isValid: boolean;
    diagnostics: DiagnosticDto[];
}

export interface CreateQuestionDraftRequest {
    formKokEidDto: { eid: string };
    sayfaKokEidDto: { eid: string };
    parentSoruKokEidDto?: { eid: string } | null;
    soruTipKodDto: FormPaletteItemDto['soruTipKodDto'];
    sira: number;
}

export interface ReorderQuestionsRequest {
    sayfaKokEidDto: { eid: string };
    parentSoruKokEidDto?: { eid: string } | null;
    siraliSoruKokEidDtoler: Array<{ eid: string }>;
}

export interface CreatePageDraftRequest {
    formKokEidDto: { eid: string };
    sayfaNo: number;
    sayfaBaslik: string;
    sayfaAciklama: string;
    sira: number;
    sorular: never[];
}

export interface SaveQuestionDraftResult {
    question: QuestionDto | null;
    diagnostics: DiagnosticDto[];
}

@Injectable({ providedIn: 'root' })
export class FormBuildApiService {

    constructor(private readonly httpService: HttpService) {}

    getPaletteItemList(): Observable<FormPaletteItemDto[]> {
        return this.httpService.Post<FormPaletteItemDto[]>('FormBuild/Palette/GetItemList', {}).pipe(
            map((response) => response.isSuccess ? (response.data ?? []) as FormPaletteItemDto[] : []),
        );
    }

    createQuestionDraft(request: CreateQuestionDraftRequest): Observable<QuestionDto | null> {
        return this.httpService.Post<QuestionDto>('FormBuild/Soru/DraftOlustur', request).pipe(
            map((response) => response.isSuccess ? response.data as QuestionDto : null),
        );
    }

    getDraftForm(formEid: string): Observable<FormBuildLoadResult> {
        return this.httpService.Post<FormDto>('FormBuild/Form/Getir', { eid: formEid }).pipe(
            map((response) => {
                const data = response.isSuccess ? response.data as FormDto : null;
                return {
                    form: data,
                    diagnostics: data?.tanilamalar ?? [],
                };
            }),
        );
    }

    saveForm(form: FormDto): Observable<FormBuildLoadResult> {
        return this.httpService.Post<FormDto>('FormBuild/Form/Kaydet', form).pipe(
            map((response) => {
                const data = response.isSuccess ? response.data as FormDto : null;
                return {
                    form: data,
                    diagnostics: data?.tanilamalar ?? [],
                };
            }),
        );
    }

    createPage(request: CreatePageDraftRequest): Observable<PageDto | null> {
        return this.httpService.Post<PageDto>('FormBuild/Sayfa/Kaydet', request).pipe(
            map((response) => response.isSuccess ? response.data as PageDto : null),
        );
    }

    saveQuestionDraft(question: QuestionDto): Observable<SaveQuestionDraftResult> {
        return this.httpService.Post<QuestionDto>(
            'FormBuild/Soru/DraftKaydet',
            question,
        ).pipe(
            map((response) => {
                const data = response.isSuccess ? response.data as QuestionDto : null;
                return {
                    question: data ?? null,
                    diagnostics: [],
                };
            }),
        );
    }

    reorderQuestions(request: ReorderQuestionsRequest): Observable<boolean> {
        return this.httpService.Post<unknown>('FormBuild/Soru/Sirala', request).pipe(
            map((response) => response.isSuccess),
        );
    }

    validateDraft(formEid: string): Observable<FormBuildValidateResult> {
        return this.httpService.Post<ValidateResponseDto>('FormBuild/Taslak/Dogrula', { eid: formEid }).pipe(
            map((response) => {
                const data = response.isSuccess ? response.data as ValidateResponseDto : null;
                return {
                    isValid: Boolean(data?.isValid),
                    diagnostics: data?.tanilamalar ?? [],
                };
            }),
        );
    }

    publishForm(formEid: string): Observable<FormBuildPublishResult> {
        return this.httpService.Post<PublishResponseDto>('FormBuild/Form/Yayinla', { eid: formEid }).pipe(
            map((response) => {
                const data = response.isSuccess ? response.data as PublishResponseDto : null;
                return {
                    isSuccessful: Boolean(data?.basarili),
                    publishStatusId: typeof data?.yeniYayinDurumKID === 'number' ? data.yeniYayinDurumKID : 0,
                    diagnostics: data?.tanilamalar ?? [],
                };
            }),
        );
    }
}
