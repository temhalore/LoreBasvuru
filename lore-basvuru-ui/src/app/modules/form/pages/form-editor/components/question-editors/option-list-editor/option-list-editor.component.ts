import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { OptionDto } from '../../../../../models';
import { FroalaTextAreaInputComponent } from 'app/shared/components/form-controls/froala-textarea-input/froala-textarea-input.component';
import { TextInputComponent } from 'app/shared/components/form-controls/text-input/text-input.component';
import { Subscription } from 'rxjs';
import { buildOptionGroup, OptionEditorGroup, QuestionEditorForm } from '../shared/question-editor-form.factory';
import { richTextToPlainText } from '../../../../../shared/utils/rich-text.util';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';


@Component({
    selector: 'app-option-list-editor',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        DragDropModule,
        FroalaTextAreaInputComponent,
        TextInputComponent,
        MatSlideToggleModule,
    ],
    templateUrl: './option-list-editor.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionListEditorComponent implements OnInit, OnChanges, OnDestroy {
    private static nextAccordionId = 0;

    @Input({ required: true }) form!: QuestionEditorForm;

    readonly accordionContentId = `option-list-editor-content-${OptionListEditorComponent.nextAccordionId++}`;

    isAccordionOpen = false;
    editingOptionEid: string | null = null;

    readonly otherToggleForm = new FormGroup({
        enabled: new FormControl(false, { nonNullable: true }),
    });

    private readonly subscriptions = new Subscription();
    private optionsSubscription?: Subscription;

    constructor(private readonly cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.subscriptions.add(
            this.otherToggleForm.controls.enabled.valueChanges.subscribe((enabled) => {
                this.setOtherOptionEnabled(enabled);
            }),
        );
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['form'] && this.form) {
            this.editingOptionEid = null;
            this.normalizeOtherOptions();
            this.syncOtherToggle();
            this.watchOptionChanges();
        }
    }

    ngOnDestroy(): void {
        this.optionsSubscription?.unsubscribe();
        this.subscriptions.unsubscribe();
    }

    get options() {
        return this.form.controls.secenekler;
    }

    get normalOptions() {
        return this.options.controls.filter((option) => !option.controls.isDiger.value);
    }

    get otherOption(): OptionEditorGroup | null {
        return this.options.controls.find((option) => option.controls.isDiger.value) ?? null;
    }

    get hasOtherOption(): boolean {
        return Boolean(this.otherOption);
    }

    get totalOptionCount(): number {
        return this.options.length;
    }

    trackByOptionEid(_index: number, item: OptionEditorGroup): string {
        return item.controls.eid.value;
    }

    getPlainText(html: string): string {
        return richTextToPlainText(html);
    }

    isEditing(item: OptionEditorGroup): boolean {
        return this.editingOptionEid === item.controls.eid.value;
    }

    toggleAccordion(): void {
        this.isAccordionOpen = !this.isAccordionOpen;
    }

    startEditing(item: OptionEditorGroup): void {
        this.editingOptionEid = item.controls.eid.value;
        this.cdr.markForCheck();
    }

    stopEditing(): void {
        this.editingOptionEid = null;
        this.cdr.markForCheck();
    }

    addOption(): void {
        const otherOption = this.otherOption;
        const nextOption = buildOptionGroup();

        if (!otherOption) {
            this.options.push(nextOption);
        } else {
            const otherIndex = this.options.controls.indexOf(otherOption);
            this.options.insert(Math.max(0, otherIndex), nextOption);
        }

        this.startEditing(nextOption);
    }

    removeOption(item: OptionEditorGroup): void {
        const index = this.options.controls.indexOf(item);
        if (index < 0) {
            return;
        }

        if (this.isEditing(item)) {
            this.editingOptionEid = null;
        }

        this.options.removeAt(index);
        this.cdr.markForCheck();
    }

    onOptionDrop(event: CdkDragDrop<unknown[]>): void {
        if (event.previousIndex === event.currentIndex) {
            return;
        }

        const controls = this.options.controls as OptionEditorGroup[];
        moveItemInArray(controls, event.previousIndex, event.currentIndex);
        this.cdr.markForCheck();
    }

    setOtherOptionEnabled(enabled: boolean): void {
        this.otherToggleForm.controls.enabled.setValue(enabled, { emitEvent: false });

        if (!enabled) {
            this.removeOtherOptions();
            this.cdr.markForCheck();
            this.cdr.detectChanges();
            return;
        }

        const existingOther = this.otherOption;
        this.removeDuplicateOtherOptions(existingOther);

        if (existingOther) {
            existingOther.patchValue({
                isDiger: true,
                isAciklamaIsteniyor: true,
            });
            this.cdr.markForCheck();
            this.cdr.detectChanges();
            return;
        }

        const option = buildOptionGroup({
            secenekMetni: 'Diger',
            secenekDegeri: 'other',
            isDiger: true,
            isAciklamaIsteniyor: true,
            isAciklamaZorunlu: false,
        } as OptionDto);

        this.options.push(option);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
    }

    private normalizeOtherOptions(): void {
        const firstOther = this.otherOption;
        this.removeDuplicateOtherOptions(firstOther);

        if (firstOther) {
            firstOther.patchValue({
                isDiger: true,
                isAciklamaIsteniyor: true,
            }, { emitEvent: false });
        }
    }

    private syncOtherToggle(): void {
        this.otherToggleForm.controls.enabled.setValue(this.hasOtherOption, { emitEvent: false });
        this.cdr.markForCheck();
    }

    private watchOptionChanges(): void {
        this.optionsSubscription?.unsubscribe();
        this.optionsSubscription = this.options.valueChanges.subscribe(() => {
            this.syncOtherToggle();
        });
    }

    private removeOtherOptions(): void {
        for (let index = this.options.length - 1; index >= 0; index -= 1) {
            if (this.options.at(index).controls.isDiger.value) {
                this.options.removeAt(index);
            }
        }
    }

    private removeDuplicateOtherOptions(keptOption: OptionEditorGroup | null): void {
        for (let index = this.options.length - 1; index >= 0; index -= 1) {
            const option = this.options.at(index);
            if (option.controls.isDiger.value && option !== keptOption) {
                this.options.removeAt(index);
            }
        }
    }
}
