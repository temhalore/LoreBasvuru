import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { KosulSatirCase, KuralCaseModel, KuralEditorConfigModel, KuralKosulV2Model, KuralV2JsonModel, ReqKuralV2Model, ResKuralV2Model } from 'app/base/models/form/kuralV2';
import { EidModel } from 'app/base/models/general/eid.model';
import { KodModel } from 'app/base/models/common/kod.model';
import { KuralV2Service } from '../../kuralv2.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { CodeSelectInputComponent } from 'app/shared/components/form-controls/code-select-input/code-select-input.component';
import { ApiSelectInputComponent } from 'app/shared/components/form-controls/api-select-input/api-select-input.component';
import { DatepickerInputComponent } from 'app/shared/components/form-controls/datepicker-input/datepicker-input.component';
import {
  DEGER_TIPI_KOD_ID,
  DOSYA_UZANTI_TIPI_KOD_ID,
  JOIN_KOD_ID,
  KOSUL_TIPI_KOD_ID,
  KURAL_TIPI_KOD_ID,
  KURAL_TIPI_SAYFA,
  KURAL_TIPI_SORU,
  KURAL_TIPI_VALIDASYON,
  OPERATOR_KOD_ID,
  hesaplaKosulSatirCase,
} from 'app/modules/form/shared/rule-v2/kural-v2-editor.utils';

export interface KuralV2FormDialogData {
  kuralModel?: ResKuralV2Model;
  isEditMode: boolean;
}

@Component({
  selector: 'app-kuralv2-modal-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    CodeSelectInputComponent,
    ApiSelectInputComponent,
    DatepickerInputComponent,
  ],
  templateUrl: './modal-form.component.html',
  styleUrls: ['./modal-form.component.scss'],
  providers: [KuralV2Service, SweetAlertService],
})
/**
 * @deprecated Kullanımdan kaldırılacak. Kural editörü artık form-editor içindeki
 * `question-validation-editor-outlet` bileşeni üzerinden yürüyor. Yeni geliştirme
 * buraya değil o bileşene yapılmalı; ortak soyutlama bilinçli olarak çıkarılmadı.
 */
