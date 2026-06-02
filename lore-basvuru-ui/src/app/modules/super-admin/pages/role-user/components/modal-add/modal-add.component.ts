import { RoleUserService } from './../../role-user.service';
import { Component, Inject, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BehaviorSubject, Subscription } from 'rxjs';
import { FormValidationService } from 'app/base/services/form-validation.service';
import { RoleModel } from 'app/base/models/security/role/role.model';
import { KisiModel } from 'app/base/models/security/user/kisi.model';
import { RoleUserModel } from 'app/base/models/security/role-user/role-user.model';
import { EtikKurulModel } from 'app/base/models/definition-operations/etik-kurul.model';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { ApiSelectInputComponent } from 'app/shared/components/form-controls/api-select-input/api-select-input.component';
import { ActionButtonComponent } from 'app/shared/components/action-button/action-button.component';

export interface RoleUserAddDialogData {
  roleDto?: RoleModel | null;
  modalSize?: string; // Modal boyutu parametresi
}

@Component({
  selector: 'app-super-admin-modaladd',
  templateUrl: './modal-add.component.html',
  styleUrls: ['./modal-add.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ApiSelectInputComponent,
    ActionButtonComponent,
  ],
  providers: [FormBuilder, RoleUserService, FormValidationService, SweetAlertService],
})
export class ModalAddComponent implements OnInit, AfterViewInit, OnDestroy {
  formGroup: FormGroup;
  userModel: KisiModel = new KisiModel();
  etikKurulModel: EtikKurulModel = new EtikKurulModel();
  userDto: KisiModel = new KisiModel();
  roleModel: RoleModel = new RoleModel();
  roleUserDto$: BehaviorSubject<RoleUserModel> = new BehaviorSubject<RoleUserModel>(new RoleUserModel);
  modalSize: string = 'w-full'; // Modal size parametresi

  private subscriptions: Subscription[] = [];
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalAddComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RoleUserAddDialogData,
    public formValidationService: FormValidationService,
    public roleUserService: RoleUserService,
    private sweetAlertService: SweetAlertService,

  ) {
  }

  ngOnInit(): void {
    this.InitForm();

    if (this.data?.roleDto) {
      this.roleModel = this.data.roleDto;
      this.formGroup.patchValue({ roleDto: this.data.roleDto });
    }

    // Modal size parametresini data'dan al
    if (this.data.modalSize) {
      this.modalSize = this.data.modalSize;
    }
  }

  ngAfterViewInit(): void {
    // View after init logic if needed
  }
  InitForm() {
    this.formGroup = this.fb.group({
      roleDto: [null, [Validators.required]],
      userListDto: [null, [Validators.required]],
      etikKurulDto: [null, [Validators.required]],

    });
  }

  selectedRole(roleDto: RoleModel) {
    this.roleModel = roleDto;
  }

  selectedUserId(userDto: KisiModel) {
    this.userModel = userDto;
  }

  selectedEtikKurul(etikKurul: EtikKurulModel) {
    this.etikKurulModel = etikKurul;
  }

  PrepareForm() {
    this.roleUserDto$.getValue().roleDto = this.roleModel;
    this.roleUserDto$.getValue().userDto = this.userModel;
    this.roleUserDto$.getValue().etikKurulDto = this.etikKurulModel;
  }

  Add() {
    // Form geçerli değilse işlemi durdur
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    // Form'u hazırla
    this.PrepareForm();

    const sbAdd = this.roleUserService.Add(this.roleUserDto$.getValue())
      .subscribe((res: string) => {
          //
          if (res === 'success') {
            this.sweetAlertService.showMessage('success', 'Kullanıcı başarıyla eklendi');
            this.dialogRef.close("success");
          } else {
            this.sweetAlertService.showMessage('error', 'Kullanıcı ekleme işlemi başarısız');
          }
        });
    this.subscriptions.push(sbAdd);
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(sb => sb.unsubscribe());
  }

}
