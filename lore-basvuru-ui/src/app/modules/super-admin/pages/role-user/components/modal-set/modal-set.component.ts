/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, map, of, Subscription } from 'rxjs';
import { FormValidationService } from 'app/base/services/form-validation.service';
import { UserService } from '../../../user/user.service';
import { RoleUserService } from '../../role-user.service';
import { RoleModel } from 'app/base/models/security/role/role.model';
import { KisiModel } from 'app/base/models/security/user/kisi.model';
import { RoleUserModel } from 'app/base/models/security/role-user/role-user.model';

export interface RoleUserSetDialogData {
  roleUserDto: RoleUserModel;
}

@Component({
  selector: 'app-role-user-modalset',
  templateUrl: './modal-set.component.html',
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
    MatIconModule,
  ],
  providers: [FormBuilder, RoleUserService, UserService, FormValidationService],
})
export class ModalSetComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  userListDto$: BehaviorSubject<KisiModel[]> = new BehaviorSubject<KisiModel[]>([]);
  selectedUser: KisiModel = new KisiModel();
  
  private subscriptions: Subscription[] = [];
  
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalSetComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RoleUserSetDialogData,
    public formValidationService: FormValidationService,
    public roleUserService: RoleUserService,
    public userService: UserService,
  ) {
  }

  ngOnInit(): void {
    this.GetUserList();
    this.InitForm();
  }

  InitForm() {
    this.formGroup = this.fb.group({
      userListDto: [null, [Validators.required]],
    });
    setTimeout(() => {
      this.LoadForm();
    }, 0);
  }

  LoadForm() {
    if (this.data.roleUserDto && this.data.roleUserDto.userDto) {
      this.formGroup.patchValue({
        userListDto: this.data.roleUserDto.userDto
      });
      this.selectedUser = this.data.roleUserDto.userDto;
    }
  }

  GetUserList() {
    const sbUserList = this.userService.GetUserList().pipe(
      map((users: KisiModel[]) => users.map(user => ({
        ...user,
        nameSurname: `${user.name} ${user.lastName}`
      }))),
    ).subscribe((res) => {
      this.userListDto$.next(res);
    });
    this.subscriptions.push(sbUserList);
  }

  selectedUserId(userDto: KisiModel) {
    this.selectedUser = userDto;
  }

  PrepareForm() {
    this.data.roleUserDto.userDto = this.selectedUser;
  }

  Set() {
    this.PrepareForm();
    const sbSet = this.roleUserService.Add(this.data.roleUserDto)
      .subscribe((res: string) => {
        if (res === 'success') {
          this.dialogRef.close(res);
        }
      });
    this.subscriptions.push(sbSet);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sb => sb.unsubscribe());
  }
}
