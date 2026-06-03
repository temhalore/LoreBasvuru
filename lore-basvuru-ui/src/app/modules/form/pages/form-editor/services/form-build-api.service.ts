import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
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

    /**
     * Soru tipi paletini getir.
     * Backend'de bu endpoint yok — boş liste döner, frontend statik palette kullanır.
     */
    getPaletteItemList(): Observable<FormPaletteItemDto[]> {
        // TODO: Backend'de palette endpoint eklendikten sonra burası güncellenmeli
        return of([]);
    }

    /**
     * Yeni soru taslağı oluştur.
     * POST api/FormBuild/SoruKaydet
     */
    createQuestionDraft(request: CreateQuestionDraftRequest): Observable<QuestionDto | null> {
        // formEid ve sayfaEid'i request'ten çıkar, SoruDTO formatına dönüştür
        const payload = {
            basvuruFormEid: request.formKokEidDto?.eid ?? null,
            sayfaEid: request.sayfaKokEidDto?.eid ?? null,
            soruTipi: (request.soruTipKodDto as any)?.soruTipi ?? 1,
            etiket: '',
            siraNo: request.sira ?? 0,
            zorunluMu: false,
            gizliMi: false,
            readOnlyMi: false,
            kaynakTipi: 1,
        };
        return this.httpService.Post<QuestionDto>('FormBuild/SoruKaydet', payload).pipe(
            map((response) => response.isSuccess ? response.data as QuestionDto : null),
        );
    }

    /**
     * Form taslağını getir.
     * GET api/FormBuild/FormGetir?eid={formEid}
     */
    getDraftForm(formEid: string): Observable<FormBuildLoadResult> {
        return this.httpService.Get<FormDto>(`FormBuild/FormGetir?eid=${formEid}`).pipe(
            map((response) => {
                const data = response.isSuccess ? response.data as FormDto : null;
                return {
                    form: data,
                    diagnostics: (data as any)?.tanilamalar ?? [],
                };
            }),
        );
    }

    /**
     * Formu kaydet.
     * POST api/FormBuild/FormKaydet
     */
    saveForm(form: FormDto): Observable<FormBuildLoadResult> {
        return this.httpService.Post<FormDto>('FormBuild/FormKaydet', form).pipe(
            map((response) => {
                const data = response.isSuccess ? response.data as FormDto : null;
                return {
                    form: data,
                    diagnostics: (data as any)?.tanilamalar ?? [],
                };
            }),
        );
    }

    /**
     * Sayfa oluştur.
     * POST api/FormBuild/SayfaKaydet
     */
    createPage(request: CreatePageDraftRequest): Observable<PageDto | null> {
        const payload = {
            basvuruFormEid: request.formKokEidDto?.eid ?? null,
            ad: request.sayfaBaslik ?? '',
            aciklama: request.sayfaAciklama ?? '',
            siraNo: request.sira ?? 0,
            aktifMi: true,
            sorular: [],
        };
        return this.httpService.Post<PageDto>('FormBuild/SayfaKaydet', payload).pipe(
            map((response) => response.isSuccess ? response.data as PageDto : null),
        );
    }

    /**
     * Soru taslağını kaydet.
     * POST api/FormBuild/SoruKaydet
     */
    saveQuestionDraft(question: QuestionDto): Observable<SaveQuestionDraftResult> {
        return this.httpService.Post<QuestionDto>(
            'FormBuild/SoruKaydet',
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

    /**
     * Soruları sırala.
     * POST api/FormBuild/SoruSiraGuncelle
     */
    reorderQuestions(request: ReorderQuestionsRequest): Observable<boolean> {
        // Backend [{eid, siraNo}] formatı bekliyor
        const payload = (request.siraliSoruKokEidDtoler ?? []).map((item, index) => ({
            eid: item.eid,
            siraNo: index + 1,
        }));
        return this.httpService.Post<unknown>('FormBuild/SoruSiraGuncelle', payload).pipe(
            map((response) => response.isSuccess),
        );
    }

    /**
     * Taslağı doğrula.
     * Backend'de doğrulama endpoint yok — her zaman geçerli döner.
     */
    validateDraft(_formEid: string): Observable<FormBuildValidateResult> {
        // TODO: Backend'de validate endpoint eklendikten sonra burası güncellenmeli
        return of({ isValid: true, diagnostics: [] });
    }

    /**
     * Formu yayınla.
     * POST api/FormBuild/FormYayinla?eid={formEid}
     */
    publishForm(formEid: string): Observable<FormBuildPublishResult> {
        return this.httpService.Post<PublishResponseDto>(`FormBuild/FormYayinla?eid=${formEid}`, {}).pipe(
            map((response) => {
                const data = response.isSuccess ? response.data as PublishResponseDto : null;
                return {
                    isSuccessful: response.isSuccess ?? false,
                    publishStatusId: typeof (data as any)?.yeniYayinDurumKID === 'number'
                        ? (data as any).yeniYayinDurumKID
                        : 0,
                    diagnostics: (data as any)?.tanilamalar ?? [],
                };
            }),
        );
    }
}
