import { Component, Inject, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MenuService } from '../../menu.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { TextInputComponent } from 'app/shared/components/form-controls';
import { ApiSelectInputComponent } from 'app/shared/components/form-controls/api-select-input/api-select-input.component';
import { ActionButtonComponent } from 'app/shared/components/action-button/action-button.component';
import { MenuModel } from 'app/base/models/security/menu/menu.model';

export interface MenuFormDialogData {
  menu?: MenuModel | null;
  isEditMode: boolean;
  dialogTitle?: string;
  modalSize?: string;
}

@Component({
  selector: 'app-super-admin-menu-modal-form',
  templateUrl: './modal-form.component.html',
  styleUrls: ['./modal-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    TextInputComponent,
    ApiSelectInputComponent,
    ActionButtonComponent
  ],
  providers: [FormBuilder, MenuService, SweetAlertService]
})
export class ModalFormComponent implements OnInit, AfterViewInit, OnDestroy {
  formGroup!: FormGroup;
  menuDto$: BehaviorSubject<MenuModel> = new BehaviorSubject<MenuModel>(new MenuModel());
  modalSize: string = 'w-full';
  isEditMode: boolean = false;
  modalTitle: string = 'Menü Ekle';

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MenuFormDialogData,
    public menuService: MenuService,
    private sweetAlertService: SweetAlertService
  ) {
    // Data'dan değerleri al
    this.isEditMode = this.data?.isEditMode || false;
    this.modalTitle = this.data?.dialogTitle || (this.isEditMode ? 'Menü Düzenle' : 'Yeni Menü Ekle');
    
    if (this.data?.modalSize) {
      this.modalSize = this.data.modalSize;
    }

    // Form oluştur
    this.InitForm();
    
    // Edit mode'da menu verilerini set et
    if (this.isEditMode && this.data?.menu) {
      this.menuDto$.next(this.data.menu);
    }
  }

  ngOnInit(): void {
    // Edit mode'da form değerlerini doldur
    if (this.isEditMode && this.data?.menu) {
      
      this.formGroup.patchValue({
        title: this.data.menu.title,
        icon: this.data.menu.icon,
        type: this.data.menu.type || 'basic',
        parentMenuDto: this.data.menu.parentMenuDto,
        pageDto: this.data.menu.pageDto,
        orderNo: this.data.menu.orderIndex,
        isActive: this.data.menu.isActive,
        tooltip: this.data.menu.tooltip,
        target: this.data.menu.target || '_self'
      });
      
      // API Select component'lerinin güncellenmesi için delay
      setTimeout(() => {
        this.formGroup.updateValueAndValidity();
      }, 100);
    }
  }

  ngAfterViewInit(): void {
    // AfterViewInit implementation
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sb) => sb.unsubscribe());
  }

  private InitForm(): void {
    this.formGroup = this.fb.group({
      title: [this.data?.menu?.title || '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      icon: [this.data?.menu?.icon || '', [Validators.maxLength(50)]],
      type: [this.data?.menu?.type || 'basic', [Validators.required]],
      parentMenuDto: [this.data?.menu?.parentMenuDto || null],
      pageDto: [this.data?.menu?.pageDto || null],
      orderNo: [this.data?.menu?.orderIndex || 1, [Validators.required, Validators.min(1), Validators.max(999)]],
      isActive: [this.data?.menu?.isActive ?? true],
      tooltip: [this.data?.menu?.tooltip || '', [Validators.maxLength(200)]],
      target: [this.data?.menu?.target || '_self']
    });
  }

  onSave(): void {
    if (this.formGroup.invalid) {
      // Mark all fields as touched to show validation errors
      this.formGroup.markAllAsTouched();
      return;
    }

    const formValue = this.formGroup.value;
    
    // MenuModel oluştur
    const menu = new MenuModel();
    menu.title = formValue.title;
    menu.icon = formValue.icon;
    menu.type = formValue.type;
    menu.parentMenuDto = formValue.parentMenuDto;
    menu.pageDto = formValue.pageDto;
    menu.orderIndex = formValue.orderNo;
    menu.isActive = formValue.isActive;
    menu.tooltip = formValue.tooltip;
    menu.target = formValue.target;
    
    // Page seçilmişse href'i page'den al
    if (formValue.pageDto) {
      menu.link = formValue.pageDto.routerLink;
    }

    // Edit mode'da eid ve id'leri koru
    if (this.isEditMode && this.data?.menu) {
      menu.eid = this.data.menu.eid;
      menu.id = this.data.menu.id;
    }

    const saveOperation = this.isEditMode 
      ? this.menuService.Set(menu)
      : this.menuService.Add(menu);

    const subscription = saveOperation.subscribe({
      next: (response) => {
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Menu save error:', error);
        // Error handling is done by SweetAlertService in the service
      }
    });

    this.subscriptions.push(subscription);
  }

  // Getter functions for template
  get title() { return this.formGroup.get('title'); }
  get icon() { return this.formGroup.get('icon'); }
  get type() { return this.formGroup.get('type'); }
  get parentMenuDto() { return this.formGroup.get('parentMenuDto'); }
  get pageDto() { return this.formGroup.get('pageDto'); }
  get orderNo() { return this.formGroup.get('orderNo'); }
  get isActive() { return this.formGroup.get('isActive'); }
  get tooltip() { return this.formGroup.get('tooltip'); }
  get target() { return this.formGroup.get('target'); }

  // Helper method for template
  getMenuTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      'basic': 'Temel Menü',
      'collapsable': 'Daraltılabilir Menü',
      'group': 'Menü Grubu',
      'divider': 'Ayırıcı',
      'spacer': 'Boşluk'
    };
    return typeLabels[type] || 'Temel Menü';
  }
}
