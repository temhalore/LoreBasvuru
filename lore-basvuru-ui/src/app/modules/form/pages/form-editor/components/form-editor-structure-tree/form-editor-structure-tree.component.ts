import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FormDto, QuestionDto } from '../../../../models';
import { richTextToPlainText } from '../../../../shared/utils/rich-text.util';

@Component({
    selector: 'app-form-editor-structure-tree',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, MatIconModule],
    templateUrl: './form-editor-structure-tree.component.html',
    styleUrls: ['./form-editor-structure-tree.component.scss'],
})
export class FormEditorStructureTreeComponent implements OnChanges {
    @Input() form: FormDto | null = null;
    @Input() activePageEid: string | null = null;
    @Input() selectedNodeEid: string | null = null;
    @Input() collapsedPageEids: string[] = [];
    @Input() collapsedQuestionEids: string[] = [];
    @Input() revealNodeEid: string | null = null;
    @Input() revealRevision = 0;

    @Output() readonly nodeSelect = new EventEmitter<string>();
    @Output() readonly pageToggle = new EventEmitter<string>();
    @Output() readonly questionToggle = new EventEmitter<string>();

    @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLElement>;

    pageCount = 0;
    totalQuestionCount = 0;
    private readonly pageQuestionCounts = new Map<string, number>();
    private collapsedPageSet = new Set<string>();
    private collapsedQuestionSet = new Set<string>();

    constructor(private readonly cdr: ChangeDetectorRef) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['form']) {
            this.recomputeCounts();
        }

        if (changes['collapsedPageEids']) {
            this.collapsedPageSet = new Set(this.collapsedPageEids);
        }

        if (changes['collapsedQuestionEids']) {
            this.collapsedQuestionSet = new Set(this.collapsedQuestionEids);
        }

        if ((changes['revealRevision'] || changes['revealNodeEid']) && this.revealNodeEid) {
            this.scrollToNode(this.revealNodeEid);
        }
    }

    countForPage(pageEid: string): number {
        return this.pageQuestionCounts.get(pageEid) ?? 0;
    }

    selectNode(nodeEid: string): void {
        this.nodeSelect.emit(nodeEid);
    }

    togglePage(pageEid: string): void {
        this.pageToggle.emit(pageEid);
    }

    toggleQuestion(questionEid: string): void {
        this.questionToggle.emit(questionEid);
    }

    isPageCollapsed(pageEid: string): boolean {
        return this.collapsedPageSet.has(pageEid);
    }

    isQuestionCollapsed(questionEid: string): boolean {
        return this.collapsedQuestionSet.has(questionEid);
    }

    trackByEid(_: number, item: { eid: string }): string {
        return item.eid;
    }

    questionLabel(question: QuestionDto, fallback: string): string {
        return richTextToPlainText(question.soruMetni).trim() || fallback;
    }

    questionHasChildren(question: QuestionDto): boolean {
        return (question.altSorular?.length ?? 0) > 0;
    }

    private recomputeCounts(): void {
        this.pageQuestionCounts.clear();
        const pages = this.form?.sayfalar ?? [];
        let total = 0;

        for (const page of pages) {
            const count = this.flattenQuestionCount(page.sorular ?? []);
            this.pageQuestionCounts.set(page.eid, count);
            total += count;
        }

        this.pageCount = pages.length;
        this.totalQuestionCount = total;
        this.cdr.markForCheck();
    }

    private flattenQuestionCount(questions: QuestionDto[]): number {
        return questions.reduce((total, question) => total + 1 + this.flattenQuestionCount(question.altSorular ?? []), 0);
    }

    private scrollToNode(nodeEid: string): void {
        setTimeout(() => {
            const container = this.scrollContainer?.nativeElement;
            if (!container) {
                return;
            }

            const element = container.querySelector<HTMLElement>(`[data-tree-eid="${nodeEid}"]`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 60);
    }
}
