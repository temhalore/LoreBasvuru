import { Component, Input, OnInit, OnDestroy, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule, NativeDateAdapter } from '@angular/material/core';
import { FormValidationService, AllValidationErrors } from '../../../services/form-validation.service';
import { Subscription } from 'rxjs';

const DATEPICKER_INPUT_FORMATS = {
    parse: {
        dateInput: 'DD/MM/YYYY',
    },
    display: {
        dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' } as Intl.DateTimeFormatOptions,
        monthYearLabel: { year: 'numeric', month: 'short' } as Intl.DateTimeFormatOptions,
        dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' } as Intl.DateTimeFormatOptions,
        monthYearA11yLabel: { year: 'numeric', month: 'long' } as Intl.DateTimeFormatOptions,
    },
};

class TrDatepickerInputAdapter extends NativeDateAdapter {
    override parse(value: unknown): Date | null {
        if (typeof value === 'string') {
            const trimmedValue = value.trim();
            if (!trimmedValue) {
                return null;
            }

            if (/^\d+$/.test(trimmedValue)) {
                return null;
            }

            const normalizedValue = trimmedValue.replace(/[.\-]/g, '/');
            const match = normalizedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

            if (match) {
                const day = Number(match[1]);
                const month = Number(match[2]) - 1;
                const year = Number(match[3]);
                const parsedDate = new Date(year, month, day);

                if (
                    parsedDate.getFullYear() === year
                    && parsedDate.getMonth() === month
                    && parsedDate.getDate() === day
                ) {
                    return parsedDate;
                }

                return null;
            }

            return null;
        }

        const parsedValue = super.parse(value);
        return parsedValue instanceof Date && this.isValid(parsedValue) ? parsedValue : null;
    }

    override format(date: Date, displayFormat: unknown): string {
        if (!this.isValid(date)) {
            return '';
        }

        if (displayFormat && typeof displayFormat === 'object') {
            return new Intl.DateTimeFormat('tr-TR', displayFormat as Intl.DateTimeFormatOptions).format(date);
        }

        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    }
}

export interface DateRangeValue {
    start: Date | null;
    end: Date | null;
}

@Component({
    selector: 'app-datepicker-input',
    standalone: true,
    templateUrl: './datepicker-input.component.html',
    styleUrls: ['./datepicker-input.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [
        { provide: DateAdapter, useClass: TrDatepickerInputAdapter },
        { provide: MAT_DATE_FORMATS, useValue: DATEPICKER_INPUT_FORMATS },
        { provide: MAT_DATE_LOCALE, useValue: 'tr-TR' },
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatTooltipModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule
    ]
})
export class DatepickerInputComponent implements OnInit, OnDestroy {
    private readonly manualDateErrorKeys = [
        'matDatepickerParse',
        'matDatepickerMin',
        'matDatepickerMax',
        'matDatepickerFilter'
    ];

    @ViewChild('datePicker') datePicker!: MatDatepicker<Date>;
    @ViewChild('monthPicker') monthPicker!: MatDatepicker<Date>;
    @ViewChild('yearPicker') yearPicker!: MatDatepicker<Date>;
    @ViewChild('timeInput') timeInput!: ElementRef<HTMLInputElement>;

    @Input() formGroup!: FormGroup;
    @Input() controlName: string = '';
    @Input() label: string = '';
    @Input() placeholder: string = '';
    @Input() tooltip: string = '';
    @Input() isRequired: boolean = false;
    @Input() isDisabled: boolean = false;
    @Input() icon?: string;
    @Input() customClass: string = '';
    @Input() appearance: 'fill' | 'outline' = 'outline';
    @Input() floatLabel: 'always' | 'never' | 'auto' = 'auto';
    @Input() hideRequiredMarker: boolean = false;

    // Date picker specific properties
    @Input() dateType: 'date' | 'datetime' | 'time' | 'month' | 'year' | 'range' = 'date';
    @Input() minDate?: Date;
    @Input() maxDate?: Date;
    @Input() dateFilter?: (date: Date | null) => boolean;
    @Input() startView: 'month' | 'year' | 'multi-year' = 'month';
    @Input() enableClearButton: boolean = false;
    @Input() enableTodayButton: boolean = false;
    @Input() showCalendarIcon: boolean = true;
    @Input() showControlStatus: boolean = true;
    @Input() dateFormat: string = 'dd/MM/yyyy';
    @Input() timeFormat: string = 'HH:mm';
    @Input() dateTimeFormat: string = 'dd/MM/yyyy HH:mm';

    // Range picker properties
    @Input() isRangePicker: boolean = false;
    @Input() rangeStartControlName?: string;
    @Input() rangeEndControlName?: string;

    private subscriptions: Subscription[] = [];

    constructor(
        public readonly formValidationService: FormValidationService,
        private readonly dateAdapter: DateAdapter<Date>
    ) {}

