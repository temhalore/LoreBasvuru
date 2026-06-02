import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { Subject, catchError, debounceTime, filter, of, switchMap, takeUntil, tap } from 'rxjs';
import { FormSchema, PageSchema, QuestionSchema, QuestionTypeId } from '../../../../models/form-schema.model';
import { FormUiSnapshotBuilder } from '../../../../models/form-ui-snapshot.builder';
import { mapRespondentProjectionToSchema } from '../../../../models/form-ui.adapter';
import { FormIlermeDto, UserFormIssue, UserFormSavePageRequest } from '../../../../models/question-answer.model';
import { REPEATING_GROUP_PORT } from '../../../../shared/questions/repeating-group-question/repeating-group.port';
import { QUESTION_FILE_UPLOAD_PORT } from '../../../../shared/services/question-file-upload.port';
import { FormPreviewShellComponent } from '../../../form-preview/components/form-preview-shell/form-preview-shell.component';
import {
    UserFormGroupInstanceState,
    UserFormQuestionState,
    UserFormSession,
    UserFormState,
} from '../../models/form-respondent-canonical-state.model';
import { SessionStatus } from '../../models/form-respondent.enums';
import { FormNavigationService } from '../../services/form-navigation.service';
import { FormRespondentApiService, UserFormSavePageResponse } from '../../services/form-respondent-api.service';
import { FormRuleEngineService } from '../../services/form-rule-engine.service';
import { RespondentGroupPortService } from '../../services/respondent-group-port.service';
import { RespondentQuestionFileUploadAdapter } from '../../services/respondent-question-file-upload.adapter';
import { RespondentStateStore } from '../../services/respondent-state-store.service';
import {
    FormRespondentCompletionPhase,
    FormRespondentCompletionStateComponent,
} from '../form-respondent-completion-state/form-respondent-completion-state.component';
import { FormRespondentEntryStateComponent } from '../form-respondent-entry-state/form-respondent-entry-state.component';
import { FormRespondentHeaderComponent } from '../form-respondent-header/form-respondent-header.component';
import { FormRespondentNavigationComponent } from '../form-respondent-navigation/form-respondent-navigation.component';
import { FormRespondentPageComponent } from '../form-respondent-page/form-respondent-page.component';

type RespondentBootstrapStatus = 'loading' | 'ready' | 'error';
type RespondentSurface = 'entry' | 'active' | 'completed' | 'error';
type SubmitReturnState = {
    isFinalPreviewStep: boolean;
    finalPreviewLoading: boolean;
};

@Component({
    selector: 'app-form-respondent-shell',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        MatIconModule,
        FormRespondentHeaderComponent,
        FormRespondentPageComponent,
        FormRespondentNavigationComponent,
        FormPreviewShellComponent,
        FormRespondentEntryStateComponent,
        FormRespondentCompletionStateComponent,
    ],
    providers: [
        RespondentStateStore,
        FormNavigationService,
        FormRuleEngineService,
        SweetAlertService,
        RespondentQuestionFileUploadAdapter,
        FormUiSnapshotBuilder,
        RespondentGroupPortService,
        {
            provide: QUESTION_FILE_UPLOAD_PORT,
            useExisting: RespondentQuestionFileUploadAdapter,
        },
        {
            provide: REPEATING_GROUP_PORT,
            useExisting: RespondentGroupPortService,
        },
    ],
    templateUrl: './form-respondent-shell.component.html',
})
export class FormRespondentShellComponent implements OnInit, OnDestroy {
    private static readonly ENABLE_FINAL_PREVIEW_STEP = true;
    private static readonly AUTO_SAVE_DEBOUNCE_MS = 1000;
    private static readonly DEFAULT_COMPLETION_MESSAGE = 'Yanıtlarınız başarıyla kaydedildi. Başvurunuz artık etik kurul sürecinde değerlendirilecektir.';
    private static readonly PREVIOUSLY_COMPLETED_MESSAGE = 'Bu form daha önce başarıyla gönderildi. Başvurunuzun durumunu aşağıdaki ekranlardan takip edebilirsiniz.';

