import { BehaviorSubject } from 'rxjs';
import {
  Component,
  OnInit,
  ViewEncapsulation,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RoleModel } from 'app/base/models/security/role/role.model';
import { RoleUserModel } from 'app/base/models/security/role-user/role-user.model';
import { ModalAddComponent } from './components/modal-add/modal-add.component';
import { RoleUserService } from './role-user.service';
import { DataTableComponent, DataTableConfig } from 'app/shared/components/data-table';
import { MatDialog } from '@angular/material/dialog';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';

@Component({
  selector: 'app-superadmin-roleuser',
  templateUrl: './role-user.component.html',
  styleUrls: ['./role-user.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent
  ],
  providers: [RoleUserService, SweetAlertService],
})
export class RoleUserComponent implements OnInit, OnDestroy {
  @ViewChild(DataTableComponent) dataTableComponent!: DataTableComponent;

  private subscriptions: Subscription[] = [];
  roleUserModel: RoleUserModel = new RoleUserModel();

  constructor(
    public readonly roleUserService: RoleUserService,
    private dialog: MatDialog,
    private sweetAlertService: SweetAlertService
  ) {
  }

  ngOnInit(): void {

  }
  datatableRoleUserConfig: DataTableConfig = {
    title: 'Yetki Grubu İşlemleri',
    subtitle: 'Sistem sayfalarını görüntüleyin ve yönetin - Backend API\'den çekiliyor',
    showTitle: false, // başlık görünsün istersen true yap, eklenen custom butonlar yine görünür merak etme ae
    apiUrl: 'Security/RoleUser/GetDataTableList',

    dataTemplate: () => (this.roleUserModel),
    onFiltersChange: (filters) => this.onFiltersChange(filters),

    customButtons: [
      {
        label: 'Yeni Kullanıcı Ekle',
        icon: 'heroicons_outline:user-plus',
        color: 'primary',
        variant: 'raised',
        action: () => this.AddModal(),
        tooltip: 'Seçili role yeni kullanıcı ekle'
      }
    ],

    columns: [
      { key: '1', dataName: 'userDto.identificationNumber', label: 'Kimlik No', sortable: false, searchable: false },
      { key: '2', dataName: 'userDto.name', label: 'Ad', sortable: false, searchable: false },
      { key: '3', dataName: 'userDto.lastName', label: 'Soyad', sortable: false, searchable: false },
      { key: '4', dataName: 'roleDto.name', label: 'Rol', sortable: false, searchable: false },
      { key: '5', dataName: 'etikKurulDto.name', label: 'Etik Kurul', sortable: false, searchable: false },
      { key: '6', dataName: 'actions', label: 'İşlemler', type: 'dropdown-actions', width: '150px', sortable: false, searchable: false }
    ],
    actions: [

      {
        label: 'Sil',
        icon: 'heroicons_outline:trash',
        color: 'warn',
        action: (row) => this.Del(row)
      },

    ],
    filters: [
      {
        key: 'roleDto',
        label: 'Roller',
        type: 'api-select',
        apiUrl: 'Security/Role/GetList',
        displayField: 'name',
        placeholder: 'Rol seçiniz...',
        multiple: false,
        colSize: 'md:w-1/3'
      },
      {
        key: 'etikKurulDto',
        label: 'Etik Kurul',
        type: 'api-select',
        apiUrl: 'DefinitionOperations/EtikKurul/GetList',
        displayField: 'name',
        placeholder: 'Etik kurul seçiniz...',
        multiple: false,
        colSize: 'md:w-1/3'
      },
    ],
    searchable: true,
    pagination: { enabled: true, pageSize: 8 }
  };
  onFiltersChange(filters: any): void {
    this.roleUserModel.roleDto = filters.filter_roleDto ?? null;
    this.roleUserModel.etikKurulDto = filters.filter_etikKurulDto ?? null;


    if (this.dataTableComponent) {
      this.dataTableComponent._dataTableService.refresh();
    }
  }


  AddModal() {
    const dialogRef = this.dialog.open(ModalAddComponent, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: true,
      autoFocus: false,
      panelClass: 'modern-dialog-panel',
      data: {
        roleDto: this.roleUserModel.roleDto ?? null,
        modalSize: 'w-full' // Size parametresi
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.sweetAlertService.showMessage('success', 'Kullanıcı başarıyla eklendi');
        this.searchButton(); // DataTable'ı yenile
      }
    });
  }

  Del(roleUserDto: RoleUserModel) {

    const sbDel = this.roleUserService
      .Del(roleUserDto)
      .subscribe({
        next: (res: string) => {
          if (res === 'success') {
            this.sweetAlertService.showMessage('success', 'Kullanıcı başarıyla silindi');
            this.searchButton(); // DataTable'ı yenile
          } else {
            this.sweetAlertService.showMessage('error', 'Silme işlemi başarısız');
          }
        },
        error: (error) => {
          this.sweetAlertService.showMessage('error', 'Silme işleminde hata oluştu');
        }
      });
    this.subscriptions.push(sbDel);
  }

  searchButton() {
    if (this.dataTableComponent) {
      this.dataTableComponent._dataTableService.refresh();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sb) => sb.unsubscribe());
  }
}
