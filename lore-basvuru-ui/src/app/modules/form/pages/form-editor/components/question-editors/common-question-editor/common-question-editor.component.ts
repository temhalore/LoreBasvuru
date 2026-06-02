import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CheckboxInputComponent } from 'app/shared/components/form-controls/checkbox-input/checkbox-input.component';
import { FroalaTextAreaInputComponent } from 'app/shared/components/form-controls/froala-textarea-input/froala-textarea-input.component';
import { TextInputComponent } from 'app/shared/components/form-controls/text-input/text-input.component';
import { TextareaInputComponent } from 'app/shared/components/form-controls/textarea-input/textarea-input.component';
import { QuestionEditorForm } from '../shared/question-editor-form.factory';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
    selector: 'app-common-question-editor',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FroalaTextAreaInputComponent,
        TextareaInputComponent,
        TextInputComponent,
        MatSlideToggleModule,
        // CheckboxInputComponent,
    ],
    templateUrl: './common-question-editor.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonQuestionEditorComponent {
    @Input({ required: true }) form!: QuestionEditorForm;
    @Input() descriptionOnly = false;
}
