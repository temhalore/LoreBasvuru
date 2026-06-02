import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OtpInputComponent } from '../otp-input.component';

@Component({
    selector: 'app-otp-input-example',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatTabsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatSnackBarModule,
        OtpInputComponent
    ],
    templateUrl: './otp-input-example.component.html',
    styleUrls: ['./otp-input-example.component.scss']
})
export class OtpInputExampleComponent implements OnInit {
    // Form instances
    basicForm!: FormGroup;
    advancedForm!: FormGroup;
    validationForm!: FormGroup;
    sizeForm!: FormGroup;

    constructor(private snackBar: MatSnackBar) {}

    ngOnInit(): void {
        this.initializeForms();
    }

    // Initialize all forms
    private initializeForms(): void {
        // Basic Form
        this.basicForm = new FormGroup({
            simpleOtp: new FormControl(''),
            autoSubmitOtp: new FormControl(''),
            maskedOtp: new FormControl(''),
            customDigitsOtp: new FormControl(''),
            numbersOnlyOtp: new FormControl('')
        });

        // Advanced Form
        this.advancedForm = new FormGroup({
            loginOtp: new FormControl(''),
            transactionOtp: new FormControl(''),
            resetPasswordOtp: new FormControl(''),
            twoFactorOtp: new FormControl(''),
            verificationOtp: new FormControl('')
        });

        // Validation Form
        this.validationForm = new FormGroup({
            requiredOtp: new FormControl('', [Validators.required]),
            minLengthOtp: new FormControl('', [Validators.required, Validators.minLength(6)]),
            patternOtp: new FormControl('', [Validators.required, Validators.pattern(/^\d{6}$/)]),
            customValidationOtp: new FormControl('', [Validators.required, this.customOtpValidator])
        });

        // Size Form
        this.sizeForm = new FormGroup({
            smallOtp: new FormControl(''),
            mediumOtp: new FormControl(''),
            largeOtp: new FormControl('')
        });
    }

    // Custom OTP validator
    private customOtpValidator(control: any) {
        if (!control.value) return null;
        
        const value = control.value.toString();
        if (value.length !== 6) {
            return { customLength: { requiredLength: 6, actualLength: value.length } };
        }
        
        // Check if OTP contains sequential numbers
        const isSequential = /012345|123456|234567|345678|456789|567890/.test(value);
        if (isSequential) {
            return { sequential: { message: 'OTP cannot contain sequential numbers' } };
        }
        
        // Check if OTP contains repeated numbers
        const isRepeated = /(\d)\1{3,}/.test(value);
        if (isRepeated) {
            return { repeated: { message: 'OTP cannot contain repeated numbers' } };
        }
        
        return null;
    }

    // Form submission handlers
    onBasicFormSubmit(): void {
        if (this.basicForm.valid) {
            this.showSnackBar('Basic form submitted successfully!', 'success');
        } else {
            this.showSnackBar('Please fill all required fields', 'error');
        }
    }

    onAdvancedFormSubmit(): void {
        if (this.advancedForm.valid) {
            this.showSnackBar('Advanced form submitted successfully!', 'success');
        } else {
            this.showSnackBar('Please fill all required fields', 'error');
        }
    }

    onValidationFormSubmit(): void {
        if (this.validationForm.valid) {
            this.showSnackBar('Validation form submitted successfully!', 'success');
        } else {
            this.showSnackBar('Please fix validation errors', 'error');
        }
    }

    onSizeFormSubmit(): void {
        if (this.sizeForm.valid) {
            this.showSnackBar('Size form submitted successfully!', 'success');
        } else {
            this.showSnackBar('Please fill all required fields', 'error');
        }
    }

    // Reset form handlers
    resetBasicForm(): void {
        this.basicForm.reset();
        this.showSnackBar('Basic form reset', 'info');
    }

    resetAdvancedForm(): void {
        this.advancedForm.reset();
        this.showSnackBar('Advanced form reset', 'info');
    }

    resetValidationForm(): void {
        this.validationForm.reset();
        this.showSnackBar('Validation form reset', 'info');
    }

    resetSizeForm(): void {
        this.sizeForm.reset();
        this.showSnackBar('Size form reset', 'info');
    }

    // OTP event handlers
    onOtpComplete(otp: string, context: string): void {
        this.showSnackBar(`OTP Complete: ${otp}`, 'success');
    }

    onOtpChange(otp: string, context: string): void {
    }

    onResendOtp(context: string): void {
        this.showSnackBar(`OTP resent for ${context}`, 'info');
        
        // Simulate OTP sending
        setTimeout(() => {
            this.showSnackBar(`New OTP sent to your device for ${context}`, 'success');
        }, 1000);
    }

    // Utility methods
    getFormStatus(form: FormGroup): string {
        return `Valid: ${form.valid} | Touched: ${form.touched} | Dirty: ${form.dirty}`;
    }

    getFormValues(form: FormGroup): string {
        return JSON.stringify(form.value, null, 2);
    }

    // Bulk operations
    fillSampleOtp(controlName: string, form: FormGroup, otp: string = '123456'): void {
        const control = form.get(controlName);
        if (control) {
            control.setValue(otp);
            control.markAsTouched();
        }
        this.showSnackBar(`Sample OTP filled: ${otp}`, 'info');
    }

    clearOtp(controlName: string, form: FormGroup): void {
        const control = form.get(controlName);
        if (control) {
            control.setValue('');
            control.markAsUntouched();
        }
        this.showSnackBar('OTP cleared', 'info');
    }

    // Export data
    exportOtpData(form: FormGroup): void {
        const data = {
            formData: form.value,
            timestamp: new Date().toISOString(),
            status: {
                valid: form.valid,
                touched: form.touched,
                dirty: form.dirty
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `otp-data-${Date.now()}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.showSnackBar('OTP data exported', 'success');
    }

    // Snackbar helper
    private showSnackBar(message: string, type: 'success' | 'error' | 'info'): void {
        this.snackBar.open(message, 'Close', {
            duration: 3000,
            panelClass: [`snackbar-${type}`],
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
        });
    }

    // Get OTP statistics
    getOtpStats(form: FormGroup): any {
        const values = Object.values(form.value);
        const filledOtps = values.filter(value => value && value.toString().length > 0);
        const completeOtps = values.filter(value => value && value.toString().length === 6);
        
        return {
            total: values.length,
            filled: filledOtps.length,
            complete: completeOtps.length,
            completion: values.length > 0 ? Math.round((completeOtps.length / values.length) * 100) : 0
        };
    }

    // Test OTP scenarios
    testRandomOtp(controlName: string, form: FormGroup): void {
        const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
        this.fillSampleOtp(controlName, form, randomOtp);
    }

    testInvalidOtp(controlName: string, form: FormGroup): void {
        const invalidOtps = ['123456', '000000', '111111', '123123', '456789'];
        const randomInvalid = invalidOtps[Math.floor(Math.random() * invalidOtps.length)];
        this.fillSampleOtp(controlName, form, randomInvalid);
    }
}
