import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { map, BehaviorSubject, combineLatest } from 'rxjs';
import { QuestionPreviewRuleEngineService } from '../../rules/question-preview-rule-engine.service';
import { QuestionPreviewStateStore } from '../../stores/question-preview-state.store';
import { PreviewGroupPortService } from '../../stores/preview-group-port.service';
import { REPEATING_GROUP_PORT } from '../../questions/repeating-group-question/repeating-group.port';
import { QuestionPreviewHostComponent } from '../question-preview-host/question-preview-host.component';
import { FormViewPageHeaderComponent } from '../form-view-page-header/form-view-page-header.component';
import { PageSchema } from '../../../models/form-schema.model';
import { QuestionAnswerModel } from '../../../models/question-answer.model';

@Component({
    selector: 'app-preview-question-page',
    standalone: true,
    imports: [CommonModule, QuestionPreviewHostComponent, FormViewPageHeaderComponent],
    templateUrl: './preview-question-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        QuestionPreviewStateStore,
        QuestionPreviewRuleEngineService,
        PreviewGroupPortService,
        { provide: REPEATING_GROUP_PORT, useExisting: PreviewGroupPortService },
    ],
})
export class PreviewQuestionPageComponent implements OnChanges {
    @Input() page: PageSchema | null = null;
    @Input() initialAnswers: Record<string, QuestionAnswerModel> = {};

    private readonly pageSubject = new BehaviorSubject<PageSchema | null>(null);

    readonly resolvedPage$ = combineLatest([
        this.pageSubject.asObservable(),
        this.previewStateStore.answers$,
    ]).pipe(
        map(([page]) => this.previewRuleEngine.applyPage(page)),
    );

    constructor(
        private readonly previewStateStore: QuestionPreviewStateStore,
        private readonly previewRuleEngine: QuestionPreviewRuleEngineService,
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['page'] || changes['initialAnswers']) {
            this.pageSubject.next(this.page);
            this.previewStateStore.initializePage(this.initialAnswers);
        }
    }

    trackByEid(_: number, item: { eid: string }): string {
        return item.eid;
    }
}
