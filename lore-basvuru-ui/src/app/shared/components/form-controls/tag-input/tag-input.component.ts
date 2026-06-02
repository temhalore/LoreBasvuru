import { Component, Input, OnInit, OnDestroy, ViewEncapsulation, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormValidationService, AllValidationErrors } from '../../../services/form-validation.service';
import { Subscription } from 'rxjs';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipEditedEvent, MatChipInputEvent } from '@angular/material/chips';

@Component({
    selector: 'app-tag-input',
    standalone: true,
    templateUrl: './tag-input.component.html',
    styleUrls: ['./tag-input.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatChipsModule,
        MatIconModule,
        MatTooltipModule,
        MatButtonModule,
        MatAutocompleteModule
    ]
})
export class TagInputComponent implements OnInit, OnDestroy {
    @Input() formGroup!: FormGroup;
    @Input() controlName: string = '';
    @Input() label: string = 'Tags';
    @Input() placeholder: string = 'Tag ekle...';
    @Input() description: string = '';
    @Input() tooltip: string = '';
    @Input() isRequired: boolean = false;
    @Input() isDisabled: boolean = false;
    @Input() customClass: string = '';

    // Tag specific properties
    @Input() maxTags: number = 10;
    @Input() allowDuplicates: boolean = false;
    @Input() removable: boolean = true;
    @Input() editable: boolean = true;
    @Input() addOnBlur: boolean = true;
    @Input() separatorKeyCodes: number[] = [ENTER, COMMA];
    @Input() tagColor: 'primary' | 'accent' | 'warn' = 'primary';
    @Input() size: 'small' | 'medium' | 'large' = 'medium';

    // Display options
    @Input() showTagCount: boolean = true;
    @Input() showClearAll: boolean = true;
    @Input() showAddButton: boolean = false;
    @Input() allowCustomTags: boolean = true;
    @Input() predefinedTags: string[] = [];
    @Input() suggestions: string[] = [
        'Angular', 'React', 'Vue.js', 'JavaScript', 'TypeScript', 'Node.js',
        'Python', 'Java', 'C#', 'PHP', 'HTML', 'CSS', 'SCSS', 'Bootstrap',
        'Tailwind', 'Material Design', 'Firebase', 'MongoDB', 'PostgreSQL',
        'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP'
    ];

    @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

    currentInput: string = '';
    filteredSuggestions: string[] = [];
    private subscriptions: Subscription[] = [];

    constructor(public readonly formValidationService: FormValidationService) {}