    private readonly destroy$ = new Subject<void>();

    stretchPageContent = true;
    formSchema: FormSchema | null = null;
    session: UserFormSession | null = null;
    currentPage: PageSchema | undefined;
    bootstrapStatus: RespondentBootstrapStatus = 'loading';
    surface: RespondentSurface = 'entry';
    loadErrorMessage: string | null = null;
    entryPageCount = 0;
    entryQuestionCount = 0;
    hasSavedProgress = false;
    completionMessage = FormRespondentShellComponent.DEFAULT_COMPLETION_MESSAGE;
    completionPhase: FormRespondentCompletionPhase = 'success';
    submitting = false;
    navigationBusy = false;
    isPreview = false;
    formProgress: FormIlermeDto | null = null;
    isSaving = false;
    formIssues: UserFormIssue[] = [];
    completionErrorDetails: string[] = [];
    isFinalPreviewStep = false;
    finalPreviewLoading = false;
    private pendingScrollResetFrame: number | null = null;
    private submitReturnState: SubmitReturnState | null = null;

    @ViewChild('mainShell') private mainShellRef?: ElementRef<HTMLElement>;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly apiService: FormRespondentApiService,
        private readonly stateStore: RespondentStateStore,
        private readonly navigationService: FormNavigationService,
        private readonly ruleEngine: FormRuleEngineService,
        private readonly sweetAlert: SweetAlertService,
        private readonly cdr: ChangeDetectorRef,
        private readonly location: Location,
        private readonly router: Router,
        private readonly snapshotBuilder: FormUiSnapshotBuilder,
        private readonly groupPort: RespondentGroupPortService,
    ) {}

    ngOnInit(): void {
        const kullaniciFormEid = this.route.snapshot.paramMap.get('kullaniciFormEid') ?? '';
        this.apiService.startUserFormSession(kullaniciFormEid).pipe(
            takeUntil(this.destroy$),
        ).subscribe({
            next: (session) => {
                if (!session) {
                    this.handleBootstrapError('Kullanıcı formu yüklenemedi');
                    return;
                }

                this.initSession(session);
            },
            error: (err) => {
                console.error('[FormRespondent] API error:', err);
                this.handleBootstrapError('Kullanıcı formu yüklenirken hata oluştu');
            },
        });
    }

    get isLastFormPage(): boolean {
        return this.navigationService.isLastPage();
    }

    get isFinalPreviewStepEnabled(): boolean {
        return FormRespondentShellComponent.ENABLE_FINAL_PREVIEW_STEP;
    }

    onStartForm(): void {
        if (this.bootstrapStatus !== 'ready' || !this.session || !this.currentPage) {
            return;
        }

        this.surface = 'active';
        this.queueScrollReset();
        this.cdr.markForCheck();
    }

    onNext(): void {
        if (!this.session || this.surface !== 'active' || this.navigationBusy || this.submitting) {
            return;
        }

        this.navigationBusy = true;
        const finish = () => {
            this.navigationBusy = false;
            this.cdr.markForCheck();
        };

        if (this.isFinalPreviewStep) {
            finish();
            return;
        }

        if (this.isPreview) {
            this.navigationService.reconcile();
            this.navigateNext();
            finish();
            return;
        }

        this.persistCurrentPage(
            'Hata',
            'Sayfa doğrulanırken hata oluştu',
            true,
            () => {
                this.navigationService.reconcile();
                if (this.isFinalPreviewStepEnabled && this.isLastFormPage) {
                    this.isFinalPreviewStep = true;
                    this.finalPreviewLoading = true;
                    this.queueScrollReset();
                } else {
                    this.navigateNext();
                }
                finish();
            },
            () => {
                this.navigationService.reconcile();
                finish();
            },
        );
    }

    onBack(): void {
        if (!this.session || this.surface !== 'active' || this.navigationBusy || this.submitting) {
            return;
        }

        this.navigationBusy = true;
        const finish = () => {
            this.navigationBusy = false;
            this.cdr.markForCheck();
        };

        if (this.isFinalPreviewStep) {
            this.isFinalPreviewStep = false;
            this.finalPreviewLoading = false;
            this.queueScrollReset();
            finish();
            return;
        }

        if (this.isPreview) {
            this.navigationService.reconcile();
            this.navigationService.goBack();
            this.queueScrollReset();
            finish();
            return;
        }

        this.persistCurrentPage(
            'Hata',
            'Sayfa doğrulanırken hata oluştu',
            true,
            () => {
                this.navigationService.reconcile();
                this.navigationService.goBack();
                finish();
            },
            () => {
                this.navigationService.reconcile();
                finish();
            },
        );
    }

    onSubmit(): void {
        if (!this.session || this.surface !== 'active' || this.submitting || this.isPreview) {
            return;
        }

        void this.sweetAlert.confirm(
            'Form Gönderilsin mi?',
            'Form gönderildikten sonra üzerinde değişiklik yapamayacaksınız.',
            'Evet, gönder',
            'Vazgeç',
        ).then((confirmed) => {
            if (!confirmed || !this.session || this.surface !== 'active' || this.submitting || this.isPreview) {
                return;
            }

            this.submitFormFlow(true);
        });
    }

    onBackToFormFromCompletion(): void {
        if (this.surface !== 'completed' || this.completionPhase !== 'error' || this.submitting) {
            return;
        }

        this.restoreActiveSurface();
        this.cdr.markForCheck();
    }

    onRetrySubmitFromCompletion(): void {
        if (!this.session || this.surface !== 'completed' || this.completionPhase !== 'error' || this.submitting) {
            return;
        }

        this.submitFormFlow(false);
    }

    onSaveAndExit(): void {
        if (!this.session || this.surface !== 'active' || this.navigationBusy || this.submitting) {
            return;
        }

        this.navigationBusy = true;
        const finish = () => {
            this.navigationBusy = false;
            this.cdr.markForCheck();
        };

        if (this.isFinalPreviewStep) {
            finish();
            this.location.back();
            return;
        }

        this.persistCurrentPage(
            'Hata',
            'Sayfa kaydedilirken hata oluştu',
            true,
            () => {
                finish();
                this.location.back();
            },
            () => {
                this.navigationService.reconcile();
                finish();
            },
            true,
        );
    }

    onFinalPreviewLoadingChanged(isLoading: boolean): void {
        this.finalPreviewLoading = isLoading;
        this.cdr.markForCheck();
    }

    goToMyApplications(): void {
        void this.router.navigate(['/application-operations/my-applications']);
    }

    goToDashboard(): void {
        void this.router.navigate(['/dashboard']);
    }

    ngOnDestroy(): void {
        if (typeof window !== 'undefined' && this.pendingScrollResetFrame !== null) {
            window.cancelAnimationFrame(this.pendingScrollResetFrame);
            this.pendingScrollResetFrame = null;
        }

        this.destroy$.next();
        this.destroy$.complete();
    }

    private initSession(session: UserFormSession): void {
        this.session = session;
        this.groupPort.setSessionEid(session.eid);
        this.completionPhase = 'success';
        this.completionErrorDetails = [];
        this.completionMessage = session.formDurumKID === SessionStatus.TAMAMLANDI
            ? FormRespondentShellComponent.PREVIOUSLY_COMPLETED_MESSAGE
            : FormRespondentShellComponent.DEFAULT_COMPLETION_MESSAGE;

        const formSchema = mapRespondentProjectionToSchema(session.projection);
        this.formSchema = formSchema;
        this.entryPageCount = formSchema.pages.length;
        this.entryQuestionCount = this.countQuestions(formSchema.pages);
        this.hasSavedProgress = this.formStateHasSavedProgress(session.formState);

        this.formProgress = session.ilerlemeDurumu ?? null;
        this.formIssues = session.ilkHatalar ?? [];
        this.stateStore.hydrateFromCanonical(session.formState);
        this.stateStore.setIssues(session.ilkHatalar ?? []);
        this.navigationService.initialize(formSchema.pages);
        this.ruleEngine.initialize(
            session.projection.kurallar,
            formSchema.pages,
        );

        this.currentPage = this.navigationService.getCurrentPage();
        if (session.formDurumKID !== SessionStatus.TAMAMLANDI && !this.currentPage) {
            this.handleBootstrapError('Form içeriği başlatılamadı. Lütfen daha sonra tekrar deneyin.');
            return;
        }

        this.navigationService.currentPageEid$.pipe(
            takeUntil(this.destroy$),
        ).subscribe(() => {
            this.currentPage = this.navigationService.getCurrentPage();
            if (this.surface === 'active') {
                this.queueScrollReset();
            }
            this.cdr.markForCheck();
        });

        if (session.formDurumKID !== SessionStatus.TAMAMLANDI) {
            this.setupAutoSave();
        }

        this.bootstrapStatus = 'ready';
        this.surface = session.formDurumKID === SessionStatus.TAMAMLANDI ? 'completed' : 'entry';
        this.cdr.markForCheck();
    }

    private buildPageSnapshotRequest(page: PageSchema): UserFormSavePageRequest {
        return this.snapshotBuilder.buildPageSaveRequest(this.session!.eid, page, this.stateStore);
    }

    private applySnapshotResponse(response: UserFormSavePageResponse): void {
        this.stateStore.setIssues(response.hatalar ?? []);
        this.formIssues = response.hatalar ?? [];

        if (response.ilerlemeDurumu) {
            this.formProgress = response.ilerlemeDurumu;
        }

        if (!response.pageState) {
            return;
        }

        this.stateStore.mergePageState(response.pageState);
        this.navigationService.reconcile();

        if (this.session && response.formDurumKID) {
            this.session.formDurumKID = response.formDurumKID;
        }
    }

    private setupAutoSave(): void {
        this.stateStore.saveRequests$
            .pipe(
                debounceTime(FormRespondentShellComponent.AUTO_SAVE_DEBOUNCE_MS),
                filter(() => this.canAutoSaveCurrentPage()),
                tap(() => {
                    this.isSaving = true;
                    this.cdr.markForCheck();
                }),
                switchMap(() => {
                    const currentPage = this.navigationService.getCurrentPage();
                    if (!currentPage) {
                        return of(null);
                    }

                    const request = this.buildPageSnapshotRequest(currentPage);
                    return this.apiService.saveUserFormPage(request).pipe(
                        catchError(() => of(null)),
                    );
                }),
                takeUntil(this.destroy$),
            )
            .subscribe((response) => {
                this.isSaving = false;
                if (response) {
                    this.applySnapshotResponse(response);
                }

                this.cdr.markForCheck();
            });
    }

    private canAutoSaveCurrentPage(): boolean {
        return !!this.session
            && this.surface === 'active'
            && !this.isPreview
            && !this.navigationBusy
            && !this.submitting
            && !!this.navigationService.getCurrentPage()
            && this.hasDirty;
    }

    private getIssueHtml(issues: UserFormIssue[] | null | undefined, mainMessage?: string): string {
        let html = '';

        if (mainMessage) {
            html += `<div class="font-semibold mb-2 text-left">${mainMessage}</div>`;
        }

        if (issues?.length) {
            const uniqueMessages = issues
                .map((issue) => issue.message || issue.details)
                .filter((message, index, list) => !!message && list.indexOf(message) === index);

            if (uniqueMessages.length > 0) {
                html += '<ul class="text-left list-disc pl-5 space-y-1">';
                uniqueMessages.forEach((message) => {
                    html += `<li class="text-sm">${message}</li>`;
                });
                html += '</ul>';
            }
        }

        return html;
    }

    private getIssueMessages(issues: UserFormIssue[] | null | undefined): string[] {
        return (issues ?? [])
            .map((issue) => issue.message || issue.details)
            .filter((message, index, list) => !!message && list.indexOf(message) === index) as string[];
    }

    private get hasDirty(): boolean {
        return this.stateStore.hasDirtyAnswers();
    }

    private persistCurrentPage(
        errorTitle: string,
        saveErrorMessage: string,
        forceSave: boolean,
        onSuccess: () => void,
        onFailure?: () => void,
        ignoreResponseErrors = false,
        allowCompletedSurface = false,
    ): void {
        if (!this.session || this.isPreview || (this.surface !== 'active' && !allowCompletedSurface)) {
            onSuccess();
            return;
        }

        const currentPage = this.navigationService.getCurrentPage();
        if (!currentPage) {
            onSuccess();
            return;
        }

        if (!forceSave && !this.hasDirty) {
            onSuccess();
            return;
        }

        const request = this.buildPageSnapshotRequest(currentPage);

        this.apiService.saveUserFormPage(request)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response?.basarili || (ignoreResponseErrors && response)) {
                        if (response) {
                            this.applySnapshotResponse(response);
                        }

                        onSuccess();
                    } else {
                        if (response) {
                            this.applySnapshotResponse(response);
                        }

                        const html = this.getIssueHtml(response?.hatalar, response?.mesaj || saveErrorMessage);
                        this.sweetAlert.showHtmlMessage('error', errorTitle, html);
                        onFailure?.();
                    }

                    this.cdr.markForCheck();
                },
                error: () => {
                    this.sweetAlert.showMessage('error', saveErrorMessage);
                    onFailure?.();
                    this.cdr.markForCheck();
                },
            });
    }

    private submitFormFlow(captureReturnState: boolean): void {
        if (!this.session) {
            return;
        }

        if (captureReturnState || !this.submitReturnState) {
            this.submitReturnState = {
                isFinalPreviewStep: this.isFinalPreviewStep,
                finalPreviewLoading: this.finalPreviewLoading,
            };
        }

        this.submitting = true;
        this.completionPhase = 'submitting';
        this.completionMessage = FormRespondentShellComponent.DEFAULT_COMPLETION_MESSAGE;
        this.completionErrorDetails = [];
        this.surface = 'completed';
        this.isFinalPreviewStep = false;
        this.finalPreviewLoading = false;
        this.queueScrollReset();
        this.cdr.markForCheck();

        const saveAndSubmit = () => {
            this.apiService.submitUserForm(this.session!.eid).pipe(
                takeUntil(this.destroy$),
            ).subscribe({
                next: (response) => {
                    this.submitting = false;

                    if (response?.basarili) {
                        this.session!.formDurumKID = SessionStatus.TAMAMLANDI;
                        this.completionMessage = response.mesaj?.trim() || FormRespondentShellComponent.DEFAULT_COMPLETION_MESSAGE;
                        this.completionErrorDetails = [];
                        this.completionPhase = 'success';
                        this.isFinalPreviewStep = false;
                        this.finalPreviewLoading = false;
                        this.surface = 'completed';
                    } else {
                        this.showSubmitInlineError(response?.mesaj || 'Gönderim sırasında hata oluştu', response?.hatalar);
                    }

                    this.cdr.markForCheck();
                },
                error: () => {
                    this.submitting = false;
                    this.showSubmitInlineError('Gönderim sırasında hata oluştu');
                    this.cdr.markForCheck();
                },
            });
        };

        this.persistCurrentPage(
            'Hata',
            'Cevaplar kaydedilirken hata oluştu',
            false,
            saveAndSubmit,
            () => {
                this.submitting = false;
                this.showSubmitInlineError('Cevaplar kaydedilirken hata oluştu');
            },
            false,
            true,
        );
    }

    private showSubmitInlineError(message: string, issues?: UserFormIssue[] | null): void {
        this.surface = 'completed';
        this.completionPhase = 'error';
        this.completionMessage = message;
        this.completionErrorDetails = this.getIssueMessages(issues);
        this.isFinalPreviewStep = false;
        this.finalPreviewLoading = false;
    }

    private restoreActiveSurface(): void {
        this.surface = 'active';
        this.completionPhase = 'success';
        this.completionMessage = FormRespondentShellComponent.DEFAULT_COMPLETION_MESSAGE;
        this.completionErrorDetails = [];
        this.isFinalPreviewStep = this.submitReturnState?.isFinalPreviewStep ?? false;
        this.finalPreviewLoading = this.submitReturnState?.finalPreviewLoading ?? false;
        this.queueScrollReset();
    }

    private navigateNext(): void {
        const answers = this.stateStore.getTopAnswersSnapshot();
        const targetPage = this.ruleEngine.getNextPageEid(
            this.navigationService.getCurrentPageEid(),
            answers,
        );
        this.navigationService.goNext(targetPage ?? undefined);
    }

    private queueScrollReset(): void {
        if (typeof window === 'undefined') {
            return;
        }

        if (this.pendingScrollResetFrame !== null) {
            window.cancelAnimationFrame(this.pendingScrollResetFrame);
        }

        this.pendingScrollResetFrame = window.requestAnimationFrame(() => {
            this.resetScrollPosition();
            this.pendingScrollResetFrame = null;
        });
    }

    private resetScrollPosition(): void {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

        if (this.mainShellRef?.nativeElement) {
            this.mainShellRef.nativeElement.scrollTop = 0;
        }

        const drawerContent = document.querySelector('.mat-drawer-content') as HTMLElement | null;
        if (drawerContent) {
            drawerContent.scrollTop = 0;
        }
    }

    private handleBootstrapError(message: string): void {
        this.bootstrapStatus = 'error';
        this.surface = 'error';
        this.loadErrorMessage = message;
        this.cdr.markForCheck();
    }

    private countQuestions(pages: readonly PageSchema[]): number {
        return pages.reduce((total, page) => total + this.countQuestionTree(page.questions), 0);
    }

    private countQuestionTree(questions: readonly QuestionSchema[]): number {
        return questions.reduce((total, question) => {
            const selfCount = question.questionTypeId === QuestionTypeId.ACIKLAMA ? 0 : 1;
            return total + selfCount + this.countQuestionTree(question.children ?? []);
        }, 0);
    }

    private formStateHasSavedProgress(formState: UserFormState | null | undefined): boolean {
        return (formState?.sayfalar ?? []).some((page) => page.sorular.some((question) => this.questionStateHasProgress(question)));
    }

    private questionStateHasProgress(questionState: UserFormQuestionState): boolean {
        if (questionState.grupInstances?.length) {
            return questionState.grupInstances.some((instance) => this.groupInstanceHasProgress(instance));
        }

        return this.answerHasValue(questionState.answer);
    }

    private groupInstanceHasProgress(groupInstance: UserFormGroupInstanceState): boolean {
        return groupInstance.sorular.some((question) => this.questionStateHasProgress(question));
    }

    private answerHasValue(answer: UserFormQuestionState['answer']): boolean {
        if (!answer) {
            return false;
        }

        return Boolean(
            answer.cevapMetni?.trim()
            || (answer.cevapSayi !== null && answer.cevapSayi !== undefined)
            || answer.cevapTarih?.trim()
            || (answer.cevapMantiksal !== null && answer.cevapMantiksal !== undefined)
            || answer.secenekKokEidDto?.eid
            || answer.ekAciklama?.trim()
            || (answer.secilenSecenekKokEidDtoler?.length ?? 0) > 0
            || (answer.matrisCevaplar?.length ?? 0) > 0
            || (answer.dosyalar?.length ?? 0) > 0
        );
    }
}
