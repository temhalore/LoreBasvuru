import { Component, Input, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormValidationService, AllValidationErrors } from '../../../services/form-validation.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-text-input',
    standalone: true,
    templateUrl: './text-input.component.html',
    styleUrls: ['./text-input.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatTooltipModule
    ]
})
export class TextInputComponent implements OnInit, OnDestroy {
    @Input() formGroup!: FormGroup;
    @Input() controlName: string = '';
    @Input() type: string = 'text';
    @Input() label: string = '';
    @Input() placeholder: string = '';
    @Input() tooltip: string = '';
    @Input() isRequired: boolean = false;
    @Input() isDisabled: boolean = false;
    @Input() minValue?: number;
    @Input() maxValue?: number;
    @Input() maxLength?: number;
    @Input() minLength?: number;
    @Input() icon?: string;
    @Input() suffix?: string;
    @Input() prefix?: string;
    @Input() autocomplete: string = '';
    @Input() customClass: string = '';
    @Input() appearance: 'fill' | 'outline' = 'outline';
    @Input() floatLabel: 'always' | 'never' | 'auto' = 'auto';
    @Input() hideRequiredMarker: boolean = false;
    @Input() rows: number = 3; // Textarea için satır sayısı

    private subscriptions: Subscription[] = [];

    constructor(public readonly formValidationService: FormValidationService) {}

    ngOnInit(): void {
        if (this.isDisabled && this.formGroup?.get(this.controlName)) {
            this.formGroup.get(this.controlName).disable();
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    /**
     * Kontrolün invalid olup olmadığını kontrol eder
     */
    get isControlInvalid(): boolean {
        return this.formValidationService.isControlInvalid(this.formGroup, this.controlName);
    }

    /**
     * Kontrolün valid olup olmadığını kontrol eder
     */
    get isControlValid(): boolean {
        return this.formValidationService.isControlValid(this.formGroup, this.controlName);
    }

    /**
     * Kontrol değerini getirir
     */
    get controlValue(): any {
        return this.formGroup.get(this.controlName)?.value;
    }

    /**
     * Form kontrolünün validation hatalarını getirir
     */
    getFormControlValidationErrors(errorName: string): AllValidationErrors | undefined {
        return this.formValidationService
            .getFormControlValidationErrors(this.formGroup.controls, this.controlName)
            .find(x => x.error_name === errorName);
    }

    /**
     * Belirli bir hata türünün olup olmadığını kontrol eder
     */
    hasError(errorName: string): boolean {
        return this.formValidationService.controlHasError(this.formGroup, errorName, this.controlName);
    }

    /**
     * Tooltip varsa true döner
     */
    get hasTooltip(): boolean {
        return !!this.tooltip;
    }

    /**
     * Required marker gösterilecek mi
     */
    get showRequiredMarker(): boolean {
        return this.isRequired && !this.hideRequiredMarker;
    }

    /**
     * Form kontrolünün disabled olup olmadığını kontrol eder
     */
    get isControlDisabled(): boolean {
        return this.isDisabled || this.formGroup.get(this.controlName)?.disabled || false;
    }

    /**
     * Input'un input type'ını döner
     */
    get inputType(): string {
        return this.type;
    }

    /**
     * Mat-form-field appearance'ını döner
     */
    get fieldAppearance(): 'fill' | 'outline' {
        return this.appearance;
    }

    /**
     * Float label davranışını döner
     */
    get labelFloat(): 'always' | 'never' | 'auto' {
        return this.floatLabel;
    }
}
