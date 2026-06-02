import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { FormValidationService, AllValidationErrors } from '../../../services/form-validation.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-checkbox-input',
    standalone: true,
    templateUrl: './checkbox-input.component.html',
    styleUrls: ['./checkbox-input.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatCheckboxModule,
        MatSlideToggleModule,
        MatIconModule,
        MatTooltipModule,
        MatButtonModule
    ]
})
export class CheckboxInputComponent implements OnInit, OnDestroy, OnChanges {
    @Input() formGroup!: FormGroup;
    @Input() controlName: string = '';
    @Input() label: string = '';
    @Input() description: string = '';
    @Input() tooltip: string = '';
    @Input() isRequired: boolean = false;
    @Input() isDisabled: boolean = false;
    @Input() customClass: string = '';

    // Checkbox specific properties
    @Input() checkboxType: 'checkbox' | 'toggle' | 'switch' = 'checkbox';
    @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
    @Input() labelPosition: 'before' | 'after' = 'after';
    @Input() indeterminate: boolean = false;
    @Input() showIcon: boolean = false;
    @Input() checkedIcon: string = 'check';
    @Input() uncheckedIcon: string = 'close';
    @Input() size: 'small' | 'medium' | 'large' = 'medium';

    // Display options
    @Input() showStatusText: boolean = false;
    @Input() showControlStatus: boolean = true;
    @Input() showErrorMessages: boolean = true;
    @Input() showControlStatusOnlyWhenTouched: boolean = true;
    @Input() trueText: string = 'Evet';
    @Input() falseText: string = 'Hayır';
    @Input() enableReset: boolean = false;
    @Input() enableToggleButton: boolean = false;
    @Input() isValid: boolean = false;


    private subscriptions: Subscription[] = [];

    constructor(public readonly formValidationService: FormValidationService) {}

    ngOnInit(): void {
        if (!this.formGroup || !this.controlName) {
            console.error('FormGroup and controlName are required for CheckboxInputComponent');
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

    get value(): boolean {
        return this.control?.value || false;
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
        return this.control?.disabled || false;
    }

    get showRequiredMarker(): boolean {
        return this.isRequired;
    }

    get hasTooltip(): boolean {
        return !!this.tooltip;
    }

    get statusText(): string {
        return this.value ? this.trueText : this.falseText;
    }

    get checkboxSize(): string {
        switch (this.size) {
            case 'small':
                return 'text-sm';
            case 'large':
                return 'text-lg';
            default:
                return 'text-base';
        }
    }

    get containerClass(): string {
        const classes = ['checkbox-input-component', this.customClass];
        
        if (this.size) {
            classes.push(`size-${this.size}`);
        }
        
        if (this.checkboxType) {
            classes.push(`type-${this.checkboxType}`);
        }
        
        return classes.filter(Boolean).join(' ');
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
                return `${this.label || 'Bu seçenek'} zorunludur`;
            case 'requiredTrue':
                return `${this.label || 'Bu seçenek'} onaylanmalıdır`;
            default:
                return 'Geçersiz değer';
        }
    }

    getAllErrors(): AllValidationErrors[] {
        return this.formValidationService.getFormControlValidationErrors(this.formGroup.controls, this.controlName);
    }

    onCheckboxChange(event: any): void {
        const value = event.checked;
        if (this.control) {
            this.control.setValue(value);
            this.control.markAsTouched();
        }
    }

    onToggleChange(event: any): void {
        const value = event.checked;
        if (this.control) {
            this.control.setValue(value);
            this.control.markAsTouched();
        }
    }

    toggleValue(): void {
        if (this.control && !this.isControlDisabled) {
            const currentValue = this.control.value;
            this.control.setValue(!currentValue);
            this.control.markAsTouched();
        }
    }

    resetValue(): void {
        if (this.control && !this.isControlDisabled) {
            this.control.setValue(false);
            this.control.markAsTouched();
        }
    }

    setTrue(): void {
        if (this.control && !this.isControlDisabled) {
            this.control.setValue(true);
            this.control.markAsTouched();
        }
    }

    setFalse(): void {
        if (this.control && !this.isControlDisabled) {
            this.control.setValue(false);
            this.control.markAsTouched();
        }
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
