import { Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CodeSelectInputComponent } from 'app/shared/components/form-controls/code-select-input/code-select-input.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-dynamic-kural-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CodeSelectInputComponent
  ],
  templateUrl: './dynamic-kural-form.component.html',
  styleUrls: ['./dynamic-kural-form.component.scss']
})
export class DynamicKuralFormComponent implements OnInit, OnChanges {
  /**
   * Seçilen Kural Tip Kodu
   * 2020001: RegexKontrol
   * 2020002: SayiAraligi
   * 2020003: TarihAraligi
   * 2020004: MinMaxKarakter
   * 2020005: DosyaKisitlamalari
   * 2020008: SoruRevizyonDavranis
   */
  @Input() kuralTipKod: string | null = null;

  /**
   * Edit mode için başlangıç JSON değeri
   */
  @Input() initialJson: string | null = null;

  /**
   * JSON değiştiğinde emit edilir
   */
  @Output() jsonChange = new EventEmitter<string>();

  /**
   * Form validation state değiştiğinde emit edilir
   */
  @Output() validChange = new EventEmitter<boolean>();

  formGroup: FormGroup;
  currentKuralTip: string | null = null;

  // Kod Tip ID'leri
  readonly DAVRANIS_TIP_KOD_ID = 208; // Soru Revizyon Davranış tipi
  readonly DOSYA_UZANTI_KOD_ID = 206; // Dosya uzantıları

  constructor(private fb: FormBuilder) {
    this.formGroup = this.fb.group({});
  }

  ngOnInit(): void {
    if (this.kuralTipKod) {
      this.setupFormByKuralTip(this.kuralTipKod);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['kuralTipKod'] && this.kuralTipKod && this.kuralTipKod !== this.currentKuralTip) {
      this.setupFormByKuralTip(this.kuralTipKod);
    }
  }

  /**
   * Kural Tip'e göre form alanlarını oluştur
   */
  private setupFormByKuralTip(kuralTipKod: string): void {
    this.currentKuralTip = kuralTipKod;
    
    // Ortak alanlar (tüm kural tiplerinde var)
    const baseControls: any = {
      HataMesaji: ['', Validators.required],
      IsZorunlu: [true]
    };

    // Kural Tip'e göre özel alanlar ekle
    switch (kuralTipKod) {
      case '2020001': // RegexKontrol
        this.formGroup = this.fb.group({
          ...baseControls,
          RegexPattern: ['', Validators.required]
        });
        break;

      case '2020002': // SayiAraligi
        this.formGroup = this.fb.group({
          ...baseControls,
          MinDeger: [null],
          MaxDeger: [null]
        });
        break;

      case '2020003': // TarihAraligi
        this.formGroup = this.fb.group({
          ...baseControls,
          BaslangicTarihi: [null],
          BitisTarihi: [null]
        });
        break;

      case '2020004': // MinMaxKarakter
        this.formGroup = this.fb.group({
          ...baseControls,
          MinKarakter: [null],
          MaxKarakter: [null]
        });
        break;

      case '2020005': // DosyaKisitlamalari
        this.formGroup = this.fb.group({
          ...baseControls,
          IzinVerilenUzantiKodList: [[]],
          MinDosyaBoyutuMB: [null],
          MaxDosyaBoyutuMB: [null],
          MinDosyaAdedi: [null],
          MaxDosyaAdedi: [null]
        });
        break;

      case '2020008': // SoruRevizyonDavranis
        this.formGroup = this.fb.group({
          ...baseControls,
          DavranisTipKodDto: [null, Validators.required],
          BilgilendirmeMesaji: ['']
        });
        break;

      default:
        console.warn('Bilinmeyen Kural Tip:', kuralTipKod);
        this.formGroup = this.fb.group(baseControls);
    }

    // Form değişikliklerini dinle ve JSON oluştur
    this.formGroup.valueChanges.subscribe(() => {
      this.emitJson();
      this.validChange.emit(this.formGroup.valid);
    });

    // Edit mode: JSON'dan form'u doldur
    if (this.initialJson) {
      this.loadInitialJson(this.initialJson);
    }

    // İlk validation state'i emit et
    this.validChange.emit(this.formGroup.valid);
  }

  /**
   * Form verilerinden JSON oluştur ve emit et
   */
  private emitJson(): void {
    const formValue = this.formGroup.value;
    const json = JSON.stringify(formValue);
    this.jsonChange.emit(json);
  }

  /**
   * Edit mode için JSON'dan form'u doldur
   */
  private loadInitialJson(json: string): void {
    try {
      const data = JSON.parse(json);
      this.formGroup.patchValue(data);
    } catch (error) {
      console.error('JSON parse hatası:', error);
    }
  }
}
