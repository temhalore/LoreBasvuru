import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { QuestionBaseComponent } from '../question-base.component';
import { RichTextViewComponent } from '../../components/rich-text-view/rich-text-view.component';

interface RankingItem {
    eid: string;
    label: string;
}

@Component({
    selector: 'app-ranking-question',
    standalone: true,
    imports: [CommonModule, DragDropModule, MatIconModule, RichTextViewComponent],
    templateUrl: './ranking-question.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingQuestionComponent extends QuestionBaseComponent {

    get value(): string[] {
        if ((this.answer?.rankingOrder ?? []).length > 0) {
            return this.answer?.rankingOrder ?? [];
        }

        return (this.answer?.textValue ?? '')
            .split(',')
            .map((item) => item.trim())
            .filter((item) => !!item);
    }

    get items(): RankingItem[] {
        const optionMap = new Map(this.schema.options.map((option) => [option.eid, option]));
        const orderedItems: RankingItem[] = [];
        const used = new Set<string>();

        for (const eid of this.value) {
            const option = optionMap.get(eid);
            if (!option) {
                continue;
            }

            orderedItems.push({ eid: option.eid, label: option.label });
            used.add(option.eid);
        }

        for (const option of this.schema.options) {
            if (used.has(option.eid)) {
                continue;
            }

            orderedItems.push({ eid: option.eid, label: option.label });
        }

        return orderedItems;
    }

    get answerOnlyItems(): RankingItem[] {
        const optionMap = new Map(this.schema.options.map((option) => [option.eid, option]));
        return this.value
            .map((eid) => optionMap.get(eid))
            .filter((option) => !!option)
            .map((option) => ({ eid: option!.eid, label: option!.label }));
    }

    onDrop(event: CdkDragDrop<RankingItem[]>): void {
        if (!this.canEmitAnswer()) {
            return;
        }

        const nextItems = [...this.items];
        moveItemInArray(nextItems, event.previousIndex, event.currentIndex);
        this.answerChange.emit({
            ...(this.answer ?? {}),
            rankingOrder: nextItems.map((item) => item.eid),
        });
    }
}
