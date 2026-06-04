import { Component, Inject, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { PageModel } from 'app/base/models/security/page/page.model';
import { PageService } from '../../page.service';
import { TextInputComponent } from 'app/shared/components/form-controls';
import { ActionButtonComponent } from 'app/shared/components/action-button/action-button.component';

export interface PageFormDialogData {
  pageModel?: PageModel | null;
  isEditMode?: boolean;
  modalSize?: string;
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
  ],
  providers: [FormBuilder, PageService, SweetAlertService],
})
export class ModalFormComponent implements OnInit, AfterViewInit, OnDestroy {
  formGroup: FormGroup;
  pageDto$: BehaviorSubject<PageModel> = new BehaviorSubject<PageModel>(new PageModel());
  modalSize: string = 'w-full';
  isEditMode: boolean = false;
  modalTitle: string = 'Yeni Sayfa Ekle';

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PageFormDialogData,
    public pageService: PageService,
    private sweetAlertService: SweetAlertService,
  ) {}

  ngOnInit(): void {
    if (this.data.modalSize) {
      this.modalSize = this.data.modalSize;
    }
    this.isEditMode = this.data.isEditMode || false;
    this.modalTitle = this.isEditMode ? 'Sayfa Duzenle' : 'Yeni Sayfa Ekle';

    if (this.isEditMode && this.data.pageModel) {
      this.pageDto$.next(Object.assign(new PageModel(), this.data.pageModel));
    }
    this.InitForm();
  }

  InitForm() {
    const dto = this.pageDto$.getValue();
    this.formGroup = this.fb.group({
      name: [dto.name || null, [Validators.required]],
      routerLink: [dto.routerLink || null, [Validators.required]],
    });
  }

  ngAfterViewInit(): void {}

  PrepareForm() {
    this.pageDto$.getValue().name = this.formGroup.get('name')?.value;
    this.pageDto$.getValue().routerLink = this.formGroup.get('routerLink')?.value;
  }

  Save() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    this.PrepareForm();
    if (this.isEditMode) {
      const sb = this.pageService.Set(this.pageDto$.getValue()).subscribe((res: string) => {
        if (res === 'success') {
          this.sweetAlertService.showMessage('success', 'Sayfa basariyla guncellendi!');
          this.dialogRef.close('success');
        }
      });
      this.subscriptions.push(sb);
    } else {
      const sb = this.pageService.Add(this.pageDto$.getValue()).subscribe((res: string) => {
        if (res === 'success') {
          this.sweetAlertService.showMessage('success', 'Sayfa basariyla eklendi!');
          this.dialogRef.close('success');
        }
      });
      this.subscriptions.push(sb);
    }
  }

  Add() {
    this.Save();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sb => sb.unsubscribe());
  }
}
