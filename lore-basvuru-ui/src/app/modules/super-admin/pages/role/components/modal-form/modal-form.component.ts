import { Component, Inject, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { RoleModel } from 'app/base/models/security/role/role.model';
import { RoleService } from '../../role.service';
import { TextInputComponent } from 'app/shared/components/form-controls';
import { ActionButtonComponent } from 'app/shared/components/action-button/action-button.component';

export interface RoleFormDialogData {
  roleModel?: RoleModel; // Düzenlenecek role verisi
  isEditMode: boolean; // Add/Edit mode kontrolü
  modalSize?: string; // Modal boyutu parametresi
}

@Component({
  selector: 'app-super-admin-role-modal-form',
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
  providers: [FormBuilder, RoleService, SweetAlertService],
})
export class ModalFormComponent implements OnInit, AfterViewInit, OnDestroy {
  formGroup: FormGroup;
  roleDto$: BehaviorSubject<RoleModel> = new BehaviorSubject<RoleModel>(new RoleModel());
  modalSize: string = 'w-full'; // Modal size parametresi
  isEditMode: boolean = false; // Add/Edit mode kontrolü
  modalTitle: string = 'Rol Ekle'; // Dinamik modal başlığı

  private subscriptions: Subscription[] = [];
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RoleFormDialogData,
    public roleService: RoleService,
    private sweetAlertService: SweetAlertService,
  ) {
    this.isEditMode = data.isEditMode || false;
    
    // Modal başlığını mode'a göre ayarla
    this.modalTitle = this.isEditMode ? 'Rol Düzenle' : 'Rol Ekle';
    // Edit mode'da gelen role verisini set et
    if (this.isEditMode && data.roleModel) {
      this.roleDto$.next(data.roleModel);
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
      const role = this.roleDto$.getValue();
      this.formGroup.patchValue({
        name: role.name
      });
    }
  }
  
  InitForm() {
    this.formGroup = this.fb.group({
      name: [null, [Validators.required]],
    });
  }
  
  ngAfterViewInit(): void {
    // View after init logic if needed
  }

  PrepareForm() {
    const currentRole = this.roleDto$.getValue();
    currentRole.name = this.formGroup.get('name')?.value;
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
      const sbEdit = this.roleService.Set(this.roleDto$.getValue())
        .subscribe((res: string) => {
          if (res === 'success') {
            this.sweetAlertService.showMessage('success', 'Rol başarıyla güncellendi!');
            this.dialogRef.close("success");
          } else {
            this.sweetAlertService.showMessage('error', 'Rol güncelleme işlemi başarısız');
          }
        });
      this.subscriptions.push(sbEdit);
    } else {
      // Add işlemi
      const sbAdd = this.roleService.Add(this.roleDto$.getValue())
        .subscribe((res: string) => {
          if (res === 'success') {
            this.sweetAlertService.showMessage('success', 'Rol başarıyla eklendi!');
            this.dialogRef.close("success");
          } else {
            this.sweetAlertService.showMessage('error', 'Rol ekleme işlemi başarısız');
          }
        });
      this.subscriptions.push(sbAdd);
    }
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sb => sb.unsubscribe());
  }
}
