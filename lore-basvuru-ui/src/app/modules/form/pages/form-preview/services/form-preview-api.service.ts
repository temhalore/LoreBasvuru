import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpService } from 'app/base/services/http.service';
import { mapPreviewFormToSchema, extractPreviewAnswers, extractGroupInstancesFromPreview } from '../../../models/form-ui.adapter';
import { FormDosyaRef, UserFormAnswer } from '../../form-respondent/models/form-respondent-canonical-state.model';
import { FormPreviewGroupInstance, FormPreviewModel, FormPreviewQuestion, FormPreviewSection } from '../models/form-preview.model';
import { FormSchema, GroupInstanceSchema } from '../../../models/form-schema.model';
import { QuestionAnswerModel } from '../../../models/question-answer.model';

export interface FormPreviewSchemaResult {
    schema: FormSchema;
    initialAnswers: Record<string, QuestionAnswerModel>;
    groupInstances: Record<string, GroupInstanceSchema[]>;
}

interface DraftPreviewResponse {
    baslik: string;
    aciklama: string;
    sayfalar: DraftPreviewPage[];
}

interface DraftPreviewPage {
    eid: string;
    sayfaBaslik: string;
    sayfaAciklama: string;
    sira: number;
    sorular: DraftPreviewQuestion[];
}

interface DraftPreviewQuestion {
    eid: string;
    soruMetni: string;
    soruTipKID: number;
    isZorunlu: boolean;
    yardimMetni: string;
    placeholder: string;
    sira: number;
    olcekMinDeger: number | null;
    olcekMaxDeger: number | null;
    olcekMinEtiket: string;
    olcekMaxEtiket: string;
    secenekler: unknown[];
    matrisSatirlar: unknown[];
    matrisSutunlar: unknown[];
    altSorular: DraftPreviewQuestion[];
}

@Injectable({ providedIn: 'root' })
export class FormPreviewApiService {

    constructor(private httpService: HttpService) {}

    getDraftPreview(formKokEid: string): Observable<FormPreviewModel | null> {
        // GET api/FormBuild/FormGetir?eid={eid} — tam form yapısını döner, önizleme için kullanılır
        return this.httpService.Get<DraftPreviewResponse>(`FormBuild/FormGetir?eid=${formKokEid}`).pipe(
            map(response => response.isSuccess ? this.mapDraftPreview(response.data) : null),
        );
    }

    getSessionPreview(basvuruEid: string): Observable<FormPreviewModel | null> {
        // GET api/FormRespondent/BasvuruDetayGetir?basvuruEid={eid}
        return this.httpService.Get<Omit<FormPreviewModel, 'source'>>(`FormRespondent/BasvuruDetayGetir?basvuruEid=${basvuruEid}`).pipe(
            map(response => response.isSuccess && response.data
                ? this.mapSessionPreview(response.data)
                : null),
        );
    }

    getDraftPreviewSchema(formKokEid: string): Observable<FormPreviewSchemaResult | null> {
        return this.getDraftPreview(formKokEid).pipe(
            map((preview) => {
                if (!preview) return null;
                return {
                    schema: mapPreviewFormToSchema(preview),
                    initialAnswers: extractPreviewAnswers(preview),
                    groupInstances: extractGroupInstancesFromPreview(preview),
                };
            }),
        );
    }

    getSessionPreviewSchema(kullaniciFormEid: string): Observable<FormPreviewSchemaResult | null> {
        return this.getSessionPreview(kullaniciFormEid).pipe(
            map((preview) => {
                if (!preview) return null;
                return {
                    schema: mapPreviewFormToSchema(preview),
                    initialAnswers: extractPreviewAnswers(preview),
                    groupInstances: extractGroupInstancesFromPreview(preview),
                };
            }),
        );
    }

    private mapSessionPreview(data: Omit<FormPreviewModel, 'source'>): FormPreviewModel {
        return {
            formBaslik: data.formBaslik,
            formAciklama: data.formAciklama,
            source: 'session',
            bolumler: (data.bolumler ?? []).map((bolum) => this.mapSessionSection(bolum)),
        };
    }