export class KuralV2ModalFormComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  isEditMode = false;
  modalTitle = 'Kural Ekle (V2)';

  readonly KURAL_TIPI_KOD_ID = KURAL_TIPI_KOD_ID;
  readonly KOSUL_TIPI_KOD_ID = KOSUL_TIPI_KOD_ID;
  readonly OPERATOR_KOD_ID = OPERATOR_KOD_ID;
  readonly JOIN_KOD_ID = JOIN_KOD_ID;
  readonly DEGER_TIPI_KOD_ID = DEGER_TIPI_KOD_ID;
  readonly DOSYA_UZANTI_TIPI_KOD_ID = DOSYA_UZANTI_TIPI_KOD_ID;

  formKokEid = '';
  kuralCase: KuralCaseModel = new KuralCaseModel();

  soruApiParam: { eid: string } | null = null;
  sayfaApiParam: { eid: string } | null = null;
  secenekApiParam: ({ eid: string } | null)[] = [];
  validasyonSecenekApiParam: { eid: string } | null = null;

  private isFillingEditForm = false;
  private readonly subscriptions: Subscription[] = [];
  private editorConfig: KuralEditorConfigModel | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly kuralV2Service: KuralV2Service,
    public readonly dialogRef: MatDialogRef<KuralV2ModalFormComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: KuralV2FormDialogData,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.isEditMode = data?.isEditMode ?? false;
    this.modalTitle = this.isEditMode ? 'Kural Duzenle (V2)' : 'Kural Ekle (V2)';

    this.formGroup = this.fb.group({
      eid: [''],
      formKokEIdDto: [null, Validators.required],
      formSoruKokEIdDto: [null],
      kuralTipKodDto: [null, Validators.required],
      hataMesaji: [''],
      isZorunlu: [false],
      hedefSayfaEIdDto: [null],
      hedefSoruKokEIdDto: [null],
      sira: [0, [Validators.required, Validators.min(0)]],
      isAktif: [true],
      kosullar: this.fb.array([]),
    });
  }

  get kosullarArray(): FormArray {
    return this.formGroup.get('kosullar') as FormArray;
  }

  kosulAsFormGroup(i: number): FormGroup {
    return this.kosullarArray.at(i) as FormGroup;
  }

  secenekApiParamForKosul(index: number): { eid: string } | null {
    const kuralTipId = this.formGroup.get('kuralTipKodDto')?.value?.id ?? 0;
    if (kuralTipId === KURAL_TIPI_VALIDASYON) {
      return this.validasyonSecenekApiParam;
    }

    return this.secenekApiParam[index] ?? null;
  }

  ngOnInit(): void {
    const editorConfigSub = this.kuralV2Service.GetKuralEditorConfig().subscribe((config) => {
      this.editorConfig = config;
      this.kuralCase = this.hesaplaKuralCase(
        this.formGroup.get('formKokEIdDto')?.value,
        this.formGroup.get('kuralTipKodDto')?.value,
      );
      this.cdr.markForCheck();
    });
    this.subscriptions.push(editorConfigSub);

    this.formGroup.get('formKokEIdDto')?.valueChanges.subscribe((value: any) => {
      const eid = value?.eid ?? '';
      this.formKokEid = eid;
      this.soruApiParam = eid ? { eid } : null;
      this.sayfaApiParam = eid ? { eid } : null;
      if (!this.isFillingEditForm) {
        this.formGroup.get('formSoruKokEIdDto')?.setValue(null, { emitEvent: false });
        this.formGroup.get('hedefSayfaEIdDto')?.setValue(null, { emitEvent: false });
        this.formGroup.get('hedefSoruKokEIdDto')?.setValue(null, { emitEvent: false });
      }
      this.kuralCase = this.hesaplaKuralCase(
        value,
        this.formGroup.get('kuralTipKodDto')?.value,
      );
      this.uygulaCaseValidators();
      this.cdr.markForCheck();
    });

    this.formGroup.get('kuralTipKodDto')?.valueChanges.subscribe((value: KodModel | null) => {
      this.kuralCase = this.hesaplaKuralCase(
        this.formGroup.get('formKokEIdDto')?.value,
        value,
      );
      this.uygulaCaseValidators();
      if (!this.isFillingEditForm) {
        this.temizleGizlenenAlanlar();
      }
      this.cdr.markForCheck();
    });

    this.formGroup.get('formSoruKokEIdDto')?.valueChanges.subscribe((value: any) => {
      const soruEid = value?.eid ?? '';
      this.validasyonSecenekApiParam = soruEid ? { eid: soruEid } : null;
      this.kosullarArray.controls.forEach((ctrl) => {
        ctrl.get('secenekEIdDto')?.setValue(null, { emitEvent: false });
      });
      this.kuralCase = this.hesaplaKuralCase(
        this.formGroup.get('formKokEIdDto')?.value,
        this.formGroup.get('kuralTipKodDto')?.value,
      );
      this.cdr.markForCheck();
    });

    if (this.isEditMode && this.data?.kuralModel) {
      this.fillFormForEdit(this.data.kuralModel);
    }
  }

  private hesaplaKuralCase(
    formKokEIdDto: EidModel | null,
    kuralTipKodDto: KodModel | null,
  ): KuralCaseModel {
    const c = new KuralCaseModel();
    const tipId = this.getKodId(kuralTipKodDto);

    switch (tipId) {
      case KURAL_TIPI_VALIDASYON:
        c.showSoruSecimi = true;
        c.soruZorunlu = true;
        c.showKosullar = true;
        c.showKosulKaynakSoru = false;
        c.validasyonSoruTipKID = this.formGroup.get('formSoruKokEIdDto')?.value?.soruTipKID ?? 0;
        break;

      case KURAL_TIPI_SAYFA:
        c.showSayfaSecimi = true;
        c.showKosullar = true;
        c.showKosulKaynakSoru = true;
        break;

      case KURAL_TIPI_SORU:
        c.showHedefSoruSecimi = true;
        c.showKosullar = true;
        c.showKosulKaynakSoru = true;
        break;
    }

    c.kosulCases = this.kosullarArray.controls.map((ctrl) => {
      const kosulTipId = this.getKodId(ctrl.get('kosulTipKodDto')?.value);
      const operatorId = this.getKodId(ctrl.get('operatorKodDto')?.value);
      const degerTipiId = this.getKodId(ctrl.get('degerTipiKodDto')?.value);
      const satirSoruTipKID = tipId === KURAL_TIPI_VALIDASYON
        ? c.validasyonSoruTipKID
        : (ctrl.get('soruKokEIdDto')?.value?.soruTipKID ?? 0);
      const satirCase = this.hesaplaKosulSatirCase(kosulTipId, operatorId, degerTipiId, satirSoruTipKID);
      if (this.editorConfig && satirSoruTipKID > 0) {
        this.applyKosulCaseToForm(ctrl as FormGroup, satirCase);
      }
      return satirCase;
    });

    return c;
  }

  private hesaplaKosulSatirCase(
    kosulTipId: number,
    operatorId: number,
    degerTipiId: number,
    soruTipKID: number = 0,
  ): KosulSatirCase {
    return hesaplaKosulSatirCase(kosulTipId, operatorId, degerTipiId, soruTipKID, this.editorConfig);
  }

  private applyKosulCaseToForm(group: FormGroup, satirCase: KosulSatirCase): void {
    if (satirCase.degerTipiMode === 'fixed' && satirCase.fixedDegerTipiId) {
      const currentId = this.getKodId(group.get('degerTipiKodDto')?.value);
      if (currentId !== satirCase.fixedDegerTipiId) {
        const degerTipi = new KodModel();
        degerTipi.id = satirCase.fixedDegerTipiId;
        group.get('degerTipiKodDto')?.setValue(degerTipi, { emitEvent: false });
      }
    }

    if (satirCase.degerTipiMode === 'hidden') {
      group.get('degerTipiKodDto')?.setValue(null, { emitEvent: false });
    }

    if (satirCase.degerTipiMode === 'selectable') {
      const degerTipiId = this.getKodId(group.get('degerTipiKodDto')?.value);
      if (degerTipiId && !satirCase.izinVerilenDegerTipiIdleri.includes(degerTipiId)) {
        group.get('degerTipiKodDto')?.setValue(null, { emitEvent: true });
      }
    }

    if (!satirCase.showOperator) {
      group.get('operatorKodDto')?.setValue(null, { emitEvent: false });
    } else {
      const operatorId = this.getKodId(group.get('operatorKodDto')?.value);
      if (operatorId && !satirCase.izinVerilenOperatorIdleri.includes(operatorId)) {
        group.get('operatorKodDto')?.setValue(null, { emitEvent: true });
      }
    }

    if (!satirCase.showDeger) {
      group.get('deger')?.setValue('', { emitEvent: false });
    }

    if (!satirCase.showDeger2) {
      group.get('deger2')?.setValue('', { emitEvent: false });
    }

    if (!satirCase.showSecenek) {
      group.get('secenekEIdDto')?.setValue(null, { emitEvent: false });
    }

    if (!satirCase.showDosyaKisitAlanlari) {
      group.get('maxDosyaBoyutuMB')?.setValue(null, { emitEvent: false });
      group.get('minDosyaSayisi')?.setValue(null, { emitEvent: false });
      group.get('maxDosyaSayisi')?.setValue(null, { emitEvent: false });
      group.get('izinVerilenDosyaTipleri')?.setValue(null, { emitEvent: false });
    }
  }

  private subscribeKosulChanges(group: FormGroup, index: number): void {
    const yenileCase = () => {
      this.kuralCase = this.hesaplaKuralCase(
        this.formGroup.get('formKokEIdDto')?.value,
        this.formGroup.get('kuralTipKodDto')?.value,
      );
      this.cdr.markForCheck();
    };
    const sb1 = group.get('kosulTipKodDto')?.valueChanges.subscribe(yenileCase);
    const sb2 = group.get('operatorKodDto')?.valueChanges.subscribe(yenileCase);
    const sb3 = group.get('degerTipiKodDto')?.valueChanges.subscribe(yenileCase);
    const sb4 = group.get('soruKokEIdDto')?.valueChanges.subscribe((value: any) => {
      const soruEid = value?.eid ?? null;
      this.secenekApiParam[index] = soruEid ? { eid: soruEid } : null;
      group.get('secenekEIdDto')?.setValue(null, { emitEvent: false });
      yenileCase();
    });
    if (sb1) this.subscriptions.push(sb1);
    if (sb2) this.subscriptions.push(sb2);
    if (sb3) this.subscriptions.push(sb3);
    if (sb4) this.subscriptions.push(sb4);
  }

  private uygulaCaseValidators(): void {
    const soruCtrl = this.formGroup.get('formSoruKokEIdDto');
    if (this.kuralCase.soruZorunlu) {
      soruCtrl?.setValidators(Validators.required);
    } else {
      soruCtrl?.clearValidators();
    }
    soruCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  private temizleGizlenenAlanlar(): void {
    if (!this.kuralCase.showSoruSecimi) {
      this.formGroup.get('formSoruKokEIdDto')?.setValue(null, { emitEvent: false });
    }
    if (!this.kuralCase.showSayfaSecimi) {
      this.formGroup.get('hedefSayfaEIdDto')?.setValue(null, { emitEvent: false });
    }
    if (!this.kuralCase.showHedefSoruSecimi) {
      this.formGroup.get('hedefSoruKokEIdDto')?.setValue(null, { emitEvent: false });
    }
  }

  private fillFormForEdit(model: ResKuralV2Model): void {
    this.isFillingEditForm = true;

    const eid = model.formKokEIdDto?.eid ?? '';
    this.formKokEid = eid;
    this.soruApiParam = eid ? { eid } : null;
    this.sayfaApiParam = eid ? { eid } : null;
    const soruKokEid = model.formSoruKokEIdDto?.eid ?? '';
    this.validasyonSecenekApiParam = soruKokEid ? { eid: soruKokEid } : null;

    this.kuralCase = this.hesaplaKuralCase(model.formKokEIdDto, model.kuralTipKodDto);
    this.uygulaCaseValidators();

    this.formGroup.patchValue({
      eid: model.eid,
      formKokEIdDto: model.formKokEIdDto,
      formSoruKokEIdDto: model.formSoruKokEIdDto,
      kuralTipKodDto: model.kuralTipKodDto,
      hataMesaji: model.kuralDetay?.hataMesaji ?? '',
      isZorunlu: model.kuralDetay?.isZorunlu ?? false,
      hedefSayfaEIdDto: model.kuralDetay?.hedefSayfaEIdDto ?? null,
      hedefSoruKokEIdDto: model.kuralDetay?.hedefSoruKokEIdDto ?? null,
      sira: model.sira,
      isAktif: model.isAktif,
    });

    const kosullar = model.kuralDetay?.kosullar ?? [];
    kosullar.forEach((k, idx) => {
      const group = this.buildKosulGroup(k);
      this.kosullarArray.push(group);
      const soruEid = k.soruKokEIdDto?.eid ?? null;
      this.secenekApiParam.push(soruEid ? { eid: soruEid } : null);
      this.subscribeKosulChanges(group, idx);
    });
    this.kuralCase = this.hesaplaKuralCase(model.formKokEIdDto, model.kuralTipKodDto);

    this.isFillingEditForm = false;
    this.cdr.markForCheck();
  }

  kosulEkle(): void {
    const newIndex = this.kosullarArray.length;
    const group = this.buildKosulGroup(new KuralKosulV2Model());
    this.kosullarArray.push(group);
    this.secenekApiParam.push(null);
    this.subscribeKosulChanges(group, newIndex);
    this.kuralCase = this.hesaplaKuralCase(
      this.formGroup.get('formKokEIdDto')?.value,
      this.formGroup.get('kuralTipKodDto')?.value,
    );
    this.cdr.markForCheck();
  }

  kosulKaldir(index: number): void {
    this.kosullarArray.removeAt(index);
    this.secenekApiParam.splice(index, 1);
    this.kuralCase = this.hesaplaKuralCase(
      this.formGroup.get('formKokEIdDto')?.value,
      this.formGroup.get('kuralTipKodDto')?.value,
    );
    this.cdr.markForCheck();
  }

  private buildKosulGroup(kosul: KuralKosulV2Model): FormGroup {
    return this.fb.group({
      kosulTipKodDto: [kosul.kosulTipKodDto],
      soruKokEIdDto: [kosul.soruKokEIdDto],
      secenekEIdDto: [kosul.secenekEIdDto],
      matrisSatirEIdDto: [kosul.matrisSatirEIdDto],
      matrisSutunEIdDto: [kosul.matrisSutunEIdDto],
      operatorKodDto: [kosul.operatorKodDto],
      degerTipiKodDto: [kosul.degerTipiKodDto],
      deger: [kosul.deger],
      deger2: [kosul.deger2],
      joinKodDto: [kosul.joinKodDto],
      maxDosyaBoyutuMB: [kosul.maxDosyaBoyutuMB],
      minDosyaSayisi: [kosul.minDosyaSayisi],
      maxDosyaSayisi: [kosul.maxDosyaSayisi],
      izinVerilenDosyaTipleri: [kosul.izinVerilenDosyaTipleri ?? null],
      hataMesaji: [kosul.hataMesaji ?? ''],
    });
  }

  Save(): void {
    if (this.formGroup.invalid) return;

    this.kuralCase = this.hesaplaKuralCase(
      this.formGroup.get('formKokEIdDto')?.value,
      this.formGroup.get('kuralTipKodDto')?.value,
    );

    const fv = this.formGroup.value;

    const kuralDetay = new KuralV2JsonModel();
    kuralDetay.hataMesaji = fv.hataMesaji ?? '';
    kuralDetay.isZorunlu = fv.isZorunlu ?? false;
    kuralDetay.hedefSayfaEIdDto = fv.hedefSayfaEIdDto ?? null;
    kuralDetay.hedefSoruKokEIdDto = fv.hedefSoruKokEIdDto ?? null;
    kuralDetay.kosullar = (fv.kosullar as KuralKosulV2Model[]) ?? [];

    if (fv.kuralTipKodDto?.id === KURAL_TIPI_VALIDASYON) {
      kuralDetay.kosullar = kuralDetay.kosullar.map((k) => ({
        ...k,
        soruKokEIdDto: (fv.formSoruKokEIdDto as EidModel) ?? null,
      }));
    }

    const req = new ReqKuralV2Model();
    req.eid = fv.eid;
    req.formKokEIdDto = fv.formKokEIdDto as EidModel;
    req.formSoruKokEIdDto = (fv.formSoruKokEIdDto as EidModel) ?? null;
    req.kuralTipKodDto = fv.kuralTipKodDto as KodModel;
    req.kuralDetay = kuralDetay;
    req.sira = fv.sira;
    req.isAktif = fv.isAktif;

    const operation$ = this.isEditMode
      ? this.kuralV2Service.Set(req)
      : this.kuralV2Service.Add(req);

    const sb = operation$.subscribe({
      next: (result) => {
        if (result) {
          this.dialogRef.close('success');
        }
      },
    });
    this.subscriptions.push(sb);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sb) => sb.unsubscribe());
  }

  private getKodId(value: any): number {
    const id = Number(value?.id ?? 0);
    return Number.isFinite(id) ? id : 0;
  }
}
