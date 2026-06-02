import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation, ChangeDetectorRef, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { FormValidationService } from 'app/base/services/form-validation.service';
import { HttpService } from 'app/base/services/http.service';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-api-select-input',
  templateUrl: './api-select-input.component.html',
  styleUrls: ['./api-select-input.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [FormValidationService, HttpService]
})
export class ApiSelectInputComponent implements OnInit, OnChanges {

  @ViewChild('searchInput') searchInput: ElementRef<HTMLInputElement>;

  @Input() nameOfFormGroup: FormGroup;
  @Input() controlName: string = "";
  @Input() title: string = "";
  @Input() placeHolder: string = "";
  @Input() tooltipTitle: string = "";
  @Input() isMultiple: boolean = false;
  @Input() 
  set multiple(value: boolean) {
    this.isMultiple = value;
  }
  get multiple(): boolean {
    return this.isMultiple;
  }
  @Input() isRequired: boolean = false;
  @Input() isDisabled: boolean = false;
  @Output() selectChangeEvent: EventEmitter<any> = new EventEmitter();
  @Output() dataLoaded: EventEmitter<any[]> = new EventEmitter<any[]>();
  @Input() apiUrl: string = "";
  @Input() apiParam: any = {}; // API parametresi
  @Input() key: string = ""; // Eski kullanım için geriye uyumluluk
  @Input() compareKey: string = ""; // Eski kullanım için geriye uyumluluk
  @Input() displayField: string = "name"; // Görüntülenecek alan
  @Input() displayFields: string[] = []; // Birden fazla alan göstermek için
  @Input() displaySeparator: string = " "; // Alanlar arası ayırıcı
  @Input() searchFields: string[] = []; // Arama yapılacak alanlar
  @Input() excludeIds: number[] = []; // Hariç tutulacak ID'ler

  dataList$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  filteredItems: any[] = [];
  selectedItem: any | null = null;
  selectedItems: any[] = []; // Multiple seçim için

  // UI state
  isDropdownOpen: boolean = false;
  searchTerm: string = '';
  isLoading: boolean = false;
  hasToltip: boolean = false;
  private dataLoaded_: boolean = false;

  constructor(
    public readonly formValidationService: FormValidationService,
    private httpService: HttpService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Eski [key] kullanımı varsa displayField ile senkronize et
    if (changes['key'] && this.key && this.key.trim() !== '') {
      this.displayField = this.key;
    }

    // API URL veya parametresi değiştiğinde data'yı yeniden yükle (ilk render hariç)
    if (changes['apiUrl'] || changes['apiParam']) {
      const isFirstChange = (changes['apiUrl']?.firstChange ?? true) && (changes['apiParam']?.firstChange ?? true);
      if (!isFirstChange && this.apiUrl) {
        this.loadData();
      }
    }
  }

  ngOnInit(): void {
    this.hasToltip = this.tooltipTitle && this.tooltipTitle.length > 0;

    // Eski [key] kullanımı varsa displayField ile senkronize et
    if (this.key && this.key.trim() !== '') {
      this.displayField = this.key;
    }

    if (!this.dataLoaded_) {
      this.loadData();
    }

    this.filteredItems = [];

    if (this.nameOfFormGroup && this.controlName) {
      const control = this.nameOfFormGroup.get(this.controlName);
      if (!control) {
        console.warn(`ApiSelectInput: Control '${this.controlName}' not found in FormGroup`);
        return;
      }
      
      // Form değeri değiştiğinde selectedItem'ı güncelle
      control.valueChanges.subscribe(newValue => {
        if (this.isMultiple) {
          const values = Array.isArray(newValue) ? newValue : [newValue];
          this.selectedItems = values.filter(val => val && typeof val === 'object');
        } else {
          this.selectedItem = newValue && typeof newValue === 'object' ? newValue : null;
        }
        this.cdr.detectChanges(); // Change detection'ı tetikle
      });

      // İlk yükleme sırasında mevcut değeri kontrol et
      if (control.value) {
        // Data yüklendikten sonra selectedItem'ı set et
        this.dataList$.subscribe(data => {
          if (Array.isArray(data) && data.length > 0) {
            if (this.isMultiple) {
              const values = Array.isArray(control.value) ? control.value : [control.value];
              this.selectedItems = values.filter(val => val && typeof val === 'object');
            } else {
              if (control.value && typeof control.value === 'object') {
                
                // Eğer form value'da sadece eid varsa, API data'sından tam objeyi bul
                if (control.value.eid && (!control.value.title && !control.value.name && !control.value.tree)) {
                  const matchedItem = data.find(item => item.eid === control.value.eid);
                  
                  if (matchedItem) {
                    this.selectedItem = matchedItem;
                    // Form value'yu da güncelle
                    control.setValue(matchedItem, { emitEvent: true });
                  } else {
                    this.selectedItem = control.value;
                  }
                } else {
                  this.selectedItem = control.value;
                }
                this.cdr.detectChanges(); // Change detection'ı tetikle
              }
            }
          }
        });
      }
    }
  }