    private mapSessionSection(section: FormPreviewSection): FormPreviewSection {
        return {
            ...section,
            sorular: (section.sorular ?? []).map((soru) => this.mapSessionQuestion(soru)),
        };
    }

    private mapSessionQuestion(question: FormPreviewQuestion): FormPreviewQuestion {
        return {
            ...question,
            answer: this.normalizeAnswer(question.answer),
            altSorular: (question.altSorular ?? []).map((altSoru) => this.mapSessionQuestion(altSoru)),
            grupInstances: (question.grupInstances ?? []).map((instance) => this.mapSessionGroupInstance(instance)),
        };
    }

    private mapSessionGroupInstance(instance: FormPreviewGroupInstance): FormPreviewGroupInstance {
        return {
            ...instance,
            sorular: (instance.sorular ?? []).map((soru) => this.mapSessionQuestion(soru)),
        };
    }

    private normalizeAnswer(answer?: UserFormAnswer): UserFormAnswer | undefined {
        if (!answer) {
            return undefined;
        }

        return {
            ...answer,
            dosyalar: (answer.dosyalar ?? []).map((dosya) => this.normalizeFile(dosya)),
        };
    }

    private normalizeFile(dosya: FormDosyaRef): FormDosyaRef {
        return {
            ...dosya,
            eid: this.pickFirstNonEmpty(dosya.eid, dosya.dosyaDto?.eid),
            dosyaAd: this.pickFirstNonEmpty(dosya.dosyaAd, dosya.dosyaDto?.dosyaAd),
            uzanti: this.pickFirstNonEmpty(dosya.uzanti, dosya.dosyaDto?.uzanti),
            boyut: this.pickFirstNumber(dosya.boyut, dosya.dosyaDto?.boyut),
            url: this.pickFirstNonEmpty(dosya.url, dosya.dosyaDto?.minIo_url),
        };
    }

    private pickFirstNonEmpty(...values: Array<string | undefined | null>): string {
        for (const value of values) {
            if (typeof value === 'string' && value.trim().length > 0) {
                return value;
            }
        }

        return '';
    }

    private pickFirstNumber(...values: Array<number | undefined | null>): number {
        for (const value of values) {
            if (typeof value === 'number' && Number.isFinite(value)) {
                return value;
            }
        }

        return 0;
    }

    private mapDraftPreview(data: DraftPreviewResponse | null): FormPreviewModel | null {
        if (!data) {
            return null;
        }

        return {
            formBaslik: data.baslik,
            formAciklama: data.aciklama,
            source: 'draft',
            bolumler: (data.sayfalar ?? []).map((sayfa) => this.mapDraftSection(sayfa)),
        };
    }

    private mapDraftSection(sayfa: DraftPreviewPage): FormPreviewSection {
        return {
            eid: sayfa.eid,
            sayfaBaslik: sayfa.sayfaBaslik,
            sayfaAciklama: sayfa.sayfaAciklama,
            sira: sayfa.sira,
            sorular: (sayfa.sorular ?? []).map((soru) => this.mapDraftQuestion(soru)),
        };
    }

    private mapDraftQuestion(soru: DraftPreviewQuestion): FormPreviewQuestion {
        return {
            eid: soru.eid,
            soruMetni: soru.soruMetni,
            soruTipKID: soru.soruTipKID,
            isZorunlu: soru.isZorunlu,
            yardimMetni: soru.yardimMetni,
            placeholder: soru.placeholder,
            sira: soru.sira,
            olcekMinDeger: soru.olcekMinDeger,
            olcekMaxDeger: soru.olcekMaxDeger,
            olcekMinEtiket: soru.olcekMinEtiket,
            olcekMaxEtiket: soru.olcekMaxEtiket,
            secenekler: (soru.secenekler ?? []) as [],
            matrisSatirlar: (soru.matrisSatirlar ?? []) as [],
            matrisSutunlar: (soru.matrisSutunlar ?? []) as [],
            altSorular: (soru.altSorular ?? []).map((altSoru) => this.mapDraftQuestion(altSoru)),
            answer: undefined,
            cevapKayitEidDtoler: [],
            grupInstances: [],
        };
    }
}