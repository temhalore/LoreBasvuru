import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { Router } from '@angular/router';
import { Subject, Subscription, combineLatest, map, takeUntil } from 'rxjs';
import { FormPreviewModel } from './models/form-preview.model';
import { FormPreviewShellComponent } from './components/form-preview-shell/form-preview-shell.component';
import { MyApplicationService } from '../../../application-operations/pages/my-applications/my-applications.service';

interface FormPreviewScreenState {
    previewSource: FormPreviewModel['source'] | null;
    formKokEid: string | null;
    kullaniciFormEid: string | null;
}

type PreviewFromPage = 'my-applications' | 'applications' | 'reporter-applications';

@Component({
    selector: 'app-form-preview-screen',
    standalone: true,
    imports: [CommonModule, FormPreviewShellComponent],
    templateUrl: './form-preview-screen.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormPreviewScreenComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private pdfSubscription?: Subscription;

    resolvingRoute = true;
    previewSource: FormPreviewModel['source'] | null = null;
    formKokEid: string | null = null;
    kullaniciFormEid: string | null = null;
    applicationEid: string | null = null;
    fromPage: PreviewFromPage | null = null;
    pdfDownloading = false;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly location: Location,
        private readonly applicationService: MyApplicationService,
        private readonly cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        combineLatest([
            this.route.data,
            this.route.paramMap,
            this.route.queryParamMap,
        ]).pipe(
            map(([data, paramMap, queryParamMap]) => this.resolveRouteState(data, paramMap, queryParamMap)),
            takeUntil(this.destroy$),
        ).subscribe((state) => {
            this.previewSource = state.previewSource;
            this.formKokEid = state.formKokEid;
            this.kullaniciFormEid = state.kullaniciFormEid;
            this.fromPage = this.resolveFromPage(this.route.snapshot.queryParamMap.get('from'));
            this.applicationEid = this.normalizeString(this.route.snapshot.queryParamMap.get('applicationEid')) || null;
            this.resolvingRoute = false;
        });
    }

    get backButtonLabel(): string {
        switch (this.fromPage) {
            case 'my-applications':
                return 'Başvurularıma Dön';
            case 'applications':
                return 'Tüm Başvurulara Dön';
            case 'reporter-applications':
                return 'İşlem Bekleyen Başvurulara Dön';
            default:
                return 'Geri Dön';
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.pdfSubscription?.unsubscribe();
    }

    get showPdfButton(): boolean {
        return this.previewSource === 'session' && !!this.applicationEid;
    }

    onPdfDownload(): void {
        if (!this.applicationEid || this.pdfDownloading) return;

        this.pdfDownloading = true;
        this.cdr.markForCheck();

        this.pdfSubscription = this.applicationService.DownloadPdf(this.applicationEid).subscribe({
            next: (response) => {
                const blob = response.body;
                if (!blob) return;

                const contentDisposition = response.headers.get('Content-Disposition');
                let fileName = 'basvuru.pdf';
                if (contentDisposition) {
                    const match = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^;'"\n]+)/i);
                    if (match?.[1]) {
                        fileName = decodeURIComponent(match[1].trim());
                    }
                }

                const url = window.URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = fileName;
                anchor.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => {},
            complete: () => {
                this.pdfDownloading = false;
                this.cdr.markForCheck();
            },
        });
    }

    private resolveRouteState(data: Data, paramMap: ParamMap, queryParamMap: ParamMap): FormPreviewScreenState {
        const routeSource = this.normalizeSource(data['previewSource']);
        const querySource = this.normalizeSource(queryParamMap.get('source') ?? queryParamMap.get('previewSource'));
        const previewSource = querySource ?? routeSource;

        const formKokEid = this.normalizeString(queryParamMap.get('formKokEid'))
            || this.normalizeString(paramMap.get('formKokEid'));
        const kullaniciFormEid = this.normalizeString(queryParamMap.get('kullaniciFormEid'))
            || this.normalizeString(paramMap.get('kullaniciFormEid'));

        if (previewSource === 'draft') {
            return {
                previewSource,
                formKokEid: formKokEid || null,
                kullaniciFormEid: null,
            };
        }

        if (previewSource === 'session') {
            return {
                previewSource,
                formKokEid: null,
                kullaniciFormEid: kullaniciFormEid || null,
            };
        }

        return {
            previewSource: null,
            formKokEid: formKokEid || null,
            kullaniciFormEid: kullaniciFormEid || null,
        };
    }

    private normalizeSource(value: unknown): FormPreviewModel['source'] | null {
        return value === 'draft' || value === 'session' ? value : null;
    }

    private normalizeString(value: string | null | undefined): string {
        return typeof value === 'string' ? value.trim() : '';
    }

    onBackClick(): void {
        const targetRoute = this.getBackRouteBySource(this.fromPage);

        if (targetRoute) {
            void this.router.navigate(targetRoute);
            return;
        }

        this.location.back();
    }

    private resolveFromPage(value: string | null): PreviewFromPage | null {
        if (value === 'my-applications' || value === 'applications' || value === 'reporter-applications') {
            return value;
        }

        return null;
    }

    private getBackRouteBySource(source: PreviewFromPage | null): string[] | null {
        switch (source) {
            case 'my-applications':
                return ['/application-operations/my-applications'];
            case 'applications':
                return ['/application-operations/applications'];
            case 'reporter-applications':
                return ['/application-operations/reporter-applications'];
            default:
                return null;
        }
    }
}