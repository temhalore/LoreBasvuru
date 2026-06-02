import { CommonModule } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { MatIconModule } from '@angular/material/icon';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    OnDestroy,
    Output,
    ViewChild,
} from '@angular/core';
import { DateQuestionComponent } from '../../questions/date-question/date-question.component';
import { DropdownQuestionComponent } from '../../questions/dropdown-question/dropdown-question.component';
import { FileUploadQuestionComponent } from '../../questions/file-upload-question/file-upload-question.component';
import { MatrixMultiQuestionComponent } from '../../questions/matrix-multi-question/matrix-multi-question.component';
import { MatrixSingleQuestionComponent } from '../../questions/matrix-single-question/matrix-single-question.component';
import { MultiChoiceQuestionComponent } from '../../questions/multi-choice-question/multi-choice-question.component';
import { NumberQuestionComponent } from '../../questions/number-question/number-question.component';
import { RatingQuestionComponent } from '../../questions/rating-question/rating-question.component';
import { RankingQuestionComponent } from '../../questions/ranking-question/ranking-question.component';
import { RepeatingGroupQuestionComponent } from '../../questions/repeating-group-question/repeating-group-question.component';
import { ScaleQuestionComponent } from '../../questions/scale-question/scale-question.component';
import { SingleChoiceQuestionComponent } from '../../questions/single-choice-question/single-choice-question.component';
import { TextQuestionComponent } from '../../questions/text-question/text-question.component';
import { TimeQuestionComponent } from '../../questions/time-question/time-question.component';
import { QuestionAnswerModel, UserFormIssue } from '../../../models/question-answer.model';
import { QuestionSchema, QuestionTypeId } from '../../../models/form-schema.model';
import { DEFAULT_QUESTION_RENDER_STATE, QuestionRenderState } from '../../models/question-render-state.model';
import { RichTextViewComponent } from '../rich-text-view/rich-text-view.component';
import { isRichTextEmpty } from '../../utils/rich-text.util';

