import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { DiagnosticDto, FormDto } from '../../../models';
import { FormBuildApiService } from './form-build-api.service';

/**
 * Form editör persistence seam'i.
 *
 * Amaç: tüm sunucu persistence davranışını TEK koordinatöre toplamak ve C2'yi
 * (draft/form-doc yolları arası `hasPendingChanges` koordinasyonsuzluğu)
 * kapatmak. Store, persistence statüsünün tek tüketicisidir; bu alanları
 * artık dağınık handler'lar değil, yalnızca koordinatör üretir.
 *
 * İki yol KORUNUR (backend sözleşmesi gereği soru/sayfa draft kaydı ayrı bir
 * save boundary'dir) ama tek `PersistenceStatus` modeline raporlanır. Backend
 * tek endpoint'e hazır olunca, tek-pipeline geçişinin yegâne değişim noktası
 * bu sınıftır.
 *
 * Serializasyon sözleşmesi (draft↔document yarışını eler):
 * - Document save, kayıtlı op (draft/reorder) varken başlamaz; op'lar
 *   boşalınca bekleyen save tetiklenir.
 * - Bir draft/reorder op'u, kendi API çağrısından önce bekleyen/uçan
 *   document save'i `flushDocument()` ile settle eder.
 * Böylece her an ya document pipeline'ı ya da op'lar çalışır; ikisi bir arada
 * aynı `form` üzerinde yarışmaz.
 */

export interface PersistenceStatus {
    /** Sunucuya yazılmamış değişiklik var (document dirty ya da uçan op). */
    pending: boolean;
    /** Aktif bir persistence işlemi sürüyor (document save ya da op). */
    saving: boolean;
    /** Document save hatası (kullanıcıya gösterilir, retry edilebilir). */
    error: string | null;
    /** Son başarılı document save zamanı (ISO). */
    lastSavedAt: string | null;
    /** Hata var ve retry edilebilir (bekleyen document değişikliği mevcut). */
    retryable: boolean;
}

interface DocumentSaveRequest {
    form: FormDto;
    revision: number;
}

const DOCUMENT_SAVE_DEBOUNCE_MS = 600;

const INITIAL_STATUS: PersistenceStatus = {
    pending: false,
    saving: false,
    error: null,
    lastSavedAt: null,
    retryable: false,
};

