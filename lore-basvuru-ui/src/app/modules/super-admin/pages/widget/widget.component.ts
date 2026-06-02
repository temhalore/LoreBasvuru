import { Component, OnInit, ViewEncapsulation, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WidgetModel } from '../../../../base/models/security/widget/widget.model';
import { WidgetService } from './widget.service';
import { AuthService } from '../../../../base/services/auth.service';
import { DataTableComponent, DataTableConfig } from 'app/shared/components/data-table';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ModalFormComponent, WidgetFormDialogData } from './components/modal-form/modal-form.component';
import { PageModel } from 'app/base/models/security/page/page.model';


@Component({
  selector: 'app-superadmin-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent,
    MatDialogModule,
  ],
  providers: [WidgetService, SweetAlertService]
})
export class WidgetComponent implements OnInit, OnDestroy {
  @ViewChild(DataTableComponent) dataTableComponent!: DataTableComponent;

  private subscriptions: Subscription[] = [];
  widgetModel: WidgetModel = new WidgetModel();
  selectedPageDto: PageModel | null = null;

  constructor(
    public readonly authService: AuthService,
    public readonly widgetService: WidgetService,
    private readonly router: Router,
    private readonly sweetAlertService: SweetAlertService,
    private dialog: MatDialog,
  ) {
  }
  ngOnInit(): void {
  }
  datatableWidgetConfig: DataTableConfig = {
    title: 'Komponent İşlemleri',
    subtitle: 'Komponentleri görüntüleyin ve yönetin - Backend API\'den çekiliyor',
    showTitle: false, // başlık görünsün istersen true yap, eklenen custom butonlar yine görünür merak etme ae
    apiUrl: 'Security/Widget/GetDataTableList',

    dataTemplate: () => {
      return this.widgetModel;
    },
    onFiltersChange: (filters) => this.onFiltersChange(filters),
    columns: [
      { key: '1', dataName: 'pageDto.menuTree', label: 'Menu Ağacı', sortable: false, searchable: false },
      { key: 'PageId', dataName: 'pageDto.name', label: 'Sayfa Adı', sortable: true, searchable: true },
      { key: '3', dataName: 'pageDto.routerLink', label: 'Sayfa RouterLink', sortable: false, searchable: false },
      { key: 'Name', dataName: 'name', label: 'Komponent Adı', sortable: true, searchable: true },
      { key: 'Selector', dataName: 'selector', label: 'Widget Selector', sortable: true, searchable: true },
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

      {
        label: 'Widget\'lara Git',
        icon: 'heroicons_outline:puzzle-piece',
        color: 'accent',
        action: (row) => this.GoToWidgetToWidget(row)
      }
    ],
    filters: [
      {
        key: 'pageDto',
        label: 'Sayfalar',
        type: 'api-select',
        apiUrl: 'Security/Page/GetList',
        displayField: 'name',
        placeholder: 'Sayfa seçiniz...',
        multiple: false,
        colSize: 'md:w-1/3'
      },
      // {
      //   key: 'isActive',
      //   label: 'Aktif Durumu',
      //   type: 'select',
      //   options: [
      //     { value: true, label: 'Aktif' },
      //     { value: false, label: 'Pasif' }
      //   ]
      // },
      // {
      //   key: 'isPersonel',
      //   label: 'Personel',
      //   type: 'select',
      //   options: [
      //     { value: true, label: 'Evet' },
      //     { value: false, label: 'Hayır' }
      //   ]
      // },
      // {
      //   key: 'isOgrenci',
      //   label: 'Öğrenci',
      //   type: 'select',
      //   options: [
      //     { value: true, label: 'Evet' },
      //     { value: false, label: 'Hayır' }
      //   ]
      // }
    ],
    customButtons: [
      {
        label: 'Yeni Widget Ekle',
        icon: 'heroicons_outline:puzzle-piece',
        color: 'primary',
        variant: 'raised',
        action: () => this.AddModal(),
        tooltip: 'Yeni widget eklemek için önce sayfa seçiniz'
      }
    ],
    searchable: true,
    pagination: { enabled: true, pageSize: 10 }
  };



  ngOnDestroy(): void {
    this.subscriptions.forEach((sb) => sb.unsubscribe());
  }

  /**
   * Filter değişikliklerini dinle ve widgetModel'i güncelle
   */
  onFiltersChange(filters: any): void {

    // filter_pageDto varsa widgetModel.pageDto'ya set et
    if (filters.filter_pageDto) {
      this.widgetModel.pageDto = filters.filter_pageDto;
      this.selectedPageDto = filters.filter_pageDto; // Buton aktif/pasif kontrolü için
    } else {
      // Eğer filter temizlenmişse pageDto'yu da temizle
      this.widgetModel.pageDto = null;
      this.selectedPageDto = null;
    }


    // DataTable'ı yeniden yükle - widgetModel güncellendiği için yeni parametrelerle API çağrısı yapacak
    if (this.dataTableComponent) {
      this.dataTableComponent._dataTableService.refresh();
    }
  }




  SetModal(widgetDto: WidgetModel) {
    const dialogData: WidgetFormDialogData = {
      widgetModel: widgetDto,
      isEditMode: true,
      modalSize: 'w-full'
    };

    const dialogRef = this.dialog.open(ModalFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: true,
      panelClass: 'modern-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        // DataTable'ı yenile
        if (this.dataTableComponent) {
          this.dataTableComponent._dataTableService.refresh();
        }
      }
    });
  }
  Del(widgetDto: WidgetModel) {
    const sbDel = this.widgetService.Del(widgetDto)
      .subscribe((res: string) => {
        if (res === 'success') {
          if (this.dataTableComponent) {
            this.dataTableComponent._dataTableService.refresh();
          }
        }
      });
    this.subscriptions.push(sbDel);
  }

  GoToWidgetToWidget(widgetDto: WidgetModel) {
    this.router.navigate(['/super-admin/widget'], { state: { widgetDto: widgetDto } });
  }

  AddModal() {
    if (this.widgetModel.pageDto == null) {
      this.sweetAlertService.showMessage('warning', 'Lütfen önce bir sayfa seçiniz.');
      return;
    }

    const dialogData: WidgetFormDialogData = {
      pageDto: this.selectedPageDto,
      isEditMode: false,
      modalSize: 'w-full'
    };

    const dialogRef = this.dialog.open(ModalFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: true,
      panelClass: 'modern-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        // DataTable'ı yenile
        if (this.dataTableComponent) {
          this.dataTableComponent._dataTableService.refresh();
        }
      }
    });
  }
}

