import { Component, Inject, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { WidgetModel } from 'app/base/models/security/widget/widget.model';
import { PageModel } from 'app/base/models/security/page/page.model';
import { WidgetService } from '../../widget.service';
import { TextInputComponent } from 'app/shared/components/form-controls';
import { ActionButtonComponent } from 'app/shared/components/action-button/action-button.component';

export interface WidgetFormDialogData {
  pageDto?: PageModel;
  widgetModel?: WidgetModel; // Düzenlenecek widget verisi
  isEditMode: boolean; // Add/Edit mode kontrolü
  modalSize?: string; // Modal boyutu parametresi
}

@Component({
  selector: 'app-super-admin-widget-modal-form',
  templateUrl: './modal-form.component.html',
  styleUrls: ['./modal-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    TextInputComponent,
    ActionButtonComponent,
  ],
  providers: [FormBuilder, WidgetService, SweetAlertService],
})
export class ModalFormComponent implements OnInit, AfterViewInit, OnDestroy {
  formGroup: FormGroup;
  widgetDto$: BehaviorSubject<WidgetModel> = new BehaviorSubject<WidgetModel>(new WidgetModel());
  modalSize: string = 'w-full'; // Modal size parametresi
  pageDto?: PageModel;
  isEditMode: boolean = false; // Add/Edit mode kontrolü
  modalTitle: string = 'Widget Ekle'; // Dinamik modal başlığı

  private subscriptions: Subscription[] = [];
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WidgetFormDialogData,
    public widgetService: WidgetService,
    private sweetAlertService: SweetAlertService,
  ) {
    this.pageDto = data.pageDto;
    this.isEditMode = data.isEditMode || false;
    
    // Modal başlığını mode'a göre ayarla
    this.modalTitle = this.isEditMode ? 'Widget Düzenle' : 'Widget Ekle';
    
    // Edit mode'da gelen widget verisini set et
    if (this.isEditMode && data.widgetModel) {
      this.widgetDto$.next(data.widgetModel);
    }
  }

  ngOnInit(): void {
    this.InitForm();
    
    // Modal size parametresini data'dan al
    if (this.data && this.data.modalSize) {
      this.modalSize = this.data.modalSize;
    }
    
    // Edit mode'da form değerlerini doldur
    if (this.isEditMode) {
      const widget = this.widgetDto$.getValue();
      this.formGroup.patchValue({
        name: widget.name,
        selector: widget.selector
      });
    }
    
    // PageDto'yu widget model'e ata
    if (this.pageDto) {
      this.widgetDto$.getValue().pageDto = this.pageDto;
    }
  }
  
  InitForm() {
    this.formGroup = this.fb.group({
      name: [null, [Validators.required]],
      selector: [null, [Validators.required]],
    });
  }
  
  ngAfterViewInit(): void {
    // View after init logic if needed
  }

  PrepareForm() {
    const currentWidget = this.widgetDto$.getValue();
    currentWidget.name = this.formGroup.get('name')?.value;
    currentWidget.selector = this.formGroup.get('selector')?.value;
    
    // PageDto'yu ata (sadece Add mode'da)
    if (!this.isEditMode && this.pageDto) {
      currentWidget.pageDto = this.pageDto;
    }
  }

  Save() {
    // Form geçerli değilse işlemi durdur
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    // Form'u hazırla
    this.PrepareForm();

    if (this.isEditMode) {
      // Edit işlemi
      const sbEdit = this.widgetService.Set(this.widgetDto$.getValue())
        .subscribe((res: string) => {
          if (res === 'success') {
            this.sweetAlertService.showMessage('success', 'Widget başarıyla güncellendi!');
            this.dialogRef.close("success");
          } else {
            this.sweetAlertService.showMessage('error', 'Widget güncelleme işlemi başarısız');
          }
        });
      this.subscriptions.push(sbEdit);
    } else {
      // Add işlemi
      const sbAdd = this.widgetService.Add(this.widgetDto$.getValue())
        .subscribe((res: string) => {
          if (res === 'success') {
            this.sweetAlertService.showMessage('success', 'Widget başarıyla eklendi!');
            this.dialogRef.close("success");
          } else {
            this.sweetAlertService.showMessage('error', 'Widget ekleme işlemi başarısız');
          }
        });
      this.subscriptions.push(sbAdd);
    }
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sb => sb.unsubscribe());
  }
}
