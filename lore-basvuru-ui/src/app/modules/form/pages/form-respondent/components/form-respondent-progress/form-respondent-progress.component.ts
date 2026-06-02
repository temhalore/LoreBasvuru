import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormIlermeDto, UserFormIssue } from '../../../../models/question-answer.model';

@Component({
    selector: 'app-form-respondent-progress',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, MatIconModule],
    templateUrl: './form-respondent-progress.component.html',
})
export class FormRespondentProgressComponent {
    @Input() progress: FormIlermeDto | null = null;
    @Input() isSaving = false;
    @Input() issues: UserFormIssue[] = [];

    isPopoverOpen = false;

    constructor(
        private readonly elementRef: ElementRef,
        private readonly cdr: ChangeDetectorRef,
    ) {}

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isPopoverOpen = false;
            this.cdr.markForCheck();
        }
    }

    togglePopover(event: MouseEvent): void {
        event.stopPropagation();
        this.isPopoverOpen = !this.isPopoverOpen;
    }
}
