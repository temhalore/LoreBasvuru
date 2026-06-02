import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormIlermeDto, UserFormIssue } from '../../../../models/question-answer.model';
import { FormRespondentProgressComponent } from '../form-respondent-progress/form-respondent-progress.component';

@Component({
    selector: 'app-form-respondent-header',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormRespondentProgressComponent],
    templateUrl: './form-respondent-header.component.html',
})
export class FormRespondentHeaderComponent {
    @Input() baslik: string = '';
    @Input() aciklama: string = '';
    @Input() stretchContent = true;
    @Input() progress: FormIlermeDto | null = null;
    @Input() isSaving = false;
    @Input() issues: UserFormIssue[] = [];
}
