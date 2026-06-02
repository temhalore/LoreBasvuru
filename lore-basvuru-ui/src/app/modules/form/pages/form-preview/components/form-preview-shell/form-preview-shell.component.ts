import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, catchError, distinctUntilChanged, map, of, switchMap, takeUntil, tap } from 'rxjs';
import { FormPreviewModel } from '../../models/form-preview.model';
import { FormPreviewApiService, FormPreviewSchemaResult } from '../../services/form-preview-api.service';
import { FormSchema, GroupInstanceSchema } from '../../../../models/form-schema.model';
import { QuestionAnswerModel } from '../../../../models/question-answer.model';
import { PreviewQuestionPageComponent } from '../../../../shared/components/preview-question-page/preview-question-page.component';
import { PreviewAnswerSummaryHostComponent } from '../preview-answer-summary-host/preview-answer-summary-host.component';

interface FormPreviewRequest {
    source: FormPreviewModel['source'];
    eid: string;
    key: string;
}

interface ResolvedRequestResult {
    request: FormPreviewRequest | null;
    invalidMessage: string | null;
}

@Component({
    selector: 'app-form-preview-shell',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        PreviewQuestionPageComponent,
        PreviewAnswerSummaryHostComponent,
    ],
    templateUrl: './form-preview-shell.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormPreviewShellComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly loadRequest$ = new Subject<FormPreviewRequest>();

    @Input() previewSource?: FormPreviewModel['source'] | null;
    @Input() formKokEid?: string | null;
    @Input() kullaniciFormEid?: string | null;
    @Input() isLoading = false;
    @Input() showHeader = true;
    @Input() showBackButton = false;
    @Input() showPdfButton = false;
    @Input() pdfDownloading = false;
    @Input() backButtonLabel = 'Geri Dön';
    @Input() defaultTwoColumnMode = true;
    @Input() defaultCompactMode = true;

    @Output() backButtonClick = new EventEmitter<void>();
    @Output() pdfDownloadClick = new EventEmitter<void>();
    @Output() loadingStateChange = new EventEmitter<boolean>();

    previewModel: FormSchema | null = null;
    initialAnswers: Record<string, QuestionAnswerModel> = {};
    groupInstances: Record<string, GroupInstanceSchema[]> = {};
    loading = true;
    invalidConfigMessage: string | null = null;
    loadErrorMessage: string | null = null;
    twoColumnModeEnabled = true;
    compactModeEnabled = true;

    get effectiveLoading(): boolean {
        return this.isLoading || this.loading;
    }

    get isTwoColumnModeActive(): boolean {
        return this.twoColumnModeEnabled;
    }

    get isCompactModeActive(): boolean {
        return this.compactModeEnabled;
    }

    get emptyStateTitle(): string {
        if (this.isSelectionPending) {
            return 'Önizleme Mevcut Değil';
        }

        return 'Önizleme hazır değil';
    }

    get emptyStateMessage(): string {
        if (this.isSelectionPending) {
            return 'Form eksik veya tamamlanmamış. Önizlenemez.';
        }

        return this.invalidConfigMessage || 'Önizleme şu an gösterilemiyor.';
    }

    get previewHeading(): string {
        return this.previewModel?.source === 'session-preview' ? 'Başvuru Önizlemesi' : 'Form Taslak Önizlemesi';
    }

    constructor(
        private previewApiService: FormPreviewApiService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.applyLayoutDefaults();

        this.loadRequest$.pipe(
            distinctUntilChanged((left, right) => left.key === right.key),
            tap(() => {
                this.loading = true;
                this.previewModel = null;
                this.initialAnswers = {};
                this.groupInstances = {};
                this.invalidConfigMessage = null;
                this.loadErrorMessage = null;
                this.emitLoadingState();
                this.cdr.markForCheck();
            }),
            switchMap((request) =>
                this.getPreviewByRequest(request).pipe(
                    map((r) => ({ previewModel: r.previewModel, initialAnswers: r.initialAnswers, groupInstances: r.groupInstances, hasError: false })),
                    catchError(() => of({ previewModel: null as FormSchema | null, initialAnswers: {} as Record<string, QuestionAnswerModel>, groupInstances: {} as Record<string, GroupInstanceSchema[]>, hasError: true })),
                ),
            ),
            takeUntil(this.destroy$),
        ).subscribe((result) => {
            this.previewModel = result.previewModel;
            this.initialAnswers = result.initialAnswers;
            this.groupInstances = result.groupInstances;
            this.loading = false;

            if (result.hasError) {
                this.loadErrorMessage = 'İstenen önizleme verisi şu anda getirilemiyor.';
            }

            this.emitLoadingState();
            this.cdr.markForCheck();
        });

        this.loadPreview();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            Object.prototype.hasOwnProperty.call(changes, 'isLoading') ||
            Object.prototype.hasOwnProperty.call(changes, 'previewSource') ||
            Object.prototype.hasOwnProperty.call(changes, 'formKokEid') ||
            Object.prototype.hasOwnProperty.call(changes, 'kullaniciFormEid')
        ) {
            this.loadPreview();
        }

        if (
            Object.prototype.hasOwnProperty.call(changes, 'defaultTwoColumnMode') ||
            Object.prototype.hasOwnProperty.call(changes, 'defaultCompactMode')
        ) {
            this.applyLayoutDefaults();
            this.cdr.markForCheck();
        }

        this.emitLoadingState();
    }

    toggleTwoColumnMode(): void {
        this.twoColumnModeEnabled = !this.twoColumnModeEnabled;
    }

    toggleCompactMode(): void {
        this.compactModeEnabled = !this.compactModeEnabled;
    }

    onBackButtonClick(): void {
        this.backButtonClick.emit();
    }

    onPdfDownloadClick(): void {
        this.pdfDownloadClick.emit();
    }

    private applyLayoutDefaults(): void {
        this.twoColumnModeEnabled = this.defaultTwoColumnMode;
        this.compactModeEnabled = this.defaultCompactMode;
    }

    private get isSelectionPending(): boolean {
        const source = this.normalizeSource(this.previewSource);
        const formKokEid = this.normalizeString(this.formKokEid);
        const kullaniciFormEid = this.normalizeString(this.kullaniciFormEid);

        if (!source && !formKokEid && !kullaniciFormEid) {
            return true;
        }

        if (source === 'session' && !kullaniciFormEid) {
            return true;
        }

        if (source === 'draft' && !formKokEid) {
            return true;
        }

        return false;
    }

    private loadPreview(): void {
        if (this.isLoading) {
            this.loading = false;
            this.previewModel = null;
            this.invalidConfigMessage = null;
            this.loadErrorMessage = null;
            this.emitLoadingState();
            this.cdr.markForCheck();
            return;
        }

        const resolved = this.resolveInputRequest();

        if (resolved.invalidMessage) {
            this.loading = false;
            this.previewModel = null;
            this.invalidConfigMessage = resolved.invalidMessage;
            this.loadErrorMessage = null;
            this.emitLoadingState();
            this.cdr.markForCheck();
            return;
        }

        if (!resolved.request) {
            this.loading = false;
            this.previewModel = null;
            this.invalidConfigMessage = 'Önizleme için geçerli bir kaynak bilgisi bulunamadı.';
            this.loadErrorMessage = null;
            this.emitLoadingState();
            this.cdr.markForCheck();
            return;
        }

        this.loadRequest$.next(resolved.request);
    }

    private resolveInputRequest(): ResolvedRequestResult {
        const inputSource = this.normalizeSource(this.previewSource);
        const inputFormKokEid = this.normalizeString(this.formKokEid);
        const inputKullaniciFormEid = this.normalizeString(this.kullaniciFormEid);

        if (inputSource === 'draft') {
            if (!inputFormKokEid) {
                return { request: null, invalidMessage: 'Taslak önizleme için formKokEid zorunludur.' };
            }

            return { request: this.createRequest('draft', inputFormKokEid), invalidMessage: null };
        }

        if (inputSource === 'session') {
            if (!inputKullaniciFormEid) {
                return { request: null, invalidMessage: 'Başvuru önizlemesi için kullaniciFormEid zorunludur.' };
            }

            return { request: this.createRequest('session', inputKullaniciFormEid), invalidMessage: null };
        }

        if (inputFormKokEid && inputKullaniciFormEid) {
            return {
                request: null,
                invalidMessage: 'Hem formKokEid hem kullaniciFormEid verildiğinde previewSource belirtilmelidir.',
            };
        }

        if (inputFormKokEid) {
            return { request: this.createRequest('draft', inputFormKokEid), invalidMessage: null };
        }

        if (inputKullaniciFormEid) {
            return { request: this.createRequest('session', inputKullaniciFormEid), invalidMessage: null };
        }

        return {
            request: null,
            invalidMessage: 'Önizleme için previewSource veya ilgili eid bilgisi bulunamadı.',
        };
    }

    private getPreviewByRequest(request: FormPreviewRequest): import('rxjs').Observable<{ previewModel: FormSchema | null; initialAnswers: Record<string, QuestionAnswerModel>; groupInstances: Record<string, GroupInstanceSchema[]> }> {
        const stream$ = request.source === 'session'
            ? this.previewApiService.getSessionPreviewSchema(request.eid)
            : this.previewApiService.getDraftPreviewSchema(request.eid);

        return stream$.pipe(
            map((result: FormPreviewSchemaResult | null) => ({
                previewModel: result?.schema ?? null,
                initialAnswers: result?.initialAnswers ?? {},
                groupInstances: result?.groupInstances ?? {},
            }))
        );
    }

    private createRequest(source: FormPreviewModel['source'], eid: string): FormPreviewRequest {
        return {
            source,
            eid,
            key: `${source}:${eid}`,
        };
    }

    private normalizeSource(value: FormPreviewModel['source'] | null | undefined): FormPreviewModel['source'] | null {
        return value === 'draft' || value === 'session' ? value : null;
    }

    private normalizeString(value: string | null | undefined): string {
        return typeof value === 'string' ? value.trim() : '';
    }

    private emitLoadingState(): void {
        this.loadingStateChange.emit(this.effectiveLoading);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}