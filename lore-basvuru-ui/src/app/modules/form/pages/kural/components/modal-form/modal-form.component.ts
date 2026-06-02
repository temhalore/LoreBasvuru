import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from 'rxjs';
import { ReqKuralModel, ResKuralModel, BaseKuralModel, KuralTipMapperModel, ReqKuralTipMapperModel } from 'app/base/models/form/kural';
import { KuralService } from '../../kural.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { HttpService } from 'app/base/services/http.service';
import { KodModel } from 'app/base/models/common/kod.model';
import { EidModel } from 'app/base/models/general/eid.model';
import { CodeSelectInputComponent } from 'app/shared/components/form-controls/code-select-input/code-select-input.component';
import { ApiSelectInputComponent } from 'app/shared/components/form-controls/api-select-input/api-select-input.component';
import { DynamicKuralFormComponent } from '../dynamic-kural-form/dynamic-kural-form.component';

export interface KuralFormDialogData {
  kuralModel?: ResKuralModel;
  isEditMode: boolean;
}

interface FormDropdownItem {
  formKokId: number;
  baslik: string;
  formKokEIdDto : EidModel
}

interface SoruDropdownItem {
  soruKokEidDto: EidModel | null;
  soruMetni: string;
  formKokEidDto: EidModel | null;
  sayfaKokEidDto: EidModel | null;
  soruTipKodDto: KodModel | null;
}

interface SayfaDropdownItem {
  eid: string;
  sayfaBaslik: string;
  sayfaNo: number;
  formKokEidDto: EidModel | null;
  sira: number;
}

@Component({
  selector: 'app-kural-modal-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatInputModule,
    CodeSelectInputComponent,
    ApiSelectInputComponent,
    DynamicKuralFormComponent,
  ],
  templateUrl: './modal-form.component.html',
  styleUrls: ['./modal-form.component.scss'],
  providers: [KuralService, SweetAlertService],
})
export class ModalFormComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  isEditMode = false;
  modalTitle = 'Kural Ekle';

  // Kod TipId sabitleri
  readonly KURAL_MODEL_TIP_ID: number = 201;
  readonly KURAL_KURALTIP_TIP_ID: number = 202;
  
  // Form ve Soru Listeleri
  formList: FormDropdownItem[] = [];
  soruList: SoruDropdownItem[] = [];
  sayfaList: SayfaDropdownItem[] = [];

  // Seçili model
  selectedKuralModel: number = 0;
  selectedSayfa: EidModel | null = null;

  // Kural Tip Mapper (Backend'den gelen bilgiler)
  kuralTipMapper: KuralTipMapperModel | null = null;
  availableKuralTipleri: KodModel[] = [];
  showDynamicKuralForm: boolean = false;
  showYonlendirmeForm: boolean = false;

  // Kural Tip API binding için (api-select-input)
  kuralTipApiUrl: string = '';
  kuralTipApiParam: any = {};

  // Dinamik kural form için
  dynamicKuralFormJson: string = '';
  isDynamicKuralFormValid: boolean = false;

  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly fb: FormBuilder,
    public readonly kuralService: KuralService,
    private readonly httpService: HttpService,
    public readonly dialogRef: MatDialogRef<ModalFormComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: KuralFormDialogData,
  ) {
    this.isEditMode = data?.isEditMode ?? false;
    this.modalTitle = this.isEditMode ? 'Kural Düzenle' : 'Kural Ekle';
    
    this.formGroup = this.fb.group({
      eid: [''],
      KuralModelKodDto: [null, [Validators.required]],
      KuralTipKodDto: [null, [Validators.required]],
      FormKokEIdDto: [null],
      FormSoruKokEIdDto: [null],
      Sira: [0, [Validators.required, Validators.min(0)]],
      IsAktif: [true],
      KuralDetayJson: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadFormList();

    // Kural Model değiştiğinde form/soru alanlarını kontrol et VE mapper bilgilerini al
    this.formGroup.get('KuralModelKodDto')?.valueChanges.subscribe((value: KodModel | null) => {
      this.onKuralModelChange(value?.id ?? 0);
      this.loadKuralTipMapper(value);
    });

    // Form seçildiğinde soru ve sayfa listesini yükle
    this.formGroup.get('FormKokEIdDto')?.valueChanges.subscribe((formKokEid: any) => {
      if (formKokEid?.eid) {
        this.loadSoruListByFormEid(formKokEid.eid);
        this.loadSayfaListByFormEid(formKokEid.eid);
      } else {
        this.sayfaList = [];
      }
    });

    // Soru seçildiğinde kural tiplerini yükle (eğer soru seçimi zorunluysa)
    this.formGroup.get('FormSoruKokEIdDto')?.valueChanges.subscribe((soruEid: any) => {
      // Sadece mapper yüklendiyse ve soru seçimi zorunluysa işlem yap
      if (this.kuralTipMapper && this.kuralTipMapper.SoruSecimZorunlu && soruEid) {
        // Seçilen sorunun tipini bul
        const selectedSoru = this.soruList.find(s => s.soruKokEidDto?.eid === soruEid.eid);
        if (selectedSoru?.soruTipKodDto) {
          this.loadKuralTipleri(selectedSoru.soruTipKodDto);
        }
      }
    });

    if (this.isEditMode && this.data?.kuralModel) {
      this.formGroup.patchValue({
        eid: this.data.kuralModel.eid,
        KuralModelKodDto: this.data.kuralModel.KuralModelKodDto,
        KuralTipKodDto: this.data.kuralModel.KuralTipKodDto,
        FormKokEIdDto: this.data.kuralModel.FormKokEIdDto,
        FormSoruKokEIdDto: this.data.kuralModel.FormSoruKokEIdDto,
        Sira: this.data.kuralModel.Sira,
        IsAktif: this.data.kuralModel.IsAktif,
        KuralDetayJson: this.data.kuralModel.KuralDetayJson,
      });

      // Yönlendirme kuralı ise JSON'dan sayfa seçimini çıkar
      if (this.data.kuralModel.KuralModelKodDto?.id === 2010003) {
        try {
          const yonlendirmeJson = JSON.parse(this.data.kuralModel.KuralDetayJson);
          if (yonlendirmeJson.HedefSayfaEIdDto?.eid) {
            this.selectedSayfa = this.createEidModel(yonlendirmeJson.HedefSayfaEIdDto.eid);
          }
        } catch (error) {
          console.warn('Yönlendirme JSON parse hatası:', error);
        }
      }

      // Form seçiliyse soru ve sayfa listesini yükle
      if (this.data.kuralModel.FormKokEIdDto?.eid) {
        this.loadSoruListByFormEid(this.data.kuralModel.FormKokEIdDto.eid);
        this.loadSayfaListByFormEid(this.data.kuralModel.FormKokEIdDto.eid);
      }
    }
  }

  private loadFormList(): void {
    const sb = this.httpService.Post<FormDropdownItem[]>('FormBuild/Form/GetYayindaList', {}).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.formList = response.data ?? [];
        }
      },
    });
    this.subscriptions.push(sb);
  }

  private loadSoruListByFormEid(formKokEid: string): void {
    // Backend'de FormSoru endpoint'i varsa kullan
    const sb = this.httpService.Post<any[]>('FormBuild/Soru/GetSoruListByFormKokId', { eid: formKokEid }).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          // Backend FormSoruDto[] -> Frontend SoruDropdownItem[] mapping
          this.soruList = response.data.map((formSoruDto: any) => ({
            soruKokEidDto: formSoruDto.soruKokEidDto 
              ? this.createEidModel(formSoruDto.soruKokEidDto.eid) 
              : null,
            soruMetni: formSoruDto.soruMetni,
            formKokEidDto: formSoruDto.formKokEidDto 
              ? this.createEidModel(formSoruDto.formKokEidDto.eid) 
              : null,
            sayfaKokEidDto: formSoruDto.sayfaKokEidDto 
              ? this.createEidModel(formSoruDto.sayfaKokEidDto.eid) 
              : null,
            soruTipKodDto: formSoruDto.soruTipKodDto || null,
          } as SoruDropdownItem));
        } else {
          this.soruList = [];
        }
      },
      error: () => {
        // Endpoint yoksa boş liste
        this.soruList = [];
      },
    });
    this.subscriptions.push(sb);
  }

  private loadSayfaListByFormEid(formKokEid: string): void {
    const sb = this.httpService.Post<any[]>('FormBuild/Sayfa/GetSayfaListByFormKokId', { eid: formKokEid }).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          // Backend FormSayfaDto[] -> Frontend SayfaDropdownItem[] mapping
          this.sayfaList = response.data.map((formSayfaDto: any) => ({
            eid: formSayfaDto.eid,
            sayfaBaslik: formSayfaDto.sayfaBaslik,
            sayfaNo: formSayfaDto.sayfaNo,
            formKokEidDto: formSayfaDto.formKokEidDto 
              ? this.createEidModel(formSayfaDto.formKokEidDto.eid) 
              : null,
            sira: formSayfaDto.sira,
          } as SayfaDropdownItem));
        } else {
          this.sayfaList = [];
        }
      },
      error: () => {
        this.sayfaList = [];
      },
    });
    this.subscriptions.push(sb);
  }

  private onKuralModelChange(kuralModelKod: number): void {
    this.selectedKuralModel = kuralModelKod;

    // NOT: Form/Soru zorunluluğu artık loadKuralTipMapper'dan backend response'a göre ayarlanacak
    // Burada sadece geçici değerler temizleniyor
    if (kuralModelKod === 2010001) {
      this.formGroup.get('FormSoruKokEIdDto')?.setValue(null);
      this.selectedSayfa = null;
    }
    else if (kuralModelKod === 2010002) {
      this.selectedSayfa = null;
    }
  }

  /**
   * Kural Model seçimine göre backend'den mapper bilgilerini al
   * @param kuralModel Seçilen Kural Model
   */
  private loadKuralTipMapper(kuralModel: KodModel | null): void {
    if (!kuralModel) {
      this.kuralTipMapper = null;
      this.kuralTipApiUrl = '';
      this.kuralTipApiParam = {};
      this.showDynamicKuralForm = false;
      this.showYonlendirmeForm = false;
      
      // Validator'ları temizle
      this.formGroup.get('FormKokEIdDto')?.clearValidators();
      this.formGroup.get('FormSoruKokEIdDto')?.clearValidators();
      this.formGroup.get('FormKokEIdDto')?.updateValueAndValidity();
      this.formGroup.get('FormSoruKokEIdDto')?.updateValueAndValidity();
      return;
    }

    // Mapper bilgilerini al (validator ve form davranışları için)
    const request: ReqKuralTipMapperModel = {
      KuralModelKodDto: kuralModel,
      FormKokEidDto: this.formGroup.get('FormKokEIdDto')?.value,
      SoruTipKodDto: undefined
    };

    const sb = this.kuralService.GetKuralTipMapper(request).subscribe({
      next: (mapper: KuralTipMapperModel) => {
        this.kuralTipMapper = mapper;
        
        // Form/Soru zorunluluğunu backend'den gelen bilgiye göre ayarla
        if (mapper.FormSecimZorunlu) {
          this.formGroup.get('FormKokEIdDto')?.setValidators([Validators.required]);
        } else {
          this.formGroup.get('FormKokEIdDto')?.clearValidators();
        }
        
        if (mapper.SoruSecimZorunlu) {
          this.formGroup.get('FormSoruKokEIdDto')?.setValidators([Validators.required]);
        } else {
          this.formGroup.get('FormSoruKokEIdDto')?.clearValidators();
        }
        
        this.formGroup.get('FormKokEIdDto')?.updateValueAndValidity();
        this.formGroup.get('FormSoruKokEIdDto')?.updateValueAndValidity();
        
        // Yönlendirme mi değil mi kontrol et
        this.showYonlendirmeForm = mapper.IsYonlendirme;
        this.showDynamicKuralForm = !mapper.IsYonlendirme;
        
        // Kural tipleri yükleme: Eğer SORU seçimi zorunlu DEĞİLse direkt yükle
        if (!mapper.SoruSecimZorunlu) {
          this.loadKuralTipleri(undefined);
        } else {
          // Soru seçimi zorunlu, kural tip API'sini temizle (soru seçilene kadar bekle)
          this.kuralTipApiUrl = '';
          this.kuralTipApiParam = {};
        }
      },
      error: (error) => {
        console.error('Kural tip mapper yüklenirken hata:', error);
        this.kuralTipMapper = null;
        this.kuralTipApiUrl = '';
        this.kuralTipApiParam = {};
      }
    });
    
    this.subscriptions.push(sb);
  }

  /**
   * Kural tiplerini backend'den yükler (api-select-input için)
   * @param soruTipKodDto Soru tipi (opsiyonel)
   */
  private loadKuralTipleri(soruTipKodDto?: KodModel): void {
    if (!this.formGroup.get('KuralModelKodDto')?.value) {
      return;
    }

    // API URL ve parametresini set et (api-select-input otomatik yükleyecek)
    this.kuralTipApiUrl = 'Form/Kural/GetSecilebilirKuralTipleri';
    this.kuralTipApiParam = {
      KuralModelKodDto: this.formGroup.get('KuralModelKodDto')?.value,
      FormKokEidDto: this.formGroup.get('FormKokEIdDto')?.value,
      SoruTipKodDto: soruTipKodDto
    };
  }

  Save(): void {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    // Dinamik form validation (eğer gösteriliyorsa)
    if (this.showDynamicKuralForm && !this.isDynamicKuralFormValid) {
      alert('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    const formValue = this.formGroup.getRawValue();
    
    // JSON'u al (dinamik form'dan veya manuel textarea'dan)
    let kuralDetayJson = '';
    if (this.showDynamicKuralForm) {
      kuralDetayJson = this.dynamicKuralFormJson;
    } else if (this.showYonlendirmeForm) {
      // Yönlendirme kuralı için manuel JSON (FAZ 3'te YonlendirmeFormComponent eklenecek)
      kuralDetayJson = formValue.KuralDetayJson;
    } else {
      // Manuel JSON textarea (geçici)
      kuralDetayJson = formValue.KuralDetayJson;
    }
    
    // Yönlendirme kuralı ise ve sayfa seçildiyse JSON'a ekle
    if (this.selectedKuralModel === 2010003 && this.selectedSayfa) {
      try {
        // Mevcut JSON'u parse et
        const yonlendirmeKural = JSON.parse(kuralDetayJson);
        
        // HedefSayfaEIdDto property'sine seçilen sayfayı ekle
        yonlendirmeKural.HedefSayfaEIdDto = { eid: this.selectedSayfa.eid };
        
        // Tekrar JSON string'e çevir
        kuralDetayJson = JSON.stringify(yonlendirmeKural);
      } catch (error) {
        alert('Yönlendirme JSON formatı hatalı!');
        return;
      }
    }
    
    // JSON detayı validate et
    if (!kuralDetayJson || kuralDetayJson.trim() === '' || kuralDetayJson === '{}') {
      alert('Kural detay JSON boş olamaz');
      return;
    }
    
    try {
      JSON.parse(kuralDetayJson);
    } catch (error) {
      alert('JSON detay formatı hatalı! Lütfen geçerli bir JSON giriniz.');
      return;
    }

    // Backend ReqKuralDto formatında payload oluştur
    const payload: ReqKuralModel = {
      eid: formValue.eid || '',
      KuralModelKodDto: formValue.KuralModelKodDto,
      KuralTipKodDto: formValue.KuralTipKodDto,
      FormKokEIdDto: formValue.FormKokEIdDto,
      FormSoruKokEIdDto: formValue.FormSoruKokEIdDto,
      Sira: formValue.Sira,
      IsAktif: formValue.IsAktif,
      KuralDetayJson: kuralDetayJson,
    };

    const request$ = this.isEditMode ? this.kuralService.Set(payload) : this.kuralService.Add(payload);

    const sb = request$.subscribe((res: string) => {
      if (res === 'success') {
        this.dialogRef.close('success');
      }
    });

    this.subscriptions.push(sb);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sb) => sb.unsubscribe());
  }

  /**
   * Dinamik kural form'dan JSON değiştiğinde
   */
  onDynamicKuralFormJsonChange(json: string): void {
    this.dynamicKuralFormJson = json;
  }

  /**
   * Dinamik kural form validation değiştiğinde
   */
  onDynamicKuralFormValidChange(isValid: boolean): void {
    this.isDynamicKuralFormValid = isValid;
  }

  /**
   * EidModel instance oluşturur
   */
  createEidModel(eid: string): EidModel {
    const model = new EidModel();
    model.eid = eid;
    return model;
  }
}
