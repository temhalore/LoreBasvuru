import { Component, Inject, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { PageModel } from 'app/base/models/security/page/page.model';
import { PageService } from '../../page.service';
import { TextInputComponent } from 'app/shared/components/form-controls';
import { ActionButtonComponent } from 'app/shared/components/action-button/action-button.component';

export interface PageFormDialogData {
  pageModel?: PageModel | null; // Düzenlenecek sayfa modeli (null ise yeni ekleme)
  isEditMode?: boolean; // Edit modu mu add modu mu
  modalSize?: string; // Modal boyutu parametresi
}

@Component({
  selector: 'app-super-admin-page-modal-form',
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
    // MatButtonModule,
    // MatFormFieldModule,
    // MatInputModule,
  ],
  providers: [FormBuilder, PageService, SweetAlertService],
})
export class ModalFormComponent implements OnInit, AfterViewInit, OnDestroy {
  formGroup: FormGroup;
  pageDto$: BehaviorSubject<PageModel> = new BehaviorSubject<PageModel>(new PageModel());
  modalSize: string = 'w-full'; // Modal size parametresi
  isEditMode: boolean = false; // Edit modu kontrolü
  modalTitle: string = 'Yeni Sayfa Ekle'; // Modal başlığı

  private subscriptions: Subscription[] = [];
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PageFormDialogData,
    public pageService: PageService,
    private sweetAlertService: SweetAlertService,

  ) {
  }

  ngOnInit(): void {
    // Modal size parametresini data'dan al
    if (this.data.modalSize) {
      this.modalSize = this.data.modalSize;
    }

    // Edit mode kontrolü
    this.isEditMode = this.data.isEditMode || false;
    this.modalTitle = this.isEditMode ? 'Sayfa Düzenle' : 'Yeni Sayfa Ekle';

    // Eğer edit modundaysa, gelen veriyi form'a yükle
    if (this.isEditMode && this.data.pageModel) {
      this.pageDto$.next({ ...this.data.pageModel });
    }

    this.InitForm();
  }
  InitForm() {
    const currentPageDto = this.pageDto$.getValue();
    
    this.formGroup = this.fb.group({
      name: [currentPageDto.name || null, [Validators.required]],
      routerLink: [currentPageDto.routerLink || null, [Validators.required]],
    });
  }
  ngAfterViewInit(): void {
    // View after init logic if needed
  }



  PrepareForm() {
    this.pageDto$.getValue().name = this.formGroup.get('name')?.value;
    this.pageDto$.getValue().routerLink = this.formGroup.get('routerLink')?.value;
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
      // Update işlemi
      const sbUpdate = this.pageService.Set(this.pageDto$.getValue())
        .subscribe((res: string) => {
          if (res === 'success') {
            this.sweetAlertService.showMessage('success', 'Sayfa başarıyla güncellendi!');
            this.dialogRef.close("success");
          } else {
            this.sweetAlertService.showMessage('error', 'Sayfa güncelleme işlemi başarısız');
          }
        });
      this.subscriptions.push(sbUpdate);
    } else {
      // Add işlemi
      const sbAdd = this.pageService.Add(this.pageDto$.getValue())
        .subscribe((res: string) => {
          if (res === 'success') {
            this.sweetAlertService.showMessage('success', 'Sayfa başarıyla eklendi!');
            this.dialogRef.close("success");
          } else {
            this.sweetAlertService.showMessage('error', 'Sayfa ekleme işlemi başarısız');
          }
        });
      this.subscriptions.push(sbAdd);
    }
  }

  // Backward compatibility için Add metodu
  Add() {
    this.Save();
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(sb => sb.unsubscribe());
  }

}
