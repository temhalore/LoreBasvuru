import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup, FormControl } from '@angular/forms';

export interface AllValidationErrors {
    control_name: string;
    error_name: string;
    error_value: any;
}

export interface FormGroupControls {
    [key: string]: AbstractControl;
}

@Injectable({
    providedIn: 'root'
})
export class FormValidationService {

    constructor() { }

    /**
     * Kontrol invalid mi kontrol eder
     */
    isControlInvalid(formGroup: FormGroup, controlName: string): boolean {
        const control = formGroup.get(controlName);
        return !!(control && control.invalid && (control.dirty || control.touched));
    }

    /**
     * Kontrol valid mi kontrol eder
     */
    isControlValid(formGroup: FormGroup, controlName: string): boolean {
        const control = formGroup.get(controlName);
        return !!(control && control.valid && (control.dirty || control.touched));
    }

    /**
     * Kontrol belirli bir hataya sahip mi kontrol eder
     */
    controlHasError(formGroup: FormGroup, errorName: string, controlName: string): boolean {
        const control = formGroup.get(controlName);
        return !!(control && control.hasError(errorName) && (control.dirty || control.touched));
    }

    /**
     * Form grup kontrollerinin tüm validation hatalarını getirir
     */
    getFormControlValidationErrors(controls: FormGroupControls, controlName: string): AllValidationErrors[] {
        let formErrors: AllValidationErrors[] = [];

        const control = controls[controlName];
        if (control && !control.valid && (control.dirty || control.touched)) {
            Object.keys(control.errors || {}).forEach(keyError => {
                formErrors.push({
                    control_name: controlName,
                    error_name: keyError,
                    error_value: control.errors ? control.errors[keyError] : null
                });
            });
        }

        return formErrors;
    }

    /**
     * Tüm form hatalarını getirir
     */
    getAllFormErrors(formGroup: FormGroup): AllValidationErrors[] {
        let formErrors: AllValidationErrors[] = [];

        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            if (control && !control.valid && (control.dirty || control.touched)) {
                Object.keys(control.errors || {}).forEach(keyError => {
                    formErrors.push({
                        control_name: field,
                        error_name: keyError,
                        error_value: control.errors ? control.errors[keyError] : null
                    });
                });
            }
        });

        return formErrors;
    }

    /**
     * Form'un valid olup olmadığını kontrol eder
     */
    isFormValid(formGroup: FormGroup): boolean {
        return formGroup.valid;
    }

    /**
     * Tüm kontrolleri touched yapar (validation mesajlarını gösterir)
     */
    markAllFieldsAsTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            if (control) {
                control.markAsTouched({ onlySelf: true });
            }
        });
    }

    /**
     * Form'u sıfırlar
     */
    resetForm(formGroup: FormGroup): void {
        formGroup.reset();
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            if (control) {
                control.setErrors(null);
                control.markAsUntouched();
                control.markAsPristine();
            }
        });
    }
}