  loadData(): void {
    if (!this.apiUrl) {
      console.warn('ApiSelectInput: API URL not provided');
      return;
    }

    this.isLoading = true;
    this.dataLoaded_ = true;

    // API parametresini kullan, yoksa boş obje gönder
    const param = this.apiParam || {};

    this.httpService.Post(this.apiUrl, param).subscribe({
      next: (response) => {
        const data = response?.data || response || [];
        let dataArray = Array.isArray(data) ? data : [];
        if (this.excludeIds && this.excludeIds.length > 0) {
          dataArray = dataArray.filter(item => !this.excludeIds.includes(item.id));
        }
        this.dataList$.next(dataArray);
        this.isLoading = false;
        this.updateFilteredData();
        this.dataLoaded.emit(dataArray);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error(`API Select [${this.controlName}]: Error loading data`, error);
        this.dataList$.next([]);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleDropdown(): void {
    if (this.isDisabled) return;

    this.isDropdownOpen = !this.isDropdownOpen;

    if (this.isDropdownOpen) {
      this.searchTerm = '';
      this.updateFilteredData();
      // Dropdown DOM oluştuktan sonra search input'a focus ver
      setTimeout(() => this.searchInput?.nativeElement?.focus(), 0);
    }
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  onSearchChange(): void {
    this.updateFilteredData();
    this.cdr.detectChanges();
  }

  updateFilteredData(): void {
    const currentData = this.dataList$.value;
    const trimmedSearchTerm = (this.searchTerm || '').trim();

    if (trimmedSearchTerm === '') {
      this.filteredItems = currentData;
    } else {
      const searchLower = trimmedSearchTerm.toLowerCase();

      this.filteredItems = currentData.filter(item => {
        // Eğer searchFields belirtilmişse sadece o alanlarda ara
        if (this.searchFields && this.searchFields.length > 0) {
          return this.searchFields.some(field => {
            const value = this.getNestedValue(item, field);
            return value && value.toString().toLowerCase().includes(searchLower);
          });
        } else {
          // displayFields varsa onlarda ara, yoksa displayField'da ara
          if (this.displayFields && this.displayFields.length > 0) {
            return this.displayFields.some(field => {
              const value = this.getNestedValue(item, field);
              return value && value.toString().toLowerCase().includes(searchLower);
            });
          } else {
            // displayField'da ara
            const displayValue = this.getNestedValue(item, this.displayField);
            return displayValue && displayValue.toString().toLowerCase().includes(searchLower);
          }
        }
      });
    }
  }

  selectItem(item: any) {
    
    if (this.isMultiple) {
      // Multiple seçim
      const index = this.selectedItems.findIndex(selected => 
        this.isSameItem(selected, item)
      );
      if (index > -1) {
        // Zaten seçili, çıkar
        this.selectedItems.splice(index, 1);
      } else {
        // Seçili değil, ekle
        this.selectedItems.push(item);
      }
      
      // Form control'ü güncelle
      if (this.nameOfFormGroup && this.controlName) {
        // getValue metodunu kullanarak uygun value'yu al
        const selectedValues = this.selectedItems.map(item => this.getValue(item));
        this.nameOfFormGroup.get(this.controlName)?.setValue(selectedValues);
        this.nameOfFormGroup.get(this.controlName)?.markAsTouched();
      }
      
      // Multiple'da dropdown açık kalır
    } else {
      // Single seçim
      this.selectedItem = item;
      this.isDropdownOpen = false;
      this.searchTerm = '';
      
      // Form control'ü güncelle
      if (this.nameOfFormGroup && this.controlName) {
        // getValue metodunu kullanarak uygun value'yu al
        const selectedValue = this.getValue(item);
        
        this.nameOfFormGroup.get(this.controlName)?.setValue(selectedValue);
        this.nameOfFormGroup.get(this.controlName)?.markAsTouched();
        
      } else {
      }
    }
    
    this.selectChangeEvent.emit(this.isMultiple ? this.selectedItems : item);
  }

  isItemSelected(item: any): boolean {
    if (this.isMultiple) {
      return this.selectedItems.some(selected => 
        this.isSameItem(selected, item)
      );
    } else {
      return this.selectedItem && this.isSameItem(this.selectedItem, item);
    }
  }

  // İki item'ın aynı olup olmadığını kontrol et
  private isSameItem(item1: any, item2: any): boolean {
    if (!item1 || !item2) return false;

    // compareKey verilmişse öncelikli olarak bu alanı kullan
    if (this.compareKey && this.compareKey.trim() !== '') {
      const compareField = this.compareKey.trim();
      const item1Value = this.getNestedValue(item1, compareField);
      const item2Value = this.getNestedValue(item2, compareField);

      if (item1Value !== null && item1Value !== undefined && item2Value !== null && item2Value !== undefined) {
        return item1Value === item2Value;
      }
    }
    
    // ID varsa ID ile karşılaştır
    if (item1.id && item2.id) {
      return item1.id === item2.id;
    }
    
    // EID varsa EID ile karşılaştır
    if (item1.eid && item2.eid) {
      return item1.eid === item2.eid;
    }
    
    // Object reference karşılaştırması
    return item1 === item2;
  }

  removeSelectedItem(item: any, event: Event): void {
    event.stopPropagation();
    const index = this.selectedItems.findIndex(selected => 
      this.isSameItem(selected, item)
    );
    if (index > -1) {
      this.selectedItems.splice(index, 1);
      
      // Form control'ü güncelle
      if (this.nameOfFormGroup && this.controlName) {
        const selectedValues = this.selectedItems.map(selected => this.getValue(selected));
        this.nameOfFormGroup.get(this.controlName)?.setValue(selectedValues);
        this.nameOfFormGroup.get(this.controlName)?.markAsTouched();
      }
      
      this.selectChangeEvent.emit(this.selectedItems);
    }
  }

  clearSelection(event?: Event): void {
    console.log('[ApiSelect] clearSelection çağrıldı, mevcut selectedItem:', this.selectedItem);
    if (event) {
      event.stopPropagation(); // Dropdown açılmasını engelle
    }

    if (this.isMultiple) {
      this.selectedItems = [];
    } else {
      this.selectedItem = null;
    }

    this.searchTerm = '';

    if (this.nameOfFormGroup && this.controlName) {
      console.log('[ApiSelect] Form value null yapılıyor');
      this.nameOfFormGroup.get(this.controlName)?.setValue(this.isMultiple ? [] : null);
      this.nameOfFormGroup.get(this.controlName)?.markAsTouched();
    }

    this.selectChangeEvent.emit(this.isMultiple ? [] : null);
  }

  trackByValue = (index: number, item: any): any => {
    if (this.compareKey && this.compareKey.trim() !== '') {
      const compareValue = this.getNestedValue(item, this.compareKey.trim());
      if (compareValue !== null && compareValue !== undefined) {
        return compareValue;
      }
    }

    // ID varsa ID'yi kullan, yoksa eid'yi kullan, en son çare olarak index
    return item?.id || item?.eid || index;
  }

  // Nested property değerini almak için helper method
  getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return null;
    
    return path.split('.').reduce((current, prop) => {
      return current && current[prop] !== undefined ? current[prop] : null;
    }, obj);
  }

  // Display value'yu almak için method
  getDisplayValue(obj: any): string {
    if (!obj) return '';
    
    // Eğer displayFields array'i varsa onu kullan
    if (this.displayFields && this.displayFields.length > 0) {
      const values = this.displayFields
        .map(field => this.getNestedValue(obj, field))
        .filter(value => value !== null && value !== undefined && value !== '');
      return values.join(this.displaySeparator);
    }
    
    // Yoksa displayField'ı kullan
    return this.getNestedValue(obj, this.displayField) || '';
  }

  // Value'yu almak için method - Her zaman tam objeyi döndür
  getValue(obj: any): any {
    return obj; // Her zaman tam objeyi döndür
  }
}
