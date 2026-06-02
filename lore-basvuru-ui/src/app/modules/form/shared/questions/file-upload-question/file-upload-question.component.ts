import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnChanges, OnDestroy, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { QuestionBaseComponent } from '../question-base.component';
import { QuestionFileUploadIssue, QuestionFileUploadItem } from '../../services/question-file-upload.port';
import { QuestionAnswerModel, QuestionFileModel } from '../../../models/question-answer.model';

@Component({
    selector: 'app-file-upload-question',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: './file-upload-question.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadQuestionComponent extends QuestionBaseComponent implements OnChanges, OnDestroy {

    uploadedFiles: QuestionFileModel[] = [];
    uploading = false;
    errors: string[] = [];
    dragActive = false;

    private readonly destroy$ = new Subject<void>();
    private dragDepth = 0;

    constructor(private readonly cdr: ChangeDetectorRef) {
        super();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['state'] || changes['schema']) {
            this.uploadedFiles = this.state.answer?.files ?? [];
        }
    }

    get emptyStateTitle(): string {
        if (this.isAnswerOnly) {
            return 'Yanıt verilmedi';
        }

        return 'Önizleme modu';
    }

    get emptyStateDescription(): string {
        if (this.isAnswerOnly) {
            return 'Bu soru için henüz yüklenmiş bir dosya bulunmuyor.';
        }

        return 'Bu alanda dosya yükleme kapalıdır.';
    }

    onDragEnter(event: DragEvent): void {
        if (!this.canAcceptFiles(event)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.dragDepth += 1;
        this.dragActive = true;
        this.cdr.markForCheck();
    }

    onDragOver(event: DragEvent): void {
        if (!this.canAcceptFiles(event)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'copy';
        }
    }

    onDragLeave(event: DragEvent): void {
        if (!this.canAcceptFiles(event)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.dragDepth = Math.max(0, this.dragDepth - 1);
        if (this.dragDepth === 0) {
            this.dragActive = false;
            this.cdr.markForCheck();
        }
    }

    onDrop(event: DragEvent): void {
        if (!this.canAcceptFiles(event)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const files = event.dataTransfer?.files;
        this.dragDepth = 0;
        this.dragActive = false;

        if (files?.length) {
            this.processFiles(Array.from(files));
            return;
        }

        this.cdr.markForCheck();
    }

    onFilesSelected(event: Event): void {
        if (!this.isInteractiveUploadEnabled()) {
            return;
        }

        const input = event.target as HTMLInputElement;
        const files = input.files;
        if (!files?.length) {
            return;
        }

        this.processFiles(Array.from(files));
        input.value = '';
    }

    removeUploadedFile(fileEid: string): void {
        if (!this.isInteractiveUploadEnabled()) {
            return;
        }

        this.uploadedFiles = this.uploadedFiles.filter((file) => file.eid !== fileEid);
        const nextAnswer: QuestionAnswerModel = {
            ...(this.answer ?? {}),
            files: [...this.uploadedFiles],
            deletedFileEids: [...new Set([...(this.answer?.deletedFileEids ?? []), fileEid])],
        };
        this.answerChange.emit(nextAnswer);
    }

    formatSize(sizeMb: number): string {
        if (sizeMb < 1) {
            return `${Math.max(1, Math.round(sizeMb * 1024))} KB`;
        }

        return `${sizeMb.toFixed(1)} MB`;
    }

    isInteractiveUploadEnabled(): boolean {
        return this.normalizedMode === 'runtime'
            && !!this.state.uploadCapabilities?.uploadFiles
            && !!this.state.sessionEid
            && !this.state.ruleState.disabled
            && !this.state.ruleState.readonly;
    }

    getFileExtensionLabel(file: QuestionFileModel): string {
        return this.getNormalizedExtension(file).toUpperCase();
    }

    getFileExtensionBadgeClass(file: QuestionFileModel): string {
        const extension = this.getNormalizedExtension(file);

        switch (extension) {
            case 'pdf':
                return 'question-upload-badge--pdf';
            case 'doc':
            case 'docx':
                return 'question-upload-badge--doc';
            case 'xls':
            case 'xlsx':
            case 'csv':
                return 'question-upload-badge--xls';
            case 'ppt':
            case 'pptx':
                return 'question-upload-badge--ppt';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'webp':
                return 'question-upload-badge--image';
            case 'txt':
            case 'md':
                return 'question-upload-badge--text';
            case 'zip':
            case 'rar':
            case '7z':
                return 'question-upload-badge--archive';
            default:
                return 'question-upload-badge--default';
        }
    }

    trackByFileEid(_: number, file: QuestionFileModel): string {
        return file.eid;
    }

    trackError(_: number, error: string): string {
        return error;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private processFiles(files: File[]): void {
        if (!files.length || !this.state.sessionEid || !this.isInteractiveUploadEnabled() || this.uploading) {
            return;
        }

        this.errors = [];
        this.uploading = true;
        this.cdr.markForCheck();

        const uploadItems: QuestionFileUploadItem[] = [];
        let processedCount = 0;

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1] ?? '';
                const extension = file.name.includes('.') ? file.name.split('.').pop() ?? '' : '';
                uploadItems.push({
                    fileName: file.name,
                    extension,
                    base64Data: base64,
                });

                processedCount += 1;
                if (processedCount === files.length) {
                    this.uploadFiles(uploadItems);
                }
            };
            reader.onerror = () => {
                processedCount += 1;
                this.errors.push(`${file.name} okunamadı`);
                if (processedCount === files.length) {
                    if (uploadItems.length) {
                        this.uploadFiles(uploadItems);
                    } else {
                        this.uploading = false;
                        this.cdr.markForCheck();
                    }
                }
            };
            reader.readAsDataURL(file);
        });
    }

    private uploadFiles(uploadItems: QuestionFileUploadItem[]): void {
        if (!this.state.sessionEid || !this.state.uploadCapabilities?.uploadFiles || !this.isInteractiveUploadEnabled()) {
            this.uploading = false;
            if (!this.state.uploadCapabilities?.uploadFiles && this.normalizedMode === 'runtime') {
                this.errors.push('Dosya yükleme servisi yapılandırılmadı');
            }
            this.cdr.markForCheck();
            return;
        }

        this.state.uploadCapabilities.uploadFiles({
            sessionEid: this.state.sessionEid,
            questionEid: this.schema.eid,
            groupInstanceEid: this.state.groupInstanceEid,
            files: uploadItems,
        }).pipe(
            takeUntil(this.destroy$),
        ).subscribe({
            next: (response) => {
                this.uploading = false;
                if (response) {
                    this.uploadedFiles = response.files;

                    if (response.issues.length) {
                        this.errors = response.issues.map((issue) => this.formatUploadIssue(issue));
                    } else {
                        this.errors = [];
                    }

                    const nextAnswer: QuestionAnswerModel = {
                        ...(this.answer ?? {}),
                        files: [...this.uploadedFiles],
                        deletedFileEids: [],
                    };
                    this.answerChange.emit(nextAnswer);
                }
                this.cdr.markForCheck();
            },
            error: () => {
                this.uploading = false;
                this.errors.push('Dosya yükleme sırasında hata oluştu');
                this.cdr.markForCheck();
            },
        });
    }

    private formatUploadIssue(issue: QuestionFileUploadIssue): string {
        const scope = [issue.targetType, issue.targetKey].filter((item) => !!item).join(': ');
        return scope ? `${scope} - ${issue.message}` : issue.message;
    }

    private canAcceptFiles(event: DragEvent): boolean {
        if (!this.isInteractiveUploadEnabled() || this.uploading) {
            return false;
        }

        return !!event.dataTransfer?.types?.includes('Files');
    }

    private getNormalizedExtension(file: QuestionFileModel): string {
        return (file.extension || '').trim().toLowerCase() || 'dosya';
    }
}
