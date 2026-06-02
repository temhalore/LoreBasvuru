import { OnDestroy } from '@angular/core';
/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, AbstractControl, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { PermissionModel } from 'app/base/models/security/permission/permission.model';
import { PermissionService } from './permission.service';
import { AuthService } from 'app/base/services/auth.service';
import { DataTableComponent, DataTableConfig } from 'app/shared/components/data-table';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';


@Component({
  selector: 'app-superadmin-permission',
  templateUrl: './permission.component.html',
  styleUrls: ['./permission.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DataTableComponent
  ],
  providers: [PermissionService,SweetAlertService]
})
export class PermissionComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = []; 
  permissionListDto$: BehaviorSubject<PermissionModel[]> = new BehaviorSubject<PermissionModel[]>([]);
  permissionModel: PermissionModel = new PermissionModel();
  // permissionList$: BehaviorSubject<PermissionModel[]> = new BehaviorSubject<PermissionModel[]>([]);
  constructor(
    public readonly authService: AuthService,
    public readonly permissionService: PermissionService
    ) {
  }


  ngOnInit() {
  }
    datatablePermissionConfig: DataTableConfig = {
      title: 'Yetki İşlemleri',
      subtitle: 'Sistem sayfalarını görüntüleyin ve yönetin - Backend API\'den çekiliyor',
      showTitle: false, // başlık görünsün istersen true yap, eklenen custom butonlar yine görünür merak etme ae
      apiUrl: 'Security/Permission/GetDataTableList',
  
      dataTemplate: () => (this.permissionModel),
      columns: [
        { key: 'Area', dataName: 'area', label: 'Area', sortable: true, searchable: true },
        { key: 'Controller', dataName: 'controller', label: 'Controller', sortable: true, searchable: true },
        { key: 'Action', dataName: 'action', label: 'Action', sortable: true, searchable: true },
        { key: 'Name', dataName: 'name', label: 'Ad', sortable: true, searchable: true },
        { key: 'Url', dataName: 'url', label: 'URL', sortable: true, searchable: true },
        { key: 'Actions', dataName: 'actions', label: 'İşlemler', type: 'dropdown-actions', width: '150px',sortable: false, searchable: false }
      ],
      actions: [
        // {
        //   label: 'Düzenle',
        //   icon: 'heroicons_outline:pencil',
        //   action: (row) => this.SetModal(row)
        // },
      ],
      customButtons: [
        {
          label: 'Yetkileri Güncelle',
          icon: 'heroicons_outline:shield-check',
          color: 'primary',
          variant: 'raised',
          action: () => this.Check(),
          tooltip: 'Sistem yetkilerini kontrol et ve güncelle'
        }
      ],
      filters: [
     
      ],
      searchable: true,
      pagination: { enabled: true, pageSize: 8 }
    };
  

  Check() {
    const sbCheck = this.permissionService.Check()
      .subscribe((res: boolean) => {
        // this.GetList();
  });
    this.subscriptions.push(sbCheck);
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((sb) => sb.unsubscribe());
  }
}

