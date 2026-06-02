import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { FormValidationService, AllValidationErrors } from '../../../services/form-validation.service';
import { Subscription } from 'rxjs';
import { startWith, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface SelectOption {
    value: any;
    label: string;
    disabled?: boolean;
    group?: string;
}

@Component({
    selector: 'app-select-input',
    standalone: true,
    templateUrl: './select-input.component.html',
    styleUrls: ['./select-input.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatInputModule
    ]
})
export class SelectInputComponent implements OnInit, OnDestroy, OnChanges {
    @Input() formGroup!: FormGroup;
    @Input() controlName: string = '';
    @Input() label: string = '';
    @Input() placeholder: string = 'Seçiniz...';
    @Input() tooltip: string = '';
    @Input() isRequired: boolean = false;
    @Input() isDisabled: boolean = false;
    @Input() multiple: boolean = false;
    @Input() options: SelectOption[] = [];
    @Input() icon?: string;
    @Input() customClass: string = '';
    @Input() appearance: 'fill' | 'outline' = 'outline';
    @Input() floatLabel: 'always' | 'never' | 'auto' = 'auto';
    @Input() hideRequiredMarker: boolean = false;
    @Input() panelClass: string = '';
    @Input() sortOptions: boolean = false;
    @Input() groupOptions: boolean = false;
    @Input() searchable: boolean = false; // New search feature

    // Search functionality
    searchControl = new FormControl('');
    filteredOptions: SelectOption[] = [];
    
    private subscriptions: Subscription[] = [];

    constructor(public readonly formValidationService: FormValidationService) {}

    ngOnInit(): void {
        if (this.sortOptions) {
            this.options = [...this.options].sort((a, b) => a.label.localeCompare(b.label, 'tr-TR'));
        }
        this.syncDisabledState();
        this.initializeFilteredOptions();
        this.setupSearchFilter();
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Sadece options değiştiğinde güncelle
        if (changes['options'] && !changes['options'].firstChange) {
            this.initializeFilteredOptions();
        }

        if (changes['isDisabled'] || changes['formGroup'] || changes['controlName']) {
            this.syncDisabledState();
        }
    }

    private setupFormControlListener(): void {
        if (this.multiple && this.formGroup && this.controlName) {
            const control = this.formGroup.get(this.controlName);
            if (control) {
                const controlSubscription = control.valueChanges.pipe(
                    debounceTime(100) // Sonsuz döngüyü önlemek için debounce ekle
                ).subscribe(() => {
                    // Sadece arama yoksa güncelle
                    if (!this.searchControl.value || this.searchControl.value.trim() === '') {
                        setTimeout(() => {
                            this.updateFilteredOptionsWithSelected();
                        }, 0);
                    }
                });
                
                this.subscriptions.push(controlSubscription);
            }
        }
    }

    private initializeFilteredOptions(): void {
        this.filteredOptions = [...this.options];
        // Çoklu seçim varsa ve seçilmiş öğeler varsa onları başa taşı
        if (this.multiple) {
            this.updateFilteredOptionsWithSelected();
        }
    }

    private updateFilteredOptionsWithSelected(): void {
        if (!this.multiple || !this.options || this.options.length === 0) return;
        
        const selectedValues = this.controlValue || [];
        if (selectedValues.length === 0) {
            this.filteredOptions = [...this.options];
            return;
        }
        
        const selectedOptions = this.options.filter(option => 
            selectedValues.includes(option.value)
        );
        
        const unselectedOptions = this.options.filter(option => 
            !selectedValues.includes(option.value)
        );
        
        this.filteredOptions = [...selectedOptions, ...unselectedOptions];
    }

    private setupSearchFilter(): void {
        if (this.searchable) {
            const searchSubscription = this.searchControl.valueChanges.pipe(
                debounceTime(500), // Daha az tetikleme için süreyi artır
                distinctUntilChanged(),
                map((searchTerm: string | null) => this.filterOptions(searchTerm || ''))
            ).subscribe(filtered => {
                this.filteredOptions = filtered;
            });
            
            this.subscriptions.push(searchSubscription);
        }
    }

    private filterOptions(searchTerm: string): SelectOption[] {
        if (!searchTerm.trim()) {
            // Arama yoksa tüm seçenekleri göster, ama seçilmişleri başa al
            const result = [...this.options];
            if (this.multiple) {
                const selectedValues = this.controlValue || [];
                if (selectedValues.length > 0) {
                    const selectedOptions = result.filter(option => 
                        selectedValues.includes(option.value)
                    );
                    const unselectedOptions = result.filter(option => 
                        !selectedValues.includes(option.value)
                    );
                    return [...selectedOptions, ...unselectedOptions];
                }
            }
            return result;
        }
        
        const lowercaseSearch = searchTerm.toLowerCase();
        const filteredOptions = this.options.filter(option => 
            option.label.toLowerCase().includes(lowercaseSearch) ||
            (option.value && option.value.toString().toLowerCase().includes(lowercaseSearch))
        );

        // Çoklu seçimde seçilmiş olanları her zaman göster
        if (this.multiple) {
            const selectedValues = this.controlValue || [];
            const selectedOptions = this.options.filter(option => 
                selectedValues.includes(option.value)
            );
            
            // Seçilmiş olanları filtrelenmiş listede yoksa ekle
            const combinedOptions = [...filteredOptions];
            selectedOptions.forEach(selectedOption => {
                if (!combinedOptions.find(opt => opt.value === selectedOption.value)) {
                    combinedOptions.unshift(selectedOption); // Başa ekle
                }
            });
            
            // Seçilmişleri başa al
            const selectedInFiltered = combinedOptions.filter(option => 
                selectedValues.includes(option.value)
            );
            const unselectedInFiltered = combinedOptions.filter(option => 
                !selectedValues.includes(option.value)
            );
            
            return [...selectedInFiltered, ...unselectedInFiltered];
        }
        
        return filteredOptions;
    }

    /**
     * Seçilmiş olanların sayısını döndürür
     */
    get selectedCount(): number {
        if (this.multiple) {
            const selectedValues = this.controlValue || [];
            return selectedValues.length;
        }
        return this.controlValue ? 1 : 0;
    }

    /**
     * Bir seçeneğin seçili olup olmadığını kontrol eder
     */
    isOptionSelected(value: any): boolean {
        if (this.multiple) {
            const selectedValues = this.controlValue || [];
            return selectedValues.includes(value);
        }
        return this.controlValue === value;
    }

    /**
     * Arama alanını temizler
     */
    clearSearch(): void {
        this.searchControl.setValue('');
        // Arama temizlendiğinde otomatik olarak filterOptions boş string ile çağrılacak
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

    /**
     * Seçilen değerlerin label'larını getirir (multiple select için)
     */
    get selectedLabels(): string[] {
        if (!this.multiple || !this.controlValue) return [];
        
        const selectedValues = Array.isArray(this.controlValue) ? this.controlValue : [this.controlValue];
        return selectedValues.map(value => {
            const option = this.options.find(opt => opt.value === value);
            return option ? option.label : value;
        });
    }

    /**
     * Seçilen değerin label'ını getirir (single select için)
     */
    get selectedLabel(): string {
        if (this.multiple || !this.controlValue) return '';
        
        const option = this.options.find(opt => opt.value === this.controlValue);
        return option ? option.label : this.controlValue;
    }

    /**
     * Gruplu seçenekleri organize eder
     */
    get organizedOptions(): any {
        if (!this.groupOptions) return this.options;

        const grouped = this.options.reduce((acc, option) => {
            const group = option.group || 'Diğer';
            if (!acc[group]) acc[group] = [];
            acc[group].push(option);
            return acc;
        }, {} as { [key: string]: SelectOption[] });

        return grouped;
    }

    private syncDisabledState(): void {
        const control = this.formGroup?.get(this.controlName);
        if (!control) {
            return;
        }

        if (this.isDisabled && control.enabled) {
            control.disable({ emitEvent: false });
        }

        if (!this.isDisabled && control.disabled) {
            control.enable({ emitEvent: false });
        }
    }
}
