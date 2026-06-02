import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageSchema } from '../../../../models/form-schema.model';
import { QuestionHostComponent } from '../question-host/question-host.component';
import { FormViewPageHeaderComponent } from '../../../../shared/components/form-view-page-header/form-view-page-header.component';

@Component({
    selector: 'app-form-respondent-page',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, QuestionHostComponent, FormViewPageHeaderComponent],
    templateUrl: './form-respondent-page.component.html',
})
export class FormRespondentPageComponent {
    @Input() page!: PageSchema;
    @Input() sessionEid!: string;
    @Input() readonly = false;
    @Input() stretchContent = true;
}
