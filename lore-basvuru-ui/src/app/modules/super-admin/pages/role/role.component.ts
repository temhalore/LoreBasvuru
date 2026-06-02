import { Router } from '@angular/router';
/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
import { Component, OnInit, ViewEncapsulation, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Subscription } from 'rxjs';
import { RoleService } from './role.service';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RoleModel } from 'app/base/models/security/role/role.model';
import { AuthService } from 'app/base/services/auth.service';
import { DataTableComponent, DataTableConfig } from 'app/shared/components/data-table';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { ApiSelectInputComponent } from 'app/shared/components/form-controls/api-select-input/api-select-input.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ModalFormComponent, RoleFormDialogData } from './components/modal-form/modal-form.component';


@Component({
  selector: 'app-superadmin-role',
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DataTableComponent,
    MatDialogModule,
  ],
  providers: [RoleService, SweetAlertService]
})
export class RoleComponent implements OnInit, OnDestroy {
  @ViewChild(DataTableComponent) dataTableComponent!: DataTableComponent;
  
  private subscriptions: Subscription[] = [];
  formGroup: FormGroup;
  testForm: FormGroup; // Test form ekleyelim
  roleModel: RoleModel = new RoleModel();
  roleListDto$: BehaviorSubject<RoleModel[]> = new BehaviorSubject<RoleModel[]>([]);
  constructor(
    private fb: FormBuilder,
    public readonly authService: AuthService,
    public readonly roleService: RoleService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private sweetAlertService: SweetAlertService
  ) {
    this.testForm = this.fb.group({
      testSelect: ['']
    });
  }

  ngOnInit(): void {
    // this.GetRoleList();
  }
  datatableRoleConfig: DataTableConfig = {
    title: 'Yetki Grubu İşlemleri',
    subtitle: 'Sistem sayfalarını görüntüleyin ve yönetin - Backend API\'den çekiliyor',
    apiUrl: 'Security/Role/GetDataTableList',

    dataTemplate: () => (this.roleModel),
    columns: [
      { key: 'Name', dataName: 'name', label: 'Yetki Grubu Adı', sortable: true, searchable: true },
      { key: 'actions', dataName: 'actions', label: 'İşlemler', type: 'dropdown-actions', width: '150px' ,sortable: false, searchable: false}
    ],
    actions: [
      {
        label: 'Düzenle',
        icon: 'heroicons_outline:pencil',
        color: 'primary',
        action: (row) => this.SetModal(row)
      },
      {
        label: 'Sil',
        icon: 'heroicons_outline:trash',
        color: 'warn',
        action: (row) => this.Del(row)
      },
     
    ],
    customButtons: [
      {
        label: 'Yeni Rol Ekle',
        icon: 'heroicons_outline:shield-check',
        color: 'primary',
        variant: 'raised',
        action: () => this.AddModal(),
        tooltip: 'Yeni rol eklemek için tıklayın'
      }
    ],
    filters: [
      
    ],
    searchable: true,
    pagination: { enabled: true, pageSize: 8 }
  };

    // Modal açma fonksiyonu
  AddModal() {
    
    const dialogData: RoleFormDialogData = {
      isEditMode: false,
      modalSize: 'max-w-2xl'
    };


    const dialogRef = this.dialog.open(ModalFormComponent, {
      width: '600px',
      data: dialogData,
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });


    const sbDialog = dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.sweetAlertService.showMessage('success', 'Rol başarıyla eklendi');
        // DataTable'ı yenile
        if (this.dataTableComponent) {
          this.dataTableComponent._dataTableService.refresh();
        }
      }
    });
    this.subscriptions.push(sbDialog);
  }

  SetModal(roleDto: RoleModel) {

    const dialogData: RoleFormDialogData = {
      roleModel: roleDto,
      isEditMode: true,
      modalSize: 'max-w-2xl'
    };

    const dialogRef = this.dialog.open(ModalFormComponent, {
      width: '600px',
      data: dialogData,
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    const sbDialog = dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.sweetAlertService.showMessage('success', 'Rol başarıyla güncellendi');
        // DataTable'ı yenile
        if (this.dataTableComponent) {
          this.dataTableComponent._dataTableService.refresh();
        }
      }
    });
    this.subscriptions.push(sbDialog);
  }
  Del(roleDto: RoleModel) {
    const sbDel = this.roleService.Del(roleDto)
      .subscribe((res: string) => {
        if (res === 'success') {
          this.sweetAlertService.showMessage('success', 'Rol başarıyla silindi');
          // DataTable'ı yenile
          if (this.dataTableComponent) {
            this.dataTableComponent._dataTableService.refresh();
          }
        }
      });
    this.subscriptions.push(sbDel);
  }
  RoleToRoleWidget(roleDto: RoleModel) {
    this.router.navigate(['/super-admin/role-widget'], { state: { roleDto: roleDto } });
  }


  ngOnDestroy(): void {
    this.subscriptions.forEach((sb) => sb.unsubscribe());
  }
}

