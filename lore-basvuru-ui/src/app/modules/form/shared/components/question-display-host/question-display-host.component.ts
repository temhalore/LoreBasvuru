import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { QuestionTypeRendererComponent } from '../question-type-renderer/question-type-renderer.component';
import { QuestionSchema } from '../../../models/form-schema.model';
import { buildQuestionRenderState, DEFAULT_UI_RULE_STATE, QuestionRenderState } from '../../models/question-render-state.model';

@Component({
    selector: 'app-question-display-host',
    standalone: true,
    imports: [CommonModule, QuestionTypeRendererComponent],
    templateUrl: './question-display-host.component.html',
    styleUrls: ['./question-display-host.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionDisplayHostComponent {
    @Input() schema!: QuestionSchema;
    @Input() selectedNodeEid: string | null = null;

    @Output() readonly select = new EventEmitter<string>();

    onSelect(nodeEid: string): void {
        this.select.emit(nodeEid);
    }

    get renderState(): QuestionRenderState {
        return buildQuestionRenderState({
            mode: 'editor',
            ruleState: {
                ...DEFAULT_UI_RULE_STATE,
                required: this.schema.required,
            },
        });
    }
}
