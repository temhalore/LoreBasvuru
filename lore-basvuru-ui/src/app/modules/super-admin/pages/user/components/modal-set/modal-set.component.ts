/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { PageModel } from 'app/base/models/security/page/page.model';
import { PageService } from '../../../page/page.service';
import { FormValidationService } from 'app/base/services/form-validation.service';

export interface UserSetDialogData {
  pageDto: PageModel;
}

@Component({
  selector: 'app-superadmin-user-modalset',
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
    MatIconModule,
  ],
  providers: [FormBuilder, PageService, FormValidationService],
})
export class ModalSetComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  formGroup: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalSetComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserSetDialogData,
    public formValidationService: FormValidationService,
    public pageService: PageService
  ) {
  }

  ngOnInit(): void {
    this.InitForm();
  }
  InitForm() {

    this.formGroup = this.fb.group({
      name: ["", [Validators.required]],
      routerLink: ["", [Validators.required]],
      orderNo: ["", [Validators.required]],
      geBagliRedAciklama: ["", [Validators.required]],


    });
    setTimeout(() => {
      this.LoadForm();
    }, 0);
  }
  LoadForm() {
    this.formGroup.controls['name'].patchValue(this.data.pageDto.name, { onlySelf: false });
    this.formGroup.controls['routerLink'].patchValue(this.data.pageDto.routerLink, { onlySelf: false });
    this.formGroup.controls['orderNo'].patchValue(this.data.pageDto.orderNo, { onlySelf: false });

  }
  PrepareForm() {
    this.data.pageDto.name = this.formGroup.controls['name'].value;
    this.data.pageDto.routerLink = this.formGroup.controls['routerLink'].value;
    this.data.pageDto.orderNo = this.formGroup.controls['orderNo'].value;
  }
  Set() {

    this.PrepareForm();
    const sbSet = this.pageService.Set(this.data.pageDto)
      .subscribe((res: string) => {
        if (res === 'success') {
          this.dialogRef.close(res);
        }

      });
    this.subscriptions.push(sbSet);
  }
  // const errorList = this.formValidationService.getFormValidationErrors(this.formGroup.controls);
  // if (this.showForm) {
  //   errorList.forEach(element => {
  //     if (element.control_name !== "istegeBagli" && element.control_name !== "istegeBagliRed" && element.control_name !== "istegeBagliRedAciklama") {
  //       errorList2.push(element);
  //     }

  //   });
  // }


  ngOnDestroy(): void {
    this.subscriptions.forEach(sb => sb.unsubscribe());
  }

}
