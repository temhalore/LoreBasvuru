import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { CheckboxInputComponent } from '../checkbox-input.component';

@Component({
    selector: 'app-checkbox-input-example',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatTabsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatCheckboxModule,
        MatSlideToggleModule,
        CheckboxInputComponent
    ],
    templateUrl: './checkbox-input-example.component.html',
    styleUrls: ['./checkbox-input-example.component.scss']
})
export class CheckboxInputExampleComponent implements OnInit {
    // Basic Examples
    basicForm: FormGroup;
    
    // Toggle Examples
    toggleForm: FormGroup;
    
    // Validation Examples
    validationForm: FormGroup;
    
    // Advanced Examples
    advancedForm: FormGroup;

    // Size Examples
    sizeForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.initializeForms();
    }

    ngOnInit(): void {
        // Forms are already initialized in constructor
    }

    private initializeForms(): void {
        // Basic checkbox examples
        this.basicForm = this.fb.group({
            simpleCheckbox: [false],
            requiredCheckbox: [false, Validators.requiredTrue],
            checkedCheckbox: [true],
            disabledCheckbox: [{ value: true, disabled: true }],
            withDescription: [false],
            withIcon: [false]
        });

        // Toggle/Switch examples
        this.toggleForm = this.fb.group({
            basicToggle: [false],
            switchControl: [true],
            withStatusText: [false],
            disabledToggle: [{ value: true, disabled: true }],
            toggleWithActions: [false],
            indeterminateToggle: [false]
        });

        // Validation examples
        this.validationForm = this.fb.group({
            acceptTerms: [false, Validators.requiredTrue],
            agreePolicy: [false, Validators.requiredTrue],
            newsletter: [false],
            notifications: [true],
            marketing: [false]
        });

        // Advanced examples
        this.advancedForm = this.fb.group({
            featureEnabled: [false],
            debugMode: [false],
            autoSave: [true],
            darkMode: [false],
            soundEffects: [true],
            animations: [true]
        });

        // Size examples
        this.sizeForm = this.fb.group({
            smallCheckbox: [false],
            mediumCheckbox: [false],
            largeCheckbox: [false],
            smallToggle: [false],
            mediumToggle: [false],
            largeToggle: [false]
        });
    }

    // Form action methods
    onBasicFormSubmit(): void {
        if (this.basicForm.valid) {
        } else {
            this.markFormGroupTouched(this.basicForm);
        }
    }

    onToggleFormSubmit(): void {
        if (this.toggleForm.valid) {
        } else {
            this.markFormGroupTouched(this.toggleForm);
        }
    }

    onValidationFormSubmit(): void {
        if (this.validationForm.valid) {
        } else {
            this.markFormGroupTouched(this.validationForm);
        }
    }

    onAdvancedFormSubmit(): void {
        if (this.advancedForm.valid) {
        } else {
            this.markFormGroupTouched(this.advancedForm);
        }
    }

    onSizeFormSubmit(): void {
        if (this.sizeForm.valid) {
        } else {
            this.markFormGroupTouched(this.sizeForm);
        }
    }

    resetBasicForm(): void {
        this.basicForm.reset();
    }

    resetToggleForm(): void {
        this.toggleForm.reset();
    }

    resetValidationForm(): void {
        this.validationForm.reset();
    }

    resetAdvancedForm(): void {
        this.advancedForm.reset();
    }

    resetSizeForm(): void {
        this.sizeForm.reset();
    }

    // Utility methods
    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            if (control instanceof FormControl) {
                control.markAsTouched();
            }
        });
    }

    // Get form values for display
    getFormValues(form: FormGroup): string {
        return JSON.stringify(form.value, null, 2);
    }

    // Get form status
    getFormStatus(form: FormGroup): string {
        return `Valid: ${form.valid} | Touched: ${form.touched} | Dirty: ${form.dirty}`;
    }

    // Custom validation methods
    toggleAllValidationControls(): void {
        const currentValues = this.validationForm.value;
        const allChecked = Object.values(currentValues).every(value => value === true);
        
        Object.keys(this.validationForm.controls).forEach(key => {
            this.validationForm.get(key)?.setValue(!allChecked);
        });
    }

    toggleAllAdvancedControls(): void {
        const currentValues = this.advancedForm.value;
        const allChecked = Object.values(currentValues).every(value => value === true);
        
        Object.keys(this.advancedForm.controls).forEach(key => {
            this.advancedForm.get(key)?.setValue(!allChecked);
        });
    }

    // Individual control actions
    toggleControl(form: FormGroup, controlName: string): void {
        const control = form.get(controlName);
        if (control) {
            control.setValue(!control.value);
        }
    }

    setControlValue(form: FormGroup, controlName: string, value: boolean): void {
        const control = form.get(controlName);
        if (control) {
            control.setValue(value);
        }
    }
}
