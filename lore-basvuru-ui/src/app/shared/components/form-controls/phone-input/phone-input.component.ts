import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild, OnInit, OnDestroy, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export interface PhoneCountry {
  name: string;
  iso2: string;
  dialCode: string;
  flag: string;
}

const PHONE_COUNTRIES: PhoneCountry[] = [
  { name: 'Türkiye', iso2: 'TR', dialCode: '90', flag: '🇹🇷' },
  { name: 'ABD', iso2: 'US', dialCode: '1', flag: '🇺🇸' },
  { name: 'Almanya', iso2: 'DE', dialCode: '49', flag: '🇩🇪' },
  { name: 'Avusturya', iso2: 'AT', dialCode: '43', flag: '🇦🇹' },
  { name: 'Azerbaycan', iso2: 'AZ', dialCode: '994', flag: '🇦🇿' },
  { name: 'Belçika', iso2: 'BE', dialCode: '32', flag: '🇧🇪' },
  { name: 'Birleşik Krallık', iso2: 'GB', dialCode: '44', flag: '🇬🇧' },
  { name: 'Bulgaristan', iso2: 'BG', dialCode: '359', flag: '🇧🇬' },
  { name: 'Çin', iso2: 'CN', dialCode: '86', flag: '🇨🇳' },
  { name: 'Danimarka', iso2: 'DK', dialCode: '45', flag: '🇩🇰' },
  { name: 'Finlandiya', iso2: 'FI', dialCode: '358', flag: '🇫🇮' },
  { name: 'Fransa', iso2: 'FR', dialCode: '33', flag: '🇫🇷' },
  { name: 'Gürcistan', iso2: 'GE', dialCode: '995', flag: '🇬🇪' },
  { name: 'Hollanda', iso2: 'NL', dialCode: '31', flag: '🇳🇱' },
  { name: 'Irak', iso2: 'IQ', dialCode: '964', flag: '🇮🇶' },
  { name: 'Iran', iso2: 'IR', dialCode: '98', flag: '🇮🇷' },
  { name: 'İspanya', iso2: 'ES', dialCode: '34', flag: '🇪🇸' },
  { name: 'İsveç', iso2: 'SE', dialCode: '46', flag: '🇸🇪' },
  { name: 'İsviçre', iso2: 'CH', dialCode: '41', flag: '🇨🇭' },
  { name: 'İtalya', iso2: 'IT', dialCode: '39', flag: '🇮🇹' },
  { name: 'Japonya', iso2: 'JP', dialCode: '81', flag: '🇯🇵' },
  { name: 'Kanada', iso2: 'CA', dialCode: '1', flag: '🇨🇦' },
  { name: 'Kazakistan', iso2: 'KZ', dialCode: '7', flag: '🇰🇿' },
  { name: 'KKTC', iso2: 'CY', dialCode: '90392', flag: '🇨🇾' },
  { name: 'Lübnan', iso2: 'LB', dialCode: '961', flag: '🇱🇧' },
  { name: 'Mısır', iso2: 'EG', dialCode: '20', flag: '🇪🇬' },
  { name: 'Norveç', iso2: 'NO', dialCode: '47', flag: '🇳🇴' },
  { name: 'Özbekistan', iso2: 'UZ', dialCode: '998', flag: '🇺🇿' },
  { name: 'Polonya', iso2: 'PL', dialCode: '48', flag: '🇵🇱' },
  { name: 'Portekiz', iso2: 'PT', dialCode: '351', flag: '🇵🇹' },
  { name: 'Romanya', iso2: 'RO', dialCode: '40', flag: '🇷🇴' },
  { name: 'Rusya', iso2: 'RU', dialCode: '7', flag: '🇷🇺' },
  { name: 'Suudi Arabistan', iso2: 'SA', dialCode: '966', flag: '🇸🇦' },
  { name: 'Suriye', iso2: 'SY', dialCode: '963', flag: '🇸🇾' },
  { name: 'Türkmenistan', iso2: 'TM', dialCode: '993', flag: '🇹🇲' },
  { name: 'Ukrayna', iso2: 'UA', dialCode: '380', flag: '🇺🇦' },
  { name: 'Ürdün', iso2: 'JO', dialCode: '962', flag: '🇯🇴' },
  { name: 'Yunanistan', iso2: 'GR', dialCode: '30', flag: '🇬🇷' },
];