    ngOnInit(): void {
        if (!this.formGroup || !this.controlName) {
            console.error('FormGroup and controlName are required for TagInputComponent');
            return;
        }

        // Initialize with empty array if no value
        if (!this.control?.value) {
            this.control?.setValue([]);
        }

        // Set disabled state on FormControl if needed
        if (this.isDisabled && this.control) {
            this.control.disable();
        }

        // Initialize filtered suggestions
        this.filteredSuggestions = this.suggestions.slice();
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    get control() {
        return this.formGroup?.get(this.controlName);
    }

    get value(): string[] {
        return this.control?.value || [];
    }

    get isControlInvalid(): boolean {
        return this.control?.invalid || false;
    }

    get isControlValid(): boolean {
        return this.control?.valid || false;
    }

    get isControlTouched(): boolean {
        return this.control?.touched || false;
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

    get tagCount(): number {
        return this.value.length;
    }

    get canAddMoreTags(): boolean {
        return this.tagCount < this.maxTags;
    }

    get containerClass(): string {
        const classes = ['tag-input-container'];
        
        if (this.customClass) {
            classes.push(this.customClass);
        }
        
        if (this.size) {
            classes.push(`size-${this.size}`);
        }
        
        return classes.join(' ');
    }

    // Tag management methods
    addTag(event: MatChipInputEvent): void {
        const value = (event.value || '').trim();

        if (value && this.canAddTag(value)) {
            const currentTags = [...this.value];
            currentTags.push(value);
            this.control?.setValue(currentTags);
            this.control?.markAsTouched();
        }

        // Clear the input value
        event.chipInput!.clear();
        this.currentInput = '';
        this.updateFilteredSuggestions();
    }

    removeTag(tagToRemove: string): void {
        if (!this.removable || this.isControlDisabled) return;

        const currentTags = [...this.value];
        const index = currentTags.indexOf(tagToRemove);

        if (index >= 0) {
            currentTags.splice(index, 1);
            this.control?.setValue(currentTags);
            this.control?.markAsTouched();
        }
    }

    editTag(tag: string, event: MatChipEditedEvent): void {
        if (!this.editable || this.isControlDisabled) return;

        const value = event.value.trim();

        // Remove tag if value is empty
        if (!value) {
            this.removeTag(tag);
            return;
        }

        // Update tag if value is different and valid
        if (value !== tag && this.canAddTag(value)) {
            const currentTags = [...this.value];
            const index = currentTags.indexOf(tag);
            if (index >= 0) {
                currentTags[index] = value;
                this.control?.setValue(currentTags);
                this.control?.markAsTouched();
            }
        }
    }

    canAddTag(value: string): boolean {
        if (!value || !this.canAddMoreTags) return false;
        if (!this.allowDuplicates && this.value.includes(value)) return false;
        if (!this.allowCustomTags && !this.suggestions.includes(value)) return false;
        return true;
    }

    // Input handling
    onInputChange(value: string): void {
        this.currentInput = value;
        this.updateFilteredSuggestions();
    }

    onInputBlur(): void {
        if (this.addOnBlur && this.currentInput.trim() && this.canAddTag(this.currentInput.trim())) {
            this.addTagFromInput();
        }
    }

    addTagFromInput(): void {
        const value = this.currentInput.trim();
        if (value && this.canAddTag(value)) {
            const currentTags = [...this.value];
            currentTags.push(value);
            this.control?.setValue(currentTags);
            this.control?.markAsTouched();
            this.currentInput = '';
            this.tagInput.nativeElement.value = '';
            this.updateFilteredSuggestions();
        }
    }

    selectSuggestion(suggestion: string): void {
        if (this.canAddTag(suggestion)) {
            const currentTags = [...this.value];
            currentTags.push(suggestion);
            this.control?.setValue(currentTags);
            this.control?.markAsTouched();
            this.currentInput = '';
            this.tagInput.nativeElement.value = '';
            this.updateFilteredSuggestions();
        }
    }

    updateFilteredSuggestions(): void {
        const input = this.currentInput.toLowerCase();
        this.filteredSuggestions = this.suggestions.filter(suggestion => 
            suggestion.toLowerCase().includes(input) && 
            !this.value.includes(suggestion)
        );
    }

    // Action methods
    clearAllTags(): void {
        if (this.isControlDisabled) return;
        
        this.control?.setValue([]);
        this.control?.markAsTouched();
        this.currentInput = '';
        if (this.tagInput) {
            this.tagInput.nativeElement.value = '';
        }
        this.updateFilteredSuggestions();
    }

    addPredefinedTag(tag: string): void {
        if (this.canAddTag(tag)) {
            const currentTags = [...this.value];
            currentTags.push(tag);
            this.control?.setValue(currentTags);
            this.control?.markAsTouched();
        }
    }

    // Validation and error handling
    getAllErrors(): any[] {
        if (!this.control || !this.control.errors) return [];
        return Object.keys(this.control.errors).map(key => ({ errorName: key, error: this.control.errors[key] }));
    }

    getErrorMessage(errorName: string): string {
        switch (errorName) {
            case 'required':
                return 'Bu alan zorunludur';
            case 'maxlength':
                return 'Maksimum karakter sayısı aşıldı';
            case 'minlength':
                return 'Minimum karakter sayısı gerekli';
            default:
                return errorName;
        }
    }

    // Utility methods
    getTagDisplayValue(tag: string): string {
        return tag;
    }

    getTagTooltip(tag: string): string {
        return `Tag: ${tag} (Kaldırmak için tıklayın)`;
    }
}
