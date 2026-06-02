/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
import { Component, OnInit, ViewEncapsulation, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { PageModel } from '../../../../base/models/security/page/page.model';
import { PageService } from './page.service';
import { AuthService } from '../../../../base/services/auth.service';
import { DataTableComponent, DataTableConfig } from 'app/shared/components/data-table';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { MatDialog } from '@angular/material/dialog';
import { ModalFormComponent } from './components/modal-form/modal-form.component';
import { MetaService } from 'app/core/services/meta.service';


@Component({
  selector: 'app-superadmin-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent
  ],
  providers: [PageService, SweetAlertService]
})
export class PageComponent implements OnInit, OnDestroy {
  @ViewChild(DataTableComponent) dataTableComponent!: DataTableComponent;

  private subscriptions: Subscription[] = [];
  pageList$: BehaviorSubject<PageModel[]> = new BehaviorSubject<PageModel[]>([]);
  pageModel: PageModel = new PageModel();

  constructor(
    public readonly pageService: PageService,
    private readonly sweetAlertService: SweetAlertService,
    private dialog: MatDialog,
    private metaService: MetaService,
    private readonly router: Router,
  ) {
  }
  ngOnInit(): void {
    // Sayfa meta bilgilerini ayarla
    this.metaService.setPageTitle('Sayfa Yönetimi');
    
    // this.GetPageList()
  }
  datatablePageConfig: DataTableConfig = {
    title: 'Sayfa İşlemleri',
    subtitle: 'Sistem sayfalarını görüntüleyin ve yönetin - Backend API\'den çekiliyor',
    apiUrl: 'Security/Page/GetDataTableList',

    dataTemplate: () => (this.pageModel),
    onFiltersChange: (filters) => this.onFiltersChange(filters),
    customButtons: [
      {
        label: 'Yeni Sayfa Ekle',
        icon: 'heroicons_outline:plus-circle',
        color: 'primary',
        variant: 'raised',
        action: () => this.AddModal(),
        tooltip: 'Yeni sayfa eklemek için tıklayın'
      }
    ],
    columns: [
      { key: 'Name', dataName: 'name', label: 'Sayfa Adı', sortable: true, searchable: true },
      { key: 'RouterLink', dataName: 'routerLink', label: 'Router Link', sortable: true, searchable: true },
      { key: 'MenuTree', dataName: 'menuTree', label: 'Menu Tree', sortable: false, searchable: false },
      { key: 'OrderNo', dataName: 'orderNo', label: 'Sıra', sortable: true, searchable: true },
      { key: 'Actions', dataName: 'actions', label: 'İşlemler', type: 'dropdown-actions', width: '150px', sortable: false, searchable: false }
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
      // {
      //   label: 'Yukarı Taşı',
      //   icon: 'heroicons_outline:arrow-up',
      //   action: (row) => this.MoveUp(row)
      // },
      // {
      //   label: 'Aşağı Taşı',
      //   icon: 'heroicons_outline:arrow-down',
      //   action: (row) => this.MoveDown(row)
      // },
      // {
      //   label: 'Widget\'lara Git',
      //   icon: 'heroicons_outline:puzzle-piece',
      //   action: (row) => this.GoToPageToWidget(row)
      // }
    ],
    filters: [

    ],
    searchable: true,
    pagination: { enabled: true, pageSize: 10 }
  };

  onFiltersChange(filters: any): void {

    // // filter_pageDto varsa widgetModel.pageDto'ya set et
    // // if (filters.filter_pageDto) {
    // //   this.pageModel.pageDto = filters.filter_pageDto;
    // // }

    // // Diğer filter'lar için de aynı şekilde set edilebilir
    // // if (filters.filter_isActive !== undefined) {
    // //   this.widgetModel.isActive = filters.filter_isActive;
    // // }


    // DataTable'ı yeniden yükle - widgetModel güncellendiği için yeni parametrelerle API çağrısı yapacak
    if (this.dataTableComponent) {
      this.dataTableComponent._dataTableService.refresh();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sb) => sb.unsubscribe());
  }

  AddModal() {
    const dialogRef = this.dialog.open(ModalFormComponent, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: true,
      autoFocus: false,
      panelClass: 'modern-dialog-panel',
      data: {
        pageModel: null, // Yeni ekleme için null
        isEditMode: false, // Add modu
        modalSize: 'w-full'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.sweetAlertService.showMessage('success', 'Sayfa başarıyla eklendi');
        this.searchButton(); // DataTable'ı yenile
      }
    });
  }

  SetModal(pageDto: PageModel) {
    const dialogRef = this.dialog.open(ModalFormComponent, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: true,
      autoFocus: false,
      panelClass: 'modern-dialog-panel',
      data: {
        pageModel: pageDto, // Düzenlenecek sayfa verisi
        isEditMode: true, // Edit modu
        modalSize: 'w-full'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.sweetAlertService.showMessage('success', 'Sayfa başarıyla güncellendi');
        this.searchButton(); // DataTable'ı yenile
      }
    });
  }

  Del(pageDto: PageModel) {
    // Önce silme işlemini onayla

    const sbDel = this.pageService
      .Del(pageDto)
      .subscribe({
        next: (res: string) => {
          //
          if (res === 'success') {
            this.sweetAlertService.showMessage('success', 'Sayfa başarıyla silindi');
            this.searchButton(); // DataTable'ı yenile
          } else {
            this.sweetAlertService.showMessage('error', 'Silme işlemi başarısız');
          }
        },
        error: (error) => {
          //
          this.sweetAlertService.showMessage('error', 'Silme işleminde hata oluştu');
        }
      });
    this.subscriptions.push(sbDel);
  }

  // MoveUp(request: PageModel) {
  //   const sbMenuMoveUp = this.pageService.MoveUp(request).subscribe(() => { this.GetPageList() });
  //   this.subscriptions.push(sbMenuMoveUp);
  // }
  // MoveDown(request: PageModel) {
  //   const sbMenuMoveDown = this.pageService.MoveDown(request).subscribe(() => { this.GetPageList() });
  //   this.subscriptions.push(sbMenuMoveDown);
  // }

  searchButton() {
    if (this.dataTableComponent) {
      this.dataTableComponent._dataTableService.refresh();
    }
  }
  GoToPageToWidget(pageDto: PageModel) {
    this.router.navigate(['/super-admin/widget'], { state: { pageDto: pageDto } });
  }






}