@Component({
  selector: 'app-phone-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatIconModule],
  templateUrl: './phone-input.component.html',
  styleUrls: ['./phone-input.component.scss'],
})
export class PhoneInputComponent implements OnInit, OnDestroy, OnChanges {
  @Input() formGroup!: FormGroup;
  @Input() controlName: string = '';
  @Input() label: string = 'Telefon';
  @Input() placeholder: string = '5XX XXX XX XX';
  @Input() isRequired: boolean = false;
  @Input() defaultCountryIso2: string = 'TR';
  @Input() noPaste: boolean = false;
  @Input() readonlyCountry: boolean = false;
  @Input() fixedCountry: PhoneCountry | null = null;
  @Input() hideCountrySelector: boolean = false;

  @Output() countryChanged = new EventEmitter<PhoneCountry>();

  @ViewChild('dropdownRef') dropdownRef: ElementRef;
  @ViewChild('searchInputRef') searchInputRef: ElementRef;

  countries: PhoneCountry[] = PHONE_COUNTRIES;
  selectedCountry: PhoneCountry;
  isDropdownOpen = false;
  searchTerm = '';

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly elementRef: ElementRef,
  ) {}

  ngOnInit(): void {
    if (this.fixedCountry) {
      this.selectedCountry = this.fixedCountry;
    } else {
      this.selectedCountry = this.countries.find(c => c.iso2 === this.defaultCountryIso2)
        || this.countries[0];
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.fixedCountry && this.fixedCountry) {
      this.selectedCountry = this.fixedCountry;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {}

  get filteredCountries(): PhoneCountry[] {
    if (!this.searchTerm) return this.countries;
    const term = this.searchTerm.toLowerCase();
    return this.countries.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.dialCode.includes(term)
    );
  }

  get isControlInvalid(): boolean {
    const ctrl = this.formGroup?.get(this.controlName);
    return ctrl?.invalid && ctrl?.touched;
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    this.searchTerm = '';
    this.cdr.markForCheck();
    if (this.isDropdownOpen) {
      setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 50);
    }
  }

  selectCountry(country: PhoneCountry): void {
    this.selectedCountry = country;
    this.isDropdownOpen = false;
    this.searchTerm = '';
    this.countryChanged.emit(country);
    this.cdr.markForCheck();
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.selectedCountry?.iso2 === 'TR') {
      const digits = input.value.replace(/\D/g, '').slice(0, 10);
      let formatted = '';
      if (digits.length > 0) formatted = digits.slice(0, 3);
      if (digits.length > 3) formatted += ' ' + digits.slice(3, 6);
      if (digits.length > 6) formatted += ' ' + digits.slice(6, 8);
      if (digits.length > 8) formatted += ' ' + digits.slice(8, 10);
      input.value = formatted;
      this.formGroup.get(this.controlName)?.setValue(formatted, { emitEvent: false });
    } else {
      const digits = input.value.replace(/\D/g, '').slice(0, 15);
      input.value = digits;
      this.formGroup.get(this.controlName)?.setValue(digits, { emitEvent: false });
    }
  }

  onPaste(event: ClipboardEvent): void {
    if (this.noPaste) {
      event.preventDefault();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isDropdownOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
      this.cdr.markForCheck();
    }
  }

  get dialCodeDisplay(): string {
    return '+' + (this.selectedCountry?.dialCode || '90');
  }

  getFullPhone(): string {
    const formatted = this.formGroup.get(this.controlName)?.value || '';
    return '+' + (this.selectedCountry?.dialCode || '90') + formatted.replace(/\s/g, '');
  }
}
