/* eslint-disable @angular-eslint/use-lifecycle-interface */
/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
import { BehaviorSubject, combineLatest, Observable, of, startWith } from 'rxjs';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { KodModel } from 'app/base/models/common/kod.model';
import { FormValidationService } from 'app/shared/services/form-validation.service';
import { CodeService } from 'app/base/services/code.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-code-select-input',
  templateUrl: './code-select-input.component.html',
  styleUrls: ['./code-select-input.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [FormValidationService, CodeService]
})
export class CodeSelectInputComponent implements OnInit, OnChanges, OnDestroy {

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
  @Input() code: number;
  @Input() includeIds: number[] = [];
  @Input() excludeIds: number[] = [];

  codeListDto$: BehaviorSubject<KodModel[]> = new BehaviorSubject<KodModel[]>([]);
  filteredCodeList$: Observable<KodModel[]> = of([]);
  selectedItem: KodModel | null = null;
  selectedItems: KodModel[] = []; // Multiple seçim için
  isDropdownOpen: boolean = false;
  searchTerm: string = '';
  hasToltip: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(
    public readonly formValidationService: FormValidationService,
    private readonly codeService: CodeService,
    private readonly cdr: ChangeDetectorRef,
    private elementRef: ElementRef
  ) {
    if (this.tooltipTitle !== '') {
      this.hasToltip = true;
    }
    this.filteredCodeList$ = this.codeListDto$.asObservable();
  }

  ngOnInit() {    
    this.GetCodeList();
    
    // Form control değerini dinle (sadece form group varsa)
    if (this.nameOfFormGroup && this.controlName) {
      const control = this.nameOfFormGroup.get(this.controlName);
      
      if (control) {
        const subscription = combineLatest([
          control.valueChanges.pipe(startWith(control.value)),
          this.codeListDto$.asObservable(),
        ]).subscribe(([value, codes]) => {
          this.syncSelectionFromValue(value, codes);
        });

        this.subscriptions.push(subscription);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['includeIds'] && !changes['includeIds'].firstChange)
      || (changes['excludeIds'] && !changes['excludeIds'].firstChange)) {
      this.refreshFilteredCodes();
      this.cdr.markForCheck();
    }
  }

  private syncSelectionFromValue(value: unknown, codes: KodModel[]): void {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      if (this.isMultiple) {
        this.selectedItems = [];
      } else {
        this.selectedItem = null;
      }

      this.cdr.detectChanges();
      return;
    }

    if (this.isMultiple) {
      const values = Array.isArray(value) ? value : [value];
      const safeCodes = codes ?? [];

      if (safeCodes.length === 0) {
        this.selectedItems = values.filter((v): v is KodModel => typeof v === 'object' && v !== null && typeof (v as KodModel).id === 'number');
      } else {
        this.selectedItems = safeCodes.filter(code =>
          values.some(val => (typeof val === 'object' ? (val as { id?: number })?.id === code.id : val === code.id))
        );
      }
    } else {
      if (typeof value === 'object' && value !== null) {
        const asKod = value as KodModel;
        if (typeof asKod.id === 'number') {
          this.selectedItem = asKod;
          this.cdr.detectChanges();
          return;
        }
      }

      const searchId = typeof value === 'object' ? (value as { id?: number })?.id : (value as number);
      const foundItem = (codes ?? []).find(code => code.id === searchId) ?? null;
      this.selectedItem = foundItem;
    }

