/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
import { Component, OnInit, ViewEncapsulation, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  AbstractControl,
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from './user.service';
import { KisiModel } from '../../../../base/models/security/user/kisi.model';
import { AuthService } from '../../../../base/services/auth.service';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
// import { DataTableService } from '../../../../base/services/datatable.service';
import { ModalAddComponent } from './components/modal-add/modal-add.component';
import { ModalSetComponent } from './components/modal-set/modal-set.component';
import { PageModel } from 'app/base/models/security/page/page.model';
import { DataTableConfig } from 'app/shared/components/data-table';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';

@Component({
  selector: 'app-superadmin-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,DataTableComponent
  ],
  providers: [UserService,SweetAlertService],
})
export class UserComponent implements OnInit, OnDestroy,AfterViewInit {
    @ViewChild(DataTableComponent) dataTableComponent!: DataTableComponent;

    dtColumns = [
      { data: 'identificationNumber', name: 'IdentificationNumber', title: 'Kimlik No', width: '10%' },
      { data: 'name', name: 'name', title: 'Ad', width: '10%' },
      { data: 'lastName', name: 'lastName', title: 'Soyad', width: '10%' },
    ];


    userModel: KisiModel = new KisiModel();
    userListDto$: BehaviorSubject<KisiModel[]> = new BehaviorSubject<KisiModel[]>([]);
    formGroup: FormGroup;
    private subscriptions: Subscription[] = [];



  constructor(
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog,
    public readonly userService: UserService,
    public authService: AuthService,
    // public readonly dataTableService: DataTableService<KisiModel, KisiModel>
  ) {
    // this.InitForm();
  }

  ngOnInit(): void {
    // this.dataTableService.GetDataTableList(this.userDto, 'Security/User/GetDataTableList', this.dtColumns);
  }

    datatableUserConfig: DataTableConfig = {
      title: 'Sayfa İşlemleri',
      subtitle: 'Sistem sayfalarını görüntüleyin ve yönetin - Backend API\'den çekiliyor',
      showTitle: false, // başlık görünsün istersen true yap, eklenen custom butonlar yine görünür merak etme ae
      apiUrl: 'Security/User/GetDataTableList',
  
      dataTemplate: () => (this.userModel),
      columns: [
        { key: 'Ad', dataName: 'name', label: 'Ad', sortable: true, searchable: true },
        { key: 'Soyad', dataName: 'lastName', label: 'Soyad', sortable: true, searchable: true },
        { key: 'KimlikNo', dataName: 'identificationNumber', label: 'Kimlik No', sortable: true, searchable: true },
        { key: 'actions', dataName: 'actions', label: 'İşlemler', type: 'dropdown-actions', width: '150px', searchable: false }
      ],
      actions: [
        // {
        //   label: 'Düzenle',
        //   icon: 'heroicons_outline:pencil',
        //   action: (row) => this.SetModal(row)
        // },
        {
          label: 'Kullanıcıyı Sil',
          icon: 'heroicons_outline:trash',
          color: 'warn',
          action: (row) => this.Del(row)
        },
      ],
      filters: [
        
      ],
      searchable: true,
      pagination: { enabled: true, pageSize: 8 }
    };
  
  

  AddModal() {
    const dialogRef = this.dialog.open(ModalAddComponent, {
      width: '600px',
      data: {
        pageDto: new PageModel()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // TODO: Refresh data table or list
      }
    });
  }

  SetModal(pageDto: PageModel) {
    const dialogRef = this.dialog.open(ModalSetComponent, {
      width: '600px',
      data: {
        pageDto: pageDto
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // TODO: Refresh data table or list
      }
    });
  }

  Del(userDto: KisiModel) {
    const sbDel = this.userService.Del(userDto).subscribe({
      next: (res: string) => {
        if (this.dataTableComponent) {
          this.dataTableComponent._dataTableService.refresh();
        }
      },
    });
    this.subscriptions.push(sbDel);
  }

  searchButton() {
    // this.dataTableService.Renderer(this.dtElement);
  }
  ngAfterViewInit(): void {
    // this.dataTableService.getDtTrigger.next(undefined);
  }
  ngOnDestroy(): void {
    // this.dataTableService.getDtTrigger.unsubscribe();
    this.subscriptions.forEach((sb) => sb.unsubscribe());
  }
}
