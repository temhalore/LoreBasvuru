import { Component, Input, Output, EventEmitter, OnInit, ViewChildren, QueryList, ElementRef, forwardRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormValidationService } from '../../../services/form-validation.service';
import { Subject, takeUntil, interval, Subscription } from 'rxjs';

@Component({
    selector: 'app-otp-input',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule
    ],
    templateUrl: './otp-input.component.html',
    styleUrls: ['./otp-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => OtpInputComponent),
            multi: true
        }
    ]
})
export class OtpInputComponent implements OnInit, OnDestroy, ControlValueAccessor {
    @Input() formGroup!: FormGroup;
    @Input() controlName!: string;
    @Input() label: string = 'OTP Code';
    @Input() placeholder: string = '';
    @Input() description: string = '';
    @Input() tooltip: string = '';
    @Input() size: 'small' | 'medium' | 'large' = 'medium';
    @Input() isRequired: boolean = false;
    @Input() isDisabled: boolean = false;
    @Input() digits: number = 6; // Number of OTP digits
    @Input() autoSubmit: boolean = false; // Auto submit when complete
    @Input() allowPaste: boolean = true;
    @Input() allowNumbersOnly: boolean = true;
    @Input() resendEnabled: boolean = true;
    @Input() timerDuration: number = 60; // Resend timer in seconds
    @Input() maskInput: boolean = false; // Show dots instead of numbers

    @Output() otpComplete = new EventEmitter<string>();
    @Output() otpChange = new EventEmitter<string>();
    @Output() resendOtp = new EventEmitter<void>();

    @ViewChildren('otpInput', { read: ElementRef }) otpInputs!: QueryList<ElementRef>;

    otpArray: string[] = [];
    currentOtp: string = '';
    timerSeconds: number = 0;
    timerActive: boolean = false;
    private timerSubscription?: Subscription;
    private destroy$ = new Subject<void>();

    // ControlValueAccessor properties
    private onChange = (value: string) => {};
    private onTouched = () => {};

