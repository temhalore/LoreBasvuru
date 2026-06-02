import { FormDto } from '../../../models';
import { FormPublishStatus } from '../../form-respondent/models/form-respondent.enums';
import {
    FormEditorActiveQuestionSurface,
    FormEditorPageDraft,
    FormEditorSaveViewModel,
    FormEditorValidationSession,
} from '../models/form-editor-view.model';

/**
 * Store state'inden türetilen saf görünüm-modeli kurucuları.
 *
 * Bu fonksiyonlar store'dan ayrıştırıldı: hiçbir yan etkileri yoktur, yalnızca
 * okudukları alanları içeren dar bir bağlam üzerinde çalışır ve izole test
 * edilebilir. `FormEditorState` yapısal olarak `FormEditorViewBuildContext`'i
 * karşılar.
 */
export interface FormEditorViewBuildContext {
    form: FormDto | null;
    isLoading: boolean;
    isSaving: boolean;
    saveError: string | null;
    hasPendingChanges: boolean;
    lastSavedAt: string | null;
    isQuestionDraftDirty: boolean;
    editingPageDraft: FormEditorPageDraft | null;
    validationSession: FormEditorValidationSession | null;
    activeQuestionSurface: FormEditorActiveQuestionSurface | null;
}

export function mapPublishStatusLabel(statusId: number): string {
    switch (statusId) {
        case FormPublishStatus.YAYINDA:
            return 'Yayında';
        case FormPublishStatus.GERI_CEKILDI:
            return 'Geri çekildi';
        case FormPublishStatus.ARSIV:
            return 'Arşiv';
        default:
            return 'Taslak';
    }
}

export function buildSaveViewModel(state: FormEditorViewBuildContext): FormEditorSaveViewModel {
    if (state.isLoading) {
        return {
            status: 'idle',
            label: 'Form yukleniyor',
            detail: null,
            canRetry: false,
            tone: 'neutral',
        };
    }

    if (state.isSaving) {
        return {
            status: 'saving',
            label: 'Kaydediliyor',
            detail: 'Degisiklikler sunucuya yaziliyor.',
            canRetry: false,
            tone: 'info',
        };
    }

    if (state.saveError) {
        return {
            status: 'error',
            label: 'Kaydetme basarisiz',
            detail: state.saveError,
            canRetry: state.hasPendingChanges,
            tone: 'danger',
        };
    }

    if (hasPendingSurfaceChanges(state)) {
        return {
            status: 'surface-pending',
            label: 'Acik editor bekliyor',
            detail: 'Editor degisikliklerini kaydedin veya iptal edin.',
            canRetry: false,
            tone: 'warning',
        };
    }

    if (state.hasPendingChanges) {
        return {
            status: 'dirty',
            label: 'Kaydedilmemis degisiklikler var',
            detail: null,
            canRetry: false,
            tone: 'warning',
        };
    }

    if (state.lastSavedAt) {
        return {
            status: 'saved',
            label: 'Kaydedildi',
            detail: formatLastSavedAt(state.lastSavedAt),
            canRetry: false,
            tone: 'success',
        };
    }

    return {
        status: 'idle',
        label: 'Taslak hazir',
        detail: null,
        canRetry: false,
        tone: 'neutral',
    };
}

export function buildPreviewDisabledReason(state: FormEditorViewBuildContext): string | null {
    if (!state.form?.eid || state.isLoading) {
        return 'Form hazir olmadan onizleme acilamaz.';
    }

    if (state.isSaving) {
        return 'Kaydetme tamamlanmadan onizleme acilamaz.';
    }

    if (state.saveError && state.hasPendingChanges) {
        return 'Kaydetme hatasi giderilmeden onizleme acilamaz.';
    }

    if (hasPendingSurfaceChanges(state)) {
        return 'Acik editor degisiklikleri once kaydedilmeli veya iptal edilmeli.';
    }

    if (hasOpenSurface(state)) {
        return 'Acik editor kapatilmadan onizleme acilamaz.';
    }

    return null;
}

export function hasPendingSurfaceChanges(state: FormEditorViewBuildContext): boolean {
    return state.isQuestionDraftDirty
        || Boolean(state.editingPageDraft?.isDirty)
        || Boolean(state.validationSession?.isDirty);
}

export function hasOpenSurface(state: FormEditorViewBuildContext): boolean {
    return Boolean(state.activeQuestionSurface) || Boolean(state.editingPageDraft);
}

export function formatLastSavedAt(isoDate: string): string {
    const savedAtMs = Date.parse(isoDate);
    if (Number.isNaN(savedAtMs)) {
        return 'Son kayit zamani bilinmiyor.';
    }

    const diffMinutes = Math.max(0, Math.floor((Date.now() - savedAtMs) / 60000));
    if (diffMinutes <= 0) {
        return 'Az once kaydedildi.';
    }

    if (diffMinutes === 1) {
        return '1 dk once kaydedildi.';
    }

    if (diffMinutes < 60) {
        return `${diffMinutes} dk once kaydedildi.`;
    }

    return `Saat ${new Intl.DateTimeFormat('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(savedAtMs))} itibariyla kaydedildi.`;
}
