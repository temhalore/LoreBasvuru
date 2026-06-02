import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormIlermeDto } from '../../../../models/question-answer.model';

@Component({
    selector: 'app-form-respondent-entry-state',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule],
    templateUrl: './form-respondent-entry-state.component.html',
    styleUrls: ['./form-respondent-entry-state.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormRespondentEntryStateComponent {
    @Input() title = '';
    @Input() description = '';
    @Input() pageCount = 0;
    @Input() questionCount = 0;
    @Input() progress: FormIlermeDto | null = null;
    @Input() hasSavedProgress = false;
    @Input() startEnabled = false;
    @Input() loading = true;

    @Output() readonly start = new EventEmitter<void>();

    get resolvedTitle(): string {
        return this.title.trim() || 'Form hazırlanıyor';
    }

    get resolvedDescription(): string {
        return this.description.trim() || 'Form içeriği yükleniyor. Kısa bir hazırlığın ardından doldurmaya başlayabilirsiniz.';
    }

    get hasSavedDraft(): boolean {
        return !this.loading && this.hasSavedProgress;
    }

    get showProgress(): boolean {
        return this.hasSavedDraft && !!this.progress && this.progress.toplamGorunurSoru > 0;
    }

    get showMeta(): boolean {
        return !this.loading && !this.hasSavedDraft && (this.pageCount > 0 || this.questionCount > 0);
    }

    get metaText(): string {
        const parts: string[] = [];

        if (this.pageCount > 0) {
            parts.push(`${this.pageCount} sayfa`);
        }

        if (this.questionCount > 0) {
            parts.push(`${this.questionCount} soru`);
        }

        return parts.join(' / ');
    }

    get progressLabel(): string {
        return `%${this.progress?.yuzdeOrani ?? 0} Tamamlandı`;
    }

    get progressDetail(): string {
        return `${this.progress?.tamamlananSoru ?? 0}/${this.progress?.toplamGorunurSoru ?? 0} soru tamamlandı`;
    }

    get actionLabel(): string {
        if (this.loading) {
            return 'Hazırlanıyor';
        }

        return this.hasSavedDraft ? 'Devam et' : 'Başla';
    }

    get actionHint(): string {
        if (this.loading) {
            return 'Form hazır olduğunda buton otomatik olarak aktifleşecektir.';
        }

        return this.hasSavedDraft
            ? 'Kayıtlı yanıtlarınızla kaldığınız yerden devam edebilirsiniz.'
            : 'Hazır olduğunuzda formu doldurmaya başlayabilirsiniz.';
    }
}
