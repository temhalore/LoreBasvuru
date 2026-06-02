import { BaseModel } from 'app/base/models/general/base.model';
import { RespondentProjection } from './form-respondent-projection.model';
import { EidPayload, FormIlermeDto, UserFormIssue } from '../../../models/question-answer.model';

// ── User Form Session ──────────────────────────────────────────

/**
 * Kullanıcı formu session payload'ı.
 * BaseModel.eid ile kullanıcı form ID'si şifreli döner.
 */
export interface UserFormSession extends BaseModel {
    formBaslik: string;
    formAciklama: string;
    formDurumKID: number;
    resumePolicy: string | null;
    isRevisionChanged: boolean;
    baslangicTarih: string;
    tamamlanmaTarih: string | null;
    projection: RespondentProjection;
    formState: UserFormState;
    ilerlemeDurumu: FormIlermeDto | null;
    ilkHatalar: UserFormIssue[] | null;
}

// ── Form State (tüm sayfalar) ──────────────────────────────────

export interface UserFormState {
    sayfalar: UserFormPageState[];
}

// ── Page State ─────────────────────────────────────────────────

export interface UserFormPageState {
    sayfaKokEidDto: EidPayload;
    sorular: UserFormQuestionState[];
}

// ── Question State ─────────────────────────────────────────────

/**
 * Tek sorunun mutable durumu.
 * Projection metadata (tip, metin, seçenekler) burada yoktur.
 */
export interface UserFormQuestionState {
    soruKokEidDto: EidPayload;
    /** Normal sorularda dolu, tekrarlı grup sorularında null/undefined. */
    answer?: UserFormAnswer;
    /** Tekrarlı grup sorularında instance listesi. Normal sorularda null/undefined. */
    grupInstances?: UserFormGroupInstanceState[];
    /** Backend tarafından hesaplanan readonly durumu. */
    isReadonly: boolean;
}

// ── Group Instance State ───────────────────────────────────────

/**
 * Tek tekrarlı grup instance'ının durumu.
 * Recursive: sorular içinde yine grup instance'ları olabilir.
 */
export interface UserFormGroupInstanceState {
    /** Persist edilmiş şifreli ID. Yeni instance'larda null. */
    grupInstanceEidDto: EidPayload | null;
    /** Sıra numarası (0-based). */
    sira: number;
    /** Bu instance'a ait soru state'leri. */
    sorular: UserFormQuestionState[];
}

// ── Answer ─────────────────────────────────────────────────────

/**
 * Soru tipinden bağımsız birleşik cevap nesnesi.
 * Mevcut QuestionAnswerModel alanlarıyla büyük ölçüde birebir uyumludur.
 */
export interface UserFormAnswer {
    cevapMetni?: string;
    cevapSayi?: number;
    cevapTarih?: string;
    cevapMantiksal?: boolean;
    secenekKokEidDto?: EidPayload;
    ekAciklama?: string;
    secilenSecenekKokEidDtoler?: EidPayload[];
    matrisCevaplar?: UserFormMatrixRowAnswer[];
    /** DOSYA_YUKLEME soru tipi için: yüklenmiş dosya referansları */
    dosyalar?: FormDosyaRef[];
}

// ── Matrix Row Answer ──────────────────────────────────────────

export interface UserFormMatrixRowAnswer {
    matrisSatirKokEidDto: EidPayload;
    matrisSutunKokEidDto?: EidPayload;
    secilenSutunKokEidDtoler?: EidPayload[];
}

// ── Dosya Referansı (Backend ModulDosyaDTO → Frontend) ──────────────────

/** Backend'deki ModulDosyaDTO'nun frontend temsili */
export interface FormDosyaRef {
    /** ModulDosya EID'si — silme işlemlerinde kullanılır */
    eid: string;
    dosyaAd: string;
    uzanti: string;
    /** MB cinsinden boyut */
    boyut: number;
    /** MinIO presigned URL */
    url: string;
    /** Session payload'ında metadata nested dosyaDto içinde gelebilir. */
    dosyaDto?: {
        eid?: string;
        dosyaAd?: string;
        uzanti?: string;
        boyut?: number;
        minIo_url?: string;
    };
}

export type CanonicalFormSession = UserFormSession;
export type CanonicalFormState = UserFormState;
export type CanonicalPageState = UserFormPageState;
export type CanonicalQuestionState = UserFormQuestionState;
export type CanonicalGroupInstanceState = UserFormGroupInstanceState;
export type CanonicalAnswer = UserFormAnswer;
export type CanonicalMatrixRowAnswer = UserFormMatrixRowAnswer;
