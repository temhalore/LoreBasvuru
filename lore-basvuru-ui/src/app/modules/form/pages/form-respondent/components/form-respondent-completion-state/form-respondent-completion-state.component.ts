import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type FormRespondentCompletionPhase = 'submitting' | 'success' | 'error';

@Component({
    selector: 'app-form-respondent-completion-state',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule],
    templateUrl: './form-respondent-completion-state.component.html',
    styleUrls: ['./form-respondent-completion-state.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormRespondentCompletionStateComponent {
    @Input() phase: FormRespondentCompletionPhase = 'success';
    @Input() title = '';
    @Input() message = '';
    @Input() errorDetails: string[] = [];

    @Output() readonly backToMyApplications = new EventEmitter<void>();
    @Output() readonly backToDashboard = new EventEmitter<void>();
    @Output() readonly backToForm = new EventEmitter<void>();
    @Output() readonly retrySubmit = new EventEmitter<void>();

    get isSubmitting(): boolean {
        return this.phase === 'submitting';
    }

    get isError(): boolean {
        return this.phase === 'error';
    }

    get eyebrowText(): string {
        if (this.isSubmitting) {
            return 'Başvuru gönderiliyor';
        }

        return this.isError ? 'Gönderim tamamlanamadı' : 'Başvuru tamamlandı';
    }

    get iconName(): string {
        return this.isError ? 'error' : 'check_circle';
    }

    get showStatusIcon(): boolean {
        return !this.isSubmitting;
    }

    get resolvedTitle(): string {
        if (this.isSubmitting) {
            return 'Başvurunuz gönderiliyor';
        }

        if (this.isError) {
            return 'Gönderim sırasında sorun oluştu';
        }

        return this.title.trim() || 'Teşekkürler';
    }

    get resolvedMessage(): string {
        if (this.isSubmitting) {
            return 'Yanıtlarınız son kez kaydediliyor ve etik kurul sürecine iletiliyor. Bu işlem birkaç saniye sürebilir.';
        }

        if (this.isError) {
            return this.message.trim() || 'Gönderim tamamlanamadı. Forma geri dönerek kontrol edebilir veya işlemi tekrar deneyebilirsiniz.';
        }

        return this.message.trim() || 'Yanıtlarınız başarıyla kaydedildi. Başvurunuz artık etik kurul sürecinde değerlendirilecektir.';
    }

    get visibleErrorDetails(): string[] {
        if (!this.isError) {
            return [];
        }

        return this.errorDetails.filter((detail, index, list) => !!detail && list.indexOf(detail) === index);
    }
}
