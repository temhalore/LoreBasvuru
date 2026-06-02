import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-question-editor-styles-host',
    standalone: true,
    template: '',
    styleUrls: ['./question-editor-styles-host.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionEditorStylesHostComponent {}
