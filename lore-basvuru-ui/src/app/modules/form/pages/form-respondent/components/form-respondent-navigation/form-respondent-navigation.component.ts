import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormNavigationService } from '../../services/form-navigation.service';
import { ActionButtonComponent } from 'app/shared/components/action-button/action-button.component';

@Component({
    selector: 'app-form-respondent-navigation',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ActionButtonComponent],
    templateUrl: './form-respondent-navigation.component.html',
})
export class FormRespondentNavigationComponent {

    @Input() submitting = false;
    @Input() navigationBusy = false;
    @Input() readonly = false;
    @Input() stretchContent = true;
    @Input() enableFinalPreviewStep = false;
    @Input() isFinalPreviewStep = false;
    @Input() isLastFormPage = false;
    @Input() previewLoading = false;
    @Output() next = new EventEmitter<void>();
    @Output() back = new EventEmitter<void>();
    @Output() saveAndExit = new EventEmitter<void>();
    @Output() submit = new EventEmitter<void>();

    constructor(public navigationService: FormNavigationService) {}

    get isFirst(): boolean {
        return this.navigationService.isFirstPage();
    }

    get isLast(): boolean {
        return this.navigationService.isLastPage();
    }

    get currentPage(): number {
        return this.navigationService.getProgress().current;
    }

    get pageMarkers(): number[] {
        const total = this.navigationService.getProgress().total;
        return Array.from({ length: total }, (_, index) => index + 1);
    }

    get isReadonlyLastPage(): boolean {
        return this.readonly && this.isEffectiveLastStep;
    }

    get isActionDisabled(): boolean {
        return this.submitting || this.navigationBusy;
    }

    get canGoBack(): boolean {
        return this.isFinalPreviewStep || !this.isFirst;
    }

    get isEffectiveLastStep(): boolean {
        return this.isFinalPreviewStep || (!this.enableFinalPreviewStep && this.isLastFormPage);
    }

    get showSubmit(): boolean {
        return this.isEffectiveLastStep && !this.readonly;
    }

    get showNext(): boolean {
        return !this.isEffectiveLastStep;
    }

    get isSubmitDisabled(): boolean {
        return this.isActionDisabled || (this.isFinalPreviewStep && this.previewLoading);
    }
}