@Component({
    selector: 'app-question-type-renderer',
    standalone: true,
    imports: [
        CommonModule,
        OverlayModule,
        MatIconModule,
        TextQuestionComponent,
        NumberQuestionComponent,
        DateQuestionComponent,
        TimeQuestionComponent,
        FileUploadQuestionComponent,
        SingleChoiceQuestionComponent,
        MultiChoiceQuestionComponent,
        DropdownQuestionComponent,
        ScaleQuestionComponent,
        RatingQuestionComponent,
        RankingQuestionComponent,
        MatrixSingleQuestionComponent,
        MatrixMultiQuestionComponent,
        RepeatingGroupQuestionComponent,
        RichTextViewComponent,
    ],
    templateUrl: './question-type-renderer.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionTypeRendererComponent implements OnDestroy {
    private static readonly HELP_CARD_OPEN_DELAY_MS = 1000;
    private static readonly HELP_CARD_CLOSE_DELAY_MS = 180;

    @Input() schema!: QuestionSchema;
    @Input() state: QuestionRenderState = DEFAULT_QUESTION_RENDER_STATE;
    @Input() issues: UserFormIssue[] = [];

    @Output() readonly answerChange = new EventEmitter<QuestionAnswerModel>();

    @ViewChild('helpBadgeTrigger', { read: ElementRef }) private helpBadgeTriggerRef?: ElementRef<HTMLElement>;
    @ViewChild('helpCardPanel', { read: ElementRef }) private helpCardPanelRef?: ElementRef<HTMLElement>;

    readonly QuestionTypeId = QuestionTypeId;
    readonly helpCardPositions: ConnectedPosition[] = [
        {
            originX: 'end',
            originY: 'top',
            overlayX: 'end',
            overlayY: 'bottom',
            offsetY: -10,
        },
        {
            originX: 'end',
            originY: 'bottom',
            overlayX: 'end',
            overlayY: 'top',
            offsetY: 10,
        },
    ];

    private helpOpenTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private helpCloseTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private helpBadgeHovered = false;
    private helpCardHovered = false;
    private helpCardHoverOpen = false;
    private helpCardPinnedOpen = false;

    onAnswerChange(answer: QuestionAnswerModel): void {
        this.answerChange.emit(answer);
    }

    trackIssue(_: number, issue: UserFormIssue): string {
        return `${issue.code}:${issue.targetEid ?? issue.targetKey}:${issue.message}`;
    }

    get questionTypeLabel(): string {
        switch (this.schema.questionTypeId) {
            case QuestionTypeId.ACIKLAMA:         return 'Açıklama';
            case QuestionTypeId.KISA_METIN:       return 'Kısa Metin';
            case QuestionTypeId.UZUN_METIN:       return 'Uzun Metin';
            case QuestionTypeId.TEK_SECIM:        return 'Tek Seçim';
            case QuestionTypeId.COK_SECIM:        return 'Çok Seçim';
            case QuestionTypeId.ACILIR_LISTE:     return 'Açılır Liste';
            case QuestionTypeId.OLCEK:            return 'Ölçek';
            case QuestionTypeId.DERECELENDIRME:   return 'Derecelendirme';
            case QuestionTypeId.MATRIS_TEK_SECIM: return 'Matris Tek Seçim';
            case QuestionTypeId.MATRIS_COK_SECIM: return 'Matris Çok Seçim';
            case QuestionTypeId.TARIH:            return 'Tarih';
            case QuestionTypeId.SAAT:             return 'Saat';
            case QuestionTypeId.SAYI:             return 'Sayı';
            case QuestionTypeId.DOSYA_YUKLEME:    return 'Dosya Yükleme';
            case QuestionTypeId.SIRALAMA:         return 'Sıralama';
            case QuestionTypeId.TEKRARLI_GRUP:    return 'Tekrarlı Grup';
            default:                              return `Tip ${this.schema.questionTypeId}`;
        }
    }

    get isDescriptionQuestion(): boolean {
        return this.schema.questionTypeId === QuestionTypeId.ACIKLAMA;
    }

    get questionOrder(): string {
        const order = this.schema?.order;

        return typeof order === 'number' && order > 0 ? `${order}.` : '';
    }

    get hasHelpText(): boolean {
        return !isRichTextEmpty(this.schema?.helpText);
    }

    get showMetaArea(): boolean {
        return this.hasHelpText || this.state.ruleState.required;
    }

    get helpBadgeAriaLabel(): string {
        return this.helpCardOpen ? 'Yardım metnini gizle' : 'Yardım metnini göster';
    }

    get helpCardId(): string {
        return `question-help-card-${this.schema?.eid ?? 'unknown'}`;
    }

    get helpCardOpen(): boolean {
        return this.helpCardPinnedOpen || this.helpCardHoverOpen;
    }

    ngOnDestroy(): void {
        this.clearHelpOpenTimer();
        this.clearHelpCloseTimer();
    }

    onHelpBadgeMouseEnter(): void {
        if (!this.hasHelpText) {
            return;
        }

        this.helpBadgeHovered = true;
        this.clearHelpCloseTimer();

        if (this.helpCardOpen) {
            return;
        }

        this.clearHelpOpenTimer();
        this.helpOpenTimeoutId = setTimeout(() => {
            this.helpOpenTimeoutId = null;
            if (this.helpBadgeHovered) {
                this.helpCardHoverOpen = true;
            }
        }, QuestionTypeRendererComponent.HELP_CARD_OPEN_DELAY_MS);
    }

    onHelpBadgeMouseLeave(): void {
        this.helpBadgeHovered = false;
        this.clearHelpOpenTimer();
        this.scheduleHelpCardClose();
    }

    onHelpBadgeClick(event: MouseEvent): void {
        if (!this.hasHelpText) {
            return;
        }

        event.stopPropagation();
        this.clearHelpOpenTimer();
        this.clearHelpCloseTimer();
        this.helpCardPinnedOpen = !this.helpCardPinnedOpen;

        if (!this.helpCardPinnedOpen && !this.helpBadgeHovered && !this.helpCardHovered) {
            this.helpCardHoverOpen = false;
        }
    }

    onHelpCardMouseEnter(): void {
        this.helpCardHovered = true;
        this.clearHelpCloseTimer();
    }

    onHelpCardMouseLeave(): void {
        this.helpCardHovered = false;
        this.scheduleHelpCardClose();
    }

    onHelpCardClick(event: MouseEvent): void {
        event.stopPropagation();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.helpCardOpen) {
            return;
        }

        const target = event.target as Node | null;
        if (this.isNodeWithinHelpUi(target)) {
            return;
        }

        this.closeHelpCard();
    }

    @HostListener('document:keydown.escape', ['$event'])
    onEscapeKey(event: KeyboardEvent): void {
        if (!this.helpCardOpen) {
            return;
        }

        event.stopPropagation();
        this.closeHelpCard();
    }

    private scheduleHelpCardClose(): void {
        this.clearHelpCloseTimer();
        this.helpCloseTimeoutId = setTimeout(() => {
            this.helpCloseTimeoutId = null;
            if (this.helpBadgeHovered || this.helpCardHovered || this.helpCardPinnedOpen) {
                return;
            }

            this.helpCardHoverOpen = false;
        }, QuestionTypeRendererComponent.HELP_CARD_CLOSE_DELAY_MS);
    }

    private closeHelpCard(): void {
        this.clearHelpOpenTimer();
        this.clearHelpCloseTimer();
        this.helpBadgeHovered = false;
        this.helpCardHovered = false;
        this.helpCardHoverOpen = false;
        this.helpCardPinnedOpen = false;
    }

    private clearHelpOpenTimer(): void {
        if (!this.helpOpenTimeoutId) {
            return;
        }

        clearTimeout(this.helpOpenTimeoutId);
        this.helpOpenTimeoutId = null;
    }

    private clearHelpCloseTimer(): void {
        if (!this.helpCloseTimeoutId) {
            return;
        }

        clearTimeout(this.helpCloseTimeoutId);
        this.helpCloseTimeoutId = null;
    }

    private isNodeWithinHelpUi(node: Node | null): boolean {
        const badgeTrigger = this.helpBadgeTriggerRef?.nativeElement;
        const helpCardPanel = this.helpCardPanelRef?.nativeElement;

        return !!node && (
            !!badgeTrigger?.contains(node)
            || !!helpCardPanel?.contains(node)
        );
    }
}