    ngOnInit(): void {
        if (!this.formGroup || !this.controlName) {
            console.error('FormGroup and controlName are required for DatepickerInputComponent');
            return;
        }

        // Set disabled state on FormControl if needed
        if (this.isDisabled && this.control) {
            this.control.disable();
        }

        // Set default min/max dates if not provided
        if (!this.minDate && this.dateType !== 'time') {
            this.minDate = new Date(1900, 0, 1);
        }
        if (!this.maxDate && this.dateType !== 'time') {
            this.maxDate = new Date(2100, 11, 31);
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    get control() {
        return this.formGroup?.get(this.controlName);
    }

    get rangeStartControl() {
        return this.rangeStartControlName ? this.formGroup?.get(this.rangeStartControlName) : null;
    }

    get rangeEndControl() {
        return this.rangeEndControlName ? this.formGroup?.get(this.rangeEndControlName) : null;
    }

    get value(): Date | null {
        return this.control?.value || null;
    }

    get rangeValue(): DateRangeValue {
        return {
            start: this.rangeStartControl?.value || null,
            end: this.rangeEndControl?.value || null
        };
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
        return this.isRequired && !this.hideRequiredMarker;
    }

    get hasTooltip(): boolean {
        return !!this.tooltip;
    }

    get usesMaskedDateInput(): boolean {
        return !this.isRangePicker && this.dateType === 'date';
    }

    get inputType(): string {
        switch (this.dateType) {
            case 'datetime':
                return 'datetime-local';
            case 'time':
                return 'time';
            case 'month':
                return 'month';
            case 'year':
                return 'number';
            default:
                return 'date';
        }
    }

    get displayFormat(): string {
        switch (this.dateType) {
            case 'datetime':
                return this.dateTimeFormat;
            case 'time':
                return this.timeFormat;
            case 'month':
                return 'MM/yyyy';
            case 'year':
                return 'yyyy';
            default:
                return this.dateFormat;
        }
    }

    get calendarIcon(): string {
        if (this.icon) return this.icon;
        
        switch (this.dateType) {
            case 'time':
                return 'access_time';
            case 'month':
                return 'date_range';
            case 'year':
                return 'event';
            default:
                return 'calendar_today';
        }
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
            case 'matDatepickerParse':
                return 'Geçerli bir tarih giriniz (GG/AA/YYYY)';
            case 'matDatepickerMin':
                return 'Seçilen tarih minimum tarihten küçük olamaz';
            case 'matDatepickerMax':
                return 'Seçilen tarih maksimum tarihten büyük olamaz';
            case 'matDatepickerFilter':
                return 'Seçilen tarih geçersiz';
            default:
                return 'Geçersiz değer';
        }
    }

    getAllErrors(): AllValidationErrors[] {
        return this.formValidationService.getFormControlValidationErrors(this.formGroup.controls, this.controlName);
    }

    clearDate(): void {
        if (this.isControlDisabled) return;

        if (this.isRangePicker) {
            // Clear both range controls
            if (this.rangeStartControl) {
                this.rangeStartControl.setValue(null);
                this.rangeStartControl.markAsTouched();
            }
            if (this.rangeEndControl) {
                this.rangeEndControl.setValue(null);
                this.rangeEndControl.markAsTouched();
            }
        } else {
            // Clear single control
            if (this.control) {
                this.control.setValue(null);
                this.control.markAsTouched();
            }
        }
    }

    setToday(): void {
        if (this.isControlDisabled) return;

        const today = new Date();

        if (this.isRangePicker) {
            // Set range to today for both start and end
            if (this.rangeStartControl) {
                this.rangeStartControl.setValue(today);
                this.rangeStartControl.markAsTouched();
            }
            if (this.rangeEndControl) {
                this.rangeEndControl.setValue(today);
                this.rangeEndControl.markAsTouched();
            }
        } else {
            // Set single control based on type
            if (this.control) {
                switch (this.dateType) {
                    case 'time':
                        // For time only, set current time
                        const timeStr = today.toTimeString().split(' ')[0].substring(0, 5);
                        this.control.setValue(timeStr);
                        break;
                    case 'month':
                        // For month, set current month
                        this.control.setValue(new Date(today.getFullYear(), today.getMonth(), 1));
                        break;
                    case 'year':
                        // For year, set current year
                        this.control.setValue(today.getFullYear());
                        break;
                    default:
                        this.control.setValue(today);
                        break;
                }
                this.control.markAsTouched();
            }
        }
    }

    onDateChange(event: any): void {
        const value = this.dateType === 'time'
            ? (event.target?.value ?? event.value ?? null)
            : (event.value ?? null);

        if (this.control) {
            this.control.setValue(value);
            this.setManualDateErrors(null);
            this.control.markAsTouched();
        }
    }

    onManualDateInput(event: Event): void {
        if (!this.usesMaskedDateInput) {
            return;
        }

        const input = event.target as HTMLInputElement;
        const digits = input.value.replace(/\D/g, '').slice(0, 8);
        const maskedValue = this.formatManualDateInput(digits);

        if (input.value !== maskedValue) {
            input.value = maskedValue;
        }

        this.syncManualDateInput(maskedValue, digits.length);
    }

    onManualDateKeydown(event: KeyboardEvent): void {
        if (!this.usesMaskedDateInput || event.ctrlKey || event.metaKey || event.altKey) {
            return;
        }

        const allowedKeys = [
            'Backspace',
            'Delete',
            'Tab',
            'Enter',
            'ArrowLeft',
            'ArrowRight',
            'Home',
            'End'
        ];

        if (allowedKeys.includes(event.key) || /^\d$/.test(event.key)) {
            return;
        }

        event.preventDefault();
    }

    onManualDateBlur(event: FocusEvent): void {
        if (!this.usesMaskedDateInput) {
            return;
        }

        const input = event.target as HTMLInputElement;
        const digits = input.value.replace(/\D/g, '').slice(0, 8);
        const maskedValue = this.formatManualDateInput(digits);

        if (input.value !== maskedValue) {
            input.value = maskedValue;
        }

        this.syncManualDateInput(maskedValue, digits.length);
        this.control?.markAsTouched();
    }

    onRangeStartChange(event: any): void {
        if (this.rangeStartControl) {
            const value = event.value || event.target?.value;
            this.rangeStartControl.setValue(value);
            this.rangeStartControl.markAsTouched();
        }
    }

    onRangeEndChange(event: any): void {
        if (this.rangeEndControl) {
            const value = event.value || event.target?.value;
            this.rangeEndControl.setValue(value);
            this.rangeEndControl.markAsTouched();
        }
    }

    // Date filter functions for common use cases
    weekdaysOnly = (date: Date | null): boolean => {
        const day = (date || new Date()).getDay();
        return day !== 0 && day !== 6; // Sunday = 0, Saturday = 6
    }

    weekendsOnly = (date: Date | null): boolean => {
        const day = (date || new Date()).getDay();
        return day === 0 || day === 6;
    }

    private formatManualDateInput(digits: string): string {
        if (digits.length <= 2) {
            return digits;
        }

        if (digits.length <= 4) {
            return `${digits.slice(0, 2)}/${digits.slice(2)}`;
        }

        return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }

    private syncManualDateInput(displayValue: string, digitCount: number): void {
        if (!this.control) {
            return;
        }

        if (!displayValue) {
            this.control.setValue(null);
            this.setManualDateErrors(null);
            return;
        }

        if (digitCount < 8) {
            this.setManualDateErrors({
                matDatepickerParse: { text: displayValue }
            });
            return;
        }

        const parsedDate = this.dateAdapter.parse(displayValue, DATEPICKER_INPUT_FORMATS.parse.dateInput);

        if (!(parsedDate instanceof Date) || !this.dateAdapter.isValid(parsedDate)) {
            this.setManualDateErrors({
                matDatepickerParse: { text: displayValue }
            });
            return;
        }

        if (this.minDate && this.normalizeDate(parsedDate) < this.normalizeDate(this.minDate)) {
            this.setManualDateErrors({
                matDatepickerMin: {
                    min: this.minDate,
                    actual: parsedDate
                }
            });
            return;
        }

        if (this.maxDate && this.normalizeDate(parsedDate) > this.normalizeDate(this.maxDate)) {
            this.setManualDateErrors({
                matDatepickerMax: {
                    max: this.maxDate,
                    actual: parsedDate
                }
            });
            return;
        }

        if (this.dateFilter && !this.dateFilter(parsedDate)) {
            this.setManualDateErrors({
                matDatepickerFilter: true
            });
            return;
        }

        this.control.setValue(parsedDate);
        this.setManualDateErrors(null);
    }

    private setManualDateErrors(errors: ValidationErrors | null): void {
        if (!this.control) {
            return;
        }

        const nextErrors: ValidationErrors = { ...(this.control.errors || {}) };

        this.manualDateErrorKeys.forEach(key => delete nextErrors[key]);

        if (errors) {
            Object.assign(nextErrors, errors);
        }

        this.control.setErrors(Object.keys(nextErrors).length ? nextErrors : null);
    }

    private normalizeDate(date: Date): number {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    }

    // Utility method to format date for display
    formatDate(date: Date | null): string {
        if (!date) return '';
        
        try {
            return new Intl.DateTimeFormat('tr-TR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: this.dateType === 'datetime' ? '2-digit' : undefined,
                minute: this.dateType === 'datetime' ? '2-digit' : undefined
            }).format(date);
        } catch (error) {
            return date.toString();
        }
    }

    // Get the correct picker reference based on dateType
    getPickerRef(): MatDatepicker<Date> {
        switch (this.dateType) {
            case 'month':
                return this.monthPicker;
            case 'year':
                return this.yearPicker;
            default:
                return this.datePicker;
        }
    }

    // Open time picker programmatically
    openTimePicker(): void {
        if (this.timeInput && !this.isControlDisabled) {
            // Focus the time input to trigger the native time picker
            this.timeInput.nativeElement.focus();
            // Show the time picker if supported by the browser
            if (this.timeInput.nativeElement.showPicker) {
                this.timeInput.nativeElement.showPicker();
            } else {
                // Fallback: just focus the input
                this.timeInput.nativeElement.click();
            }
        }
    }
}
