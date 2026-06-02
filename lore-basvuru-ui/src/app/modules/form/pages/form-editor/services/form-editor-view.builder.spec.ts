import {
    FormEditorViewBuildContext,
    buildPreviewDisabledReason,
    buildSaveViewModel,
    formatLastSavedAt,
    mapPublishStatusLabel,
} from './form-editor-view.builder';
import { FormPublishStatus } from '../../form-respondent/models/form-respondent.enums';

function ctx(overrides: Partial<FormEditorViewBuildContext> = {}): FormEditorViewBuildContext {
    return {
        form: { eid: 'form-1' } as FormEditorViewBuildContext['form'],
        isLoading: false,
        isSaving: false,
        saveError: null,
        hasPendingChanges: false,
        lastSavedAt: null,
        isQuestionDraftDirty: false,
        editingPageDraft: null,
        validationSession: null,
        activeQuestionSurface: null,
        ...overrides,
    };
}

describe('form-editor-view.builder', () => {
    it('mapPublishStatusLabel bilinen ve bilinmeyen durumları eşler', () => {
        expect(mapPublishStatusLabel(FormPublishStatus.YAYINDA)).toBe('Yayında');
        expect(mapPublishStatusLabel(FormPublishStatus.GERI_CEKILDI)).toBe('Geri çekildi');
        expect(mapPublishStatusLabel(FormPublishStatus.ARSIV)).toBe('Arşiv');
        expect(mapPublishStatusLabel(0)).toBe('Taslak');
    });

    it('buildSaveViewModel öncelik sırası: loading > saving > error > surface > dirty > saved > idle', () => {
        expect(buildSaveViewModel(ctx({ isLoading: true })).status).toBe('idle');
        expect(buildSaveViewModel(ctx({ isSaving: true })).status).toBe('saving');
        expect(buildSaveViewModel(ctx({ saveError: 'x', hasPendingChanges: true })).status).toBe('error');
        expect(buildSaveViewModel(ctx({ isQuestionDraftDirty: true })).status).toBe('surface-pending');
        expect(buildSaveViewModel(ctx({ hasPendingChanges: true })).status).toBe('dirty');
        expect(buildSaveViewModel(ctx({ lastSavedAt: new Date().toISOString() })).status).toBe('saved');
        expect(buildSaveViewModel(ctx()).status).toBe('idle');
    });

    it('error durumunda canRetry yalnızca bekleyen değişiklik varsa true', () => {
        expect(buildSaveViewModel(ctx({ saveError: 'x', hasPendingChanges: true })).canRetry).toBeTrue();
        expect(buildSaveViewModel(ctx({ saveError: 'x', hasPendingChanges: false })).canRetry).toBeFalse();
    });

    it('buildPreviewDisabledReason açık surface ve dirty durumlarını engeller', () => {
        expect(buildPreviewDisabledReason(ctx({ form: null }))).toContain('Form hazir');
        expect(buildPreviewDisabledReason(ctx({ isSaving: true }))).toContain('Kaydetme tamamlanmadan');
        expect(buildPreviewDisabledReason(ctx({ saveError: 'x', hasPendingChanges: true }))).toContain('Kaydetme hatasi');
        expect(buildPreviewDisabledReason(ctx({ validationSession: { isDirty: true } as never }))).toContain('once kaydedilmeli');
        expect(buildPreviewDisabledReason(ctx({ activeQuestionSurface: { questionEid: 'q', surfaceId: 'content' } }))).toContain('kapatilmadan');
        expect(buildPreviewDisabledReason(ctx())).toBeNull();
    });

    it('formatLastSavedAt sınır değerlerini biçimler', () => {
        expect(formatLastSavedAt('not-a-date')).toBe('Son kayit zamani bilinmiyor.');
        expect(formatLastSavedAt(new Date().toISOString())).toBe('Az once kaydedildi.');
        expect(formatLastSavedAt(new Date(Date.now() - 60_000).toISOString())).toBe('1 dk once kaydedildi.');
        expect(formatLastSavedAt(new Date(Date.now() - 5 * 60_000).toISOString())).toBe('5 dk once kaydedildi.');
    });
});