    constructor(
        private formValidationService: FormValidationService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.initializeOtpArray();
        this.startResendTimer();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.timerSubscription) {
            this.timerSubscription.unsubscribe();
        }
    }

    // Initialize OTP array
    private initializeOtpArray(): void {
        this.otpArray = new Array(this.digits).fill('');
    }

    // Handle input in OTP fields
    onOtpInput(event: any, index: number): void {
        if (this.isDisabled) return;

        const target = event.target as HTMLInputElement;
        let value = target.value;
        
        // Filter only numbers if required
        if (this.allowNumbersOnly) {
            value = value.replace(/[^0-9]/g, '');
        }
        
        // Keep only single character - take the last one if multiple
        if (value.length > 1) {
            value = value.slice(-1);
        }
        
        // Update the array immediately
        this.otpArray[index] = value;
        
        // Set input value to ensure consistency
        target.value = value;
        
        // Update combined OTP value
        this.updateOtpValue();
        
        // Auto focus next field if value entered and not at the end
        if (value && index < this.digits - 1) {
            // Small delay to ensure the current input is fully processed
            setTimeout(() => {
                this.focusNextInput(index + 1);
            }, 10);
        }
        
        // Auto submit if complete
        if (this.autoSubmit && this.isOtpComplete()) {
            setTimeout(() => {
                this.otpComplete.emit(this.currentOtp);
            }, 100);
        }
    }

    // Handle keydown events
    onKeyDown(event: KeyboardEvent, index: number): void {
        if (this.isDisabled) return;

        const target = event.target as HTMLInputElement;

        // Handle backspace
        if (event.key === 'Backspace') {
            event.preventDefault();
            
            if (this.otpArray[index]) {
                // Clear current field
                this.otpArray[index] = '';
                target.value = '';
                this.updateOtpValue();
            } else if (index > 0) {
                // Move to previous field and clear it
                this.otpArray[index - 1] = '';
                this.updateOtpValue();
                this.focusPreviousInput(index - 1);
            }
        }
        // Handle delete key
        else if (event.key === 'Delete') {
            event.preventDefault();
            this.otpArray[index] = '';
            target.value = '';
            this.updateOtpValue();
        }
        // Handle arrow keys
        else if (event.key === 'ArrowLeft' && index > 0) {
            event.preventDefault();
            this.focusPreviousInput(index - 1);
        }
        else if (event.key === 'ArrowRight' && index < this.digits - 1) {
            event.preventDefault();
            this.focusNextInput(index + 1);
        }
        // Handle Enter
        else if (event.key === 'Enter' && this.isOtpComplete()) {
            event.preventDefault();
            this.otpComplete.emit(this.currentOtp);
        }
        // Handle numbers and allowed characters
        else if (this.allowNumbersOnly && !/[0-9]/.test(event.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
        }
    }

    // Handle paste events
    onPaste(event: ClipboardEvent, index: number): void {
        if (this.isDisabled || !this.allowPaste) {
            event.preventDefault();
            return;
        }

        event.preventDefault();
        
        const pastedData = event.clipboardData?.getData('text') || '';
        const numericData = this.allowNumbersOnly ? pastedData.replace(/[^0-9]/g, '') : pastedData;
        
        if (numericData.length > 0) {
            // Clear all fields first
            this.initializeOtpArray();
            
            // Fill OTP fields with pasted data
            for (let i = 0; i < this.digits && i < numericData.length; i++) {
                this.otpArray[i] = numericData[i];
            }
            
            this.updateOtpValue();
            
            // Focus last filled input or complete
            const lastIndex = Math.min(numericData.length - 1, this.digits - 1);
            this.focusInput(lastIndex);

            if (this.autoSubmit && this.isOtpComplete()) {
                this.otpComplete.emit(this.currentOtp);
            }
        }
    }

    // Focus management
    private focusInput(index: number): void {
        setTimeout(() => {
            const inputs = this.otpInputs.toArray();
            if (inputs[index]) {
                const input = inputs[index].nativeElement;
                input.focus();
                // Clear any residual value and set cursor to end
                setTimeout(() => {
                    input.setSelectionRange(1, 1);
                }, 10);
            }
        }, 50);
    }

    private focusNextInput(index: number): void {
        if (index < this.digits) {
            this.focusInput(index);
        }
    }

    private focusPreviousInput(index: number): void {
        if (index >= 0) {
            this.focusInput(index);
        }
    }

    // Update OTP value
    private updateOtpValue(): void {
        const newOtp = this.otpArray.join('');
        
        // Only update if value actually changed
        if (this.currentOtp !== newOtp) {
            this.currentOtp = newOtp;
            this.onChange(this.currentOtp);
            this.otpChange.emit(this.currentOtp);

            // Update form control
            if (this.formGroup && this.controlName) {
                const control = this.formGroup.get(this.controlName);
                if (control) {
                    control.setValue(this.currentOtp);
                    control.markAsTouched();
                }
            }
            
            // Trigger change detection
            this.cdr.markForCheck();
        }
    }

    // Check if OTP is complete
    isOtpComplete(): boolean {
        return this.otpArray.every(digit => digit !== '') && this.otpArray.length === this.digits;
    }

    // Clear OTP
    clearOtp(): void {
        if (this.isDisabled) return;

        this.initializeOtpArray();
        this.currentOtp = '';
        this.onChange('');
        this.focusInput(0);
    }

    // Resend OTP
    onResendOtp(): void {
        if (this.timerActive) return;

        this.resendOtp.emit();
        this.startResendTimer();
        this.clearOtp();
    }

    // Timer management
    private startResendTimer(): void {
        this.timerSeconds = this.timerDuration;
        this.timerActive = true;

        this.timerSubscription = interval(1000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.timerSeconds--;
                if (this.timerSeconds <= 0) {
                    this.timerActive = false;
                    if (this.timerSubscription) {
                        this.timerSubscription.unsubscribe();
                    }
                }
            });
    }

    // Format timer display
    getTimerDisplay(): string {
        const minutes = Math.floor(this.timerSeconds / 60);
        const seconds = this.timerSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Get input type based on mask setting
    getInputType(): string {
        return this.maskInput ? 'password' : 'text';
    }

    // Get input CSS classes based on size and state
    getInputClasses(): string {
        const baseClasses = 'text-center border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
        const sizeClasses = {
            small: 'w-10 h-10 text-lg',
            medium: 'w-12 h-12 text-xl',
            large: 'w-14 h-14 text-2xl'
        };
        const stateClasses = this.isDisabled 
            ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500';
        
        return `${baseClasses} ${sizeClasses[this.size]} ${stateClasses}`;
    }

    // Validation methods
    get isInvalid(): boolean {
        if (!this.formGroup || !this.controlName) return false;
        const control = this.formGroup.get(this.controlName);
        return !!(control && control.invalid && (control.dirty || control.touched));
    }

    get errorMessage(): string {
        if (!this.formGroup || !this.controlName) return '';
        const control = this.formGroup.get(this.controlName);
        if (control && control.errors) {
            const errors = this.formValidationService.getFormControlValidationErrors(
                this.formGroup.controls, 
                this.controlName
            );
            return errors.length > 0 ? `${errors[0].error_name}: ${errors[0].error_value}` : 'Invalid OTP';
        }
        return '';
    }

    // ControlValueAccessor implementation
    writeValue(value: string): void {
        if (value) {
            const otpValue = this.allowNumbersOnly ? value.replace(/[^0-9]/g, '') : value;
            this.otpArray = new Array(this.digits).fill('');
            for (let i = 0; i < this.digits && i < otpValue.length; i++) {
                this.otpArray[i] = otpValue[i] || '';
            }
            this.currentOtp = this.otpArray.join('');
        } else {
            this.initializeOtpArray();
            this.currentOtp = '';
        }
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }
}