@Injectable()
export class FormEditorPersistenceCoordinatorService implements OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly statusSubject = new BehaviorSubject<PersistenceStatus>(INITIAL_STATUS);
    private readonly documentPersistedSubject = new Subject<{ form: FormDto; diagnostics: DiagnosticDto[] }>();

    /** Store bu statünün tek tüketicisidir; kendi state alanlarına aynalar. */
    readonly status$ = this.statusSubject.asObservable();

    /** Bir document save başarıyla persist olduğunda yetkili form + tanılama. */
    readonly documentPersisted$ = this.documentPersistedSubject.asObservable();

    private documentDirty = false;
    private documentSaving = false;
    private documentError: string | null = null;
    private lastSavedAt: string | null = null;

    private inFlightOps = 0;

    private documentSaveDebounceId: ReturnType<typeof setTimeout> | null = null;
    private pendingDocumentSave: DocumentSaveRequest | null = null;
    private documentSaveRevision = 0;
    private persistedDocumentSaveRevision = 0;
    private queuedDocumentSaveRevision = 0;

    private pendingFlushResolvers: Array<(success: boolean) => void> = [];
    private opDrainResolvers: Array<() => void> = [];

    constructor(private readonly formBuildApiService: FormBuildApiService) {}

    /** Yeni bir form yüklemesinde tüm persistence durumunu sıfırlar. */
    reset(): void {
        this.clearDocumentSaveDebounce();
        this.resolvePendingFlushes(false);
        this.resolveOpDrains();
        this.documentDirty = false;
        this.documentSaving = false;
        this.documentError = null;
        this.lastSavedAt = null;
        this.inFlightOps = 0;
        this.pendingDocumentSave = null;
        this.documentSaveRevision = 0;
        this.persistedDocumentSaveRevision = 0;
        this.queuedDocumentSaveRevision = 0;
        this.statusSubject.next(INITIAL_STATUS);
    }

    // --- Document yolu ---

    queueDocumentSave(form: FormDto, immediate = false): void {
        const revision = ++this.documentSaveRevision;
        this.pendingDocumentSave = { form, revision };
        this.queuedDocumentSaveRevision = revision;
        this.documentDirty = true;
        this.documentError = null;
        this.emitStatus();

        if (immediate) {
            this.clearDocumentSaveDebounce();
            this.tryPersistQueuedDocumentSave();
            return;
        }

        this.clearDocumentSaveDebounce();
        this.documentSaveDebounceId = setTimeout(() => {
            this.documentSaveDebounceId = null;
            this.tryPersistQueuedDocumentSave();
        }, DOCUMENT_SAVE_DEBOUNCE_MS);
    }

    retry(form: FormDto): void {
        if (!this.documentDirty) {
            return;
        }

        this.documentError = null;
        this.emitStatus();
        this.queueDocumentSave(form, true);
    }

    /**
     * Op'lar dahil tüm persistence'ı settle eder (preview öncesi kullanılır).
     * Bekleyen değişiklik yoksa true; hata varsa false döner.
     */
    async flush(): Promise<boolean> {
        await this.waitForOpsDrain();
        return this.flushDocument();
    }

    /**
     * Yalnızca document tarafını settle eder (op'ları beklemez).
     * Draft/reorder op'ları, kendi çağrılarından önce bunu await eder.
     */
    flushDocument(): Promise<boolean> {
        this.clearDocumentSaveDebounce();

        if (!this.documentDirty && !this.documentSaving) {
            return Promise.resolve(!this.documentError);
        }

        return new Promise<boolean>((resolve) => {
            this.pendingFlushResolvers.push(resolve);
            if (!this.documentSaving) {
                this.tryPersistQueuedDocumentSave();
            }
        });
    }

    private tryPersistQueuedDocumentSave(): void {
        const request = this.pendingDocumentSave;
        if (!request) {
            this.resolvePendingFlushes(!this.documentDirty && !this.documentSaving);
            return;
        }

        if (this.documentSaving) {
            return;
        }

        // Serializasyon: kayıtlı op varken document save başlamaz; op'lar
        // boşalınca bu yeniden tetiklenir (bkz. endOp).
        if (this.inFlightOps > 0) {
            return;
        }

        this.documentSaving = true;
        this.documentError = null;
        this.emitStatus();

        this.formBuildApiService.saveForm(request.form)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    if (!result.form) {
                        this.handleDocumentSaveFailure(request, 'Degisiklikler kaydedilemedi.');
                        return;
                    }

                    const hasMorePendingChanges = this.queuedDocumentSaveRevision > request.revision;

                    this.documentSaving = false;
                    this.documentDirty = hasMorePendingChanges;
                    this.documentError = null;
                    this.lastSavedAt = new Date().toISOString();
                    this.persistedDocumentSaveRevision = request.revision;

                    if (this.pendingDocumentSave?.revision === request.revision) {
                        this.pendingDocumentSave = null;
                    }

                    this.documentPersistedSubject.next({
                        form: result.form,
                        diagnostics: result.diagnostics,
                    });
                    this.emitStatus();

                    if (hasMorePendingChanges) {
                        this.tryPersistQueuedDocumentSave();
                        return;
                    }

                    this.resolvePendingFlushes(true);
                },
                error: () => {
                    this.handleDocumentSaveFailure(request, 'Degisiklikler kaydedilemedi.');
                },
            });
    }

    private handleDocumentSaveFailure(_request: DocumentSaveRequest, message: string): void {
        this.documentSaving = false;
        this.documentDirty = true;
        this.documentError = message;
        this.emitStatus();
        this.resolvePendingFlushes(false);
    }

    // --- Op (draft/reorder) yolu ---

    /** Bir draft/reorder op'unun başladığını kaydeder. */
    beginOp(): void {
        this.inFlightOps += 1;
        this.emitStatus();
    }

    /** Bir op'un bittiğini kaydeder; op'lar boşalınca bekleyen doc save tetiklenir. */
    endOp(): void {
        if (this.inFlightOps > 0) {
            this.inFlightOps -= 1;
        }

        if (this.inFlightOps === 0) {
            this.resolveOpDrains();
            if (this.pendingDocumentSave && !this.documentSaving) {
                this.tryPersistQueuedDocumentSave();
            }
        }

        this.emitStatus();
    }

    private waitForOpsDrain(): Promise<void> {
        if (this.inFlightOps === 0) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve) => this.opDrainResolvers.push(resolve));
    }

    private resolveOpDrains(): void {
        if (!this.opDrainResolvers.length) {
            return;
        }

        const resolvers = [...this.opDrainResolvers];
        this.opDrainResolvers = [];
        for (const resolve of resolvers) {
            resolve();
        }
    }

    // --- Ortak ---

    private clearDocumentSaveDebounce(): void {
        if (!this.documentSaveDebounceId) {
            return;
        }

        clearTimeout(this.documentSaveDebounceId);
        this.documentSaveDebounceId = null;
    }

    private resolvePendingFlushes(success: boolean): void {
        if (!this.pendingFlushResolvers.length) {
            return;
        }

        const resolvers = [...this.pendingFlushResolvers];
        this.pendingFlushResolvers = [];
        for (const resolve of resolvers) {
            resolve(success);
        }
    }

    private emitStatus(): void {
        const pending = this.documentDirty || this.inFlightOps > 0;
        const saving = this.documentSaving || this.inFlightOps > 0;
        this.statusSubject.next({
            pending,
            saving,
            error: this.documentError,
            lastSavedAt: this.lastSavedAt,
            retryable: Boolean(this.documentError) && this.documentDirty,
        });
    }

    ngOnDestroy(): void {
        this.clearDocumentSaveDebounce();
        this.resolvePendingFlushes(false);
        this.resolveOpDrains();
        this.destroy$.next();
        this.destroy$.complete();
    }
}