    this.refreshFilteredCodes();
    this.cdr.detectChanges();
  }

  GetCodeList() {
    this.codeService.GetCodeList(this.code).subscribe((response: KodModel[]) => {
      this.codeListDto$.next(response);
      this.refreshFilteredCodes();
    });
  }

  private refreshFilteredCodes(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredCodeList$ = this.codeListDto$.pipe(
      map(codes => {
        const selectedIds = new Set<number>([
          ...(this.selectedItem ? [this.selectedItem.id] : []),
          ...this.selectedItems.map(item => item.id)
        ]);

        return codes.filter(code => {
          const isNotIncluded = this.includeIds.length > 0
            && !this.includeIds.includes(code.id)
            && !selectedIds.has(code.id);
          if (isNotIncluded) {
            return false;
          }

          const isExcluded = this.excludeIds.includes(code.id) && !selectedIds.has(code.id);
          if (isExcluded) {
            return false;
          }

          if (!term) {
            return true;
          }

          return code.kod.toLowerCase().includes(term) ||
            code.kisaAd?.toLowerCase().includes(term);
        });
      })
    );
  }

  toggleDropdown() {
    if (!this.isDisabled) {
      this.isDropdownOpen = !this.isDropdownOpen;
      if (this.isDropdownOpen) {
        this.searchTerm = '';
        this.refreshFilteredCodes();
      }
    }
  }

  selectItem(item: KodModel) {
    
    if (this.isMultiple) {
      // Multiple seçim
      const index = this.selectedItems.findIndex(selected => selected.id === item.id);
      if (index > -1) {
        // Zaten seçili, çıkar
        this.selectedItems.splice(index, 1);
      } else {
        // Seçili değil, ekle
        this.selectedItems.push(item);
      }
      
      // Form control'ü güncelle - KodModel array'i olarak (tam model objesi)
      if (this.nameOfFormGroup && this.controlName) {
        this.nameOfFormGroup.get(this.controlName)?.setValue([...this.selectedItems]);
        this.nameOfFormGroup.get(this.controlName)?.markAsTouched();
      }
      
      // Multiple'da dropdown açık kalır
    } else {
      // Single seçim
      this.selectedItem = item;
      this.isDropdownOpen = false;
      this.searchTerm = '';
      
      // Form control'ü güncelle - KodModel objesi olarak (tam model)
      if (this.nameOfFormGroup && this.controlName) {
        this.nameOfFormGroup.get(this.controlName)?.setValue(item);
        this.nameOfFormGroup.get(this.controlName)?.markAsTouched();
      }
    }
    
    // Event emit et
    this.selectChangeEvent.emit(this.isMultiple ? this.selectedItems : item);
  }

  // Multiple seçimde item'in seçili olup olmadığını kontrol et
  isItemSelected(item: KodModel): boolean {
    if (this.isMultiple) {
      return this.selectedItems.some(selected => selected.id === item.id);
    }
    return this.selectedItem?.id === item.id;
  }

  // Seçili öğeleri temizle
  clearSelection(event?: Event) {
    if (event) {
      event.stopPropagation(); // Dropdown açılmasını engelle
    }
    
    
    if (this.isMultiple) {
      this.selectedItems = [];
    } else {
      this.selectedItem = null;
    }
    
    if (this.nameOfFormGroup && this.controlName) {
      const control = this.nameOfFormGroup.get(this.controlName);
      if (control) {
        // emitEvent: true ile valueChanges tetiklenir ve parent component'teki filter güncellenir
        control.setValue(this.isMultiple ? [] : null, { emitEvent: true });
        control.markAsTouched();
      }
    }
    
  }

  // Multiple seçimde tek item'ı kaldır
  removeSelectedItem(item: KodModel, event: Event) {
    event.stopPropagation();
    if (this.isMultiple) {
      const index = this.selectedItems.findIndex(selected => selected.id === item.id);
      if (index > -1) {
        this.selectedItems.splice(index, 1);
        
        if (this.nameOfFormGroup && this.controlName) {
          this.nameOfFormGroup.get(this.controlName)?.setValue([...this.selectedItems]);
          this.nameOfFormGroup.get(this.controlName)?.markAsTouched();
        }
        
        this.selectChangeEvent.emit(this.selectedItems);
      }
    }
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    const term = target.value.toLowerCase();
    this.searchTerm = term;

    this.refreshFilteredCodes();
  }

  trackByCode(index: number, item: KodModel): any {
    return item.id;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: any) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sb) => sb.unsubscribe());
  }
}
