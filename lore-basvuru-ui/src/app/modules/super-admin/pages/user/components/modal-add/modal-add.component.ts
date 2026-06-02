/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, of, Subscription } from 'rxjs';
import { PageService } from '../../../page/page.service';
import { FormValidationService } from 'app/base/services/form-validation.service';
import { PageModel } from 'app/base/models/security/page/page.model';

export interface UserAddDialogData {
  pageDto: PageModel;
}

@Component({
  selector: 'app-superadmin-user-modaladd',
  templateUrl: './modal-add.component.html',
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
export class ModalAddComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  pageDto$:BehaviorSubject<PageModel> = new BehaviorSubject<PageModel>(new PageModel);
  // sifre$: BehaviorSubject<string> = new BehaviorSubject<string>(null)
  private subscriptions: Subscription[] = [];
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalAddComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserAddDialogData,
    public formValidationService: FormValidationService,
    public pageService:PageService,
  ) {
  }

  ngOnInit(): void {
    this.InitForm()
  }
  InitForm() {

    this.formGroup = this.fb.group({
      name: ["", [Validators.required]],
      routerLink: ["", [Validators.required]],
    });
  }

  PrepareForm() {
    this.pageDto$.getValue().name = this.formGroup.controls['name'].value;
    this.pageDto$.getValue().routerLink = this.formGroup.controls['routerLink'].value;
    // this.pageDto.orderNo = this.formGroup.controls['orderNo'].value;
  }
  Add() {

    this.PrepareForm();
    const sbSet = this.pageService.Add(this.pageDto$.getValue())
      .subscribe((res:string) => {
        if(res==='success'){
          this.dialogRef.close(res);
        }

      });
    this.subscriptions.push(sbSet);
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(sb => sb.unsubscribe());
  }

}
