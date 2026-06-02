import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { FormValidationService, AllValidationErrors } from '../../../services/form-validation.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-textarea-input',
    standalone: true,
    templateUrl: './textarea-input.component.html',
    styleUrls: ['./textarea-input.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatTooltipModule,
        MatButtonModule
    ]
})
export class TextareaInputComponent implements OnInit, OnDestroy, OnChanges {
    @Input() formGroup!: FormGroup;
    @Input() controlName: string = '';
    @Input() label: string = '';
    @Input() placeholder: string = '';
    @Input() tooltip: string = '';
    @Input() isRequired: boolean = false;
    @Input() isDisabled: boolean = false;
    @Input() rows: number = 4;
    @Input() maxLength?: number;
    @Input() minLength?: number;
    @Input() icon?: string;
    @Input() customClass: string = '';
    @Input() appearance: 'fill' | 'outline' = 'outline';
    @Input() floatLabel: 'always' | 'never' | 'auto' = 'auto';
    @Input() hideRequiredMarker: boolean = false;
    @Input() autoResize: boolean = false;
    @Input() showCharacterCount: boolean = false;
    @Input() enableClearButton: boolean = false;
    @Input() enableCopyButton: boolean = false;
    @Input() enableExpandButton: boolean = false;

    isExpanded: boolean = false;
    private subscriptions: Subscription[] = [];

    constructor(public readonly formValidationService: FormValidationService) {}

    ngOnInit(): void {
        if (!this.formGroup || !this.controlName) {
            console.error('FormGroup and controlName are required for TextareaInputComponent');
            return;
        }

        this.syncDisabledState();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isDisabled'] || changes['formGroup'] || changes['controlName']) {
            this.syncDisabledState();
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    get control() {
        return this.formGroup?.get(this.controlName);
    }

    get value(): string {
        return this.control?.value || '';
    }

    get characterCount(): number {
        return this.value.length;
    }

    get remainingCharacters(): number {
        return this.maxLength ? this.maxLength - this.characterCount : 0;
    }

    get isCharacterLimitExceeded(): boolean {
        return this.maxLength ? this.characterCount > this.maxLength : false;
    }

    get isControlTouched(): boolean {
        return this.control?.touched || false;
    }

    get isControlDirty(): boolean {
        return this.control?.dirty || false;
    }

    get isControlInvalid(): boolean {
        return this.control?.invalid || false;
    }

    get isControlValid(): boolean {
        return this.control?.valid && this.isControlTouched || false;
    }

    get isControlDisabled(): boolean {
        return this.isDisabled || this.control?.disabled || false;
    }

    get showRequiredMarker(): boolean {
        return this.isRequired && !this.hideRequiredMarker;
    }

    get hasTooltip(): boolean {
        return !!this.tooltip;
    }

    get inputType(): string {
        return 'textarea';
    }

    get currentRows(): number {
        return this.isExpanded ? Math.max(this.rows * 2, 8) : this.rows;
    }

    hasError(errorType: string): boolean {
        return this.control?.hasError(errorType) && this.isControlTouched || false;
    }

    getErrorMessage(errorType: string): string {
        if (this.hasError(errorType)) {
            const errorValue = this.control?.errors?.[errorType];
            return this.getCustomErrorMessage(errorType, errorValue);
        }
        return '';
    }

    private getCustomErrorMessage(errorType: string, errorValue: any): string {
        switch (errorType) {
            case 'required':
                return `${this.label || 'Bu alan'} zorunludur`;
            case 'minlength':
                return `Minimum ${errorValue?.requiredLength || this.minLength} karakter olmalıdır`;
            case 'maxlength':
                return `Maksimum ${errorValue?.requiredLength || this.maxLength} karakter olabilir`;
            default:
                return 'Geçersiz değer';
        }
    }

    getAllErrors(): AllValidationErrors[] {
        return this.formValidationService.getFormControlValidationErrors(this.formGroup.controls, this.controlName);
    }

    clearText(): void {
        if (this.control && !this.isControlDisabled) {
            this.control.setValue('');
            this.control.markAsTouched();
        }
    }

    copyText(): void {
        if (this.value) {
            navigator.clipboard.writeText(this.value).then(() => {
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        }
    }

    toggleExpand(): void {
        this.isExpanded = !this.isExpanded;
    }

    onFocus(): void {
        // Handle focus event if needed
    }

    onBlur(): void {
        // Handle blur event if needed
    }

    onInput(event: Event): void {
        const target = event.target as HTMLTextAreaElement;
        if (this.autoResize) {
            this.autoResizeTextarea(target);
        }
    }

    private autoResizeTextarea(textarea: HTMLTextAreaElement): void {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    private syncDisabledState(): void {
        if (!this.control) {
            return;
        }

        if (this.isDisabled && this.control.enabled) {
            this.control.disable({ emitEvent: false });
        }

        if (!this.isDisabled && this.control.disabled) {
            this.control.enable({ emitEvent: false });
        }
    }
}
