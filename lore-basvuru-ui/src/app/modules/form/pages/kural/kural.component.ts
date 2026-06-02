import { ChangeDetectionStrategy, Component, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, DataTableConfig } from 'app/shared/components/data-table';
import { ResKuralModel } from 'app/base/models/form/kural';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { KuralService } from './kural.service';
import { KuralFormDialogData, ModalFormComponent } from './components/modal-form/modal-form.component';

@Component({
  selector: 'app-kural',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatDialogModule],
  templateUrl: './kural.component.html',
  styleUrls: ['./kural.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [KuralService, SweetAlertService],
})
export class KuralComponent implements OnDestroy {
  @ViewChild(DataTableComponent) dataTableComponent!: DataTableComponent;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly dialog: MatDialog,
    private readonly kuralService: KuralService,
    private readonly sweetAlertService: SweetAlertService,
  ) {}

  kuralDto: ResKuralModel = new ResKuralModel();

  datatableKuralConfig: DataTableConfig = {
    title: 'Kural Yönetim Sistemi',
    subtitle: 'Form ve soru kuralları, validasyon tanımları',
    showTitle: false, // başlık görünsün istersen true yap, eklenen custom butonlar yine görünür merak etme ae
    apiUrl: 'Form/Kural/GetDataTableList',
    dataTemplate: () => this.kuralDto,
    customButtons: [
      {
        label: 'Yeni Kural',
        icon: 'heroicons_outline:plus-circle',
        color: 'primary',
        variant: 'raised',
        action: () => this.onCreate(),
        tooltip: 'Kural tanımı ekle',
      },
    ],
    columns: [
    //   { key: 'KuralModelKodD', dataName: 'kuralModelKodDto.kod', label: 'Kural Seviyesi', sortable: true, searchable: true, width: '150px' },
      { key: 'KuralTipKID', dataName: 'kuralTipKodDto.kod', label: 'Kural Tipi', sortable: true, searchable: true, width: '180px' },
      { key: 'FormKokID', dataName: 'formKokEIdDto.eid', label: 'Form', sortable: true, searchable: true, width: '120px' },
      { key: 'FormSoruKokID', dataName: 'formSoruKokEIdDto.eid', label: 'Soru', sortable: true, searchable: true, width: '120px' },
      { key: 'IsAktif', dataName: 'isAktif', label: 'Aktif', type: 'boolean', sortable: true, searchable: false, width: '80px' },
    //   { key: 'CreatedDate', dataName: 'createdDate', label: 'Oluşturma', type: 'date', sortable: true, searchable: false, width: '120px' },
      { key: 'Actions', dataName: 'actions', label: 'İşlemler', type: 'dropdown-actions', sortable: false, searchable: false, width: '140px' },
    ],
    actions: [
      {
        label: 'Düzenle',
        icon: 'heroicons_outline:pencil-square',
        color: 'primary',
        action: (row) => this.onEdit(row),
      },
      {
        label: 'Sil',
        icon: 'heroicons_outline:trash',
        color: 'warn',
        action: (row) => this.onDelete(row),
      },
    ],
    searchable: true,
    pagination: { enabled: true, pageSize: 10 },
  };

  onCreate(): void {
    const dialogData: KuralFormDialogData = {
      isEditMode: false,
    };

    const dialogRef = this.dialog.open(ModalFormComponent, {
      width: '700px',
      data: dialogData,
      disableClose: true,
    });

    const sbDialog = dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.sweetAlertService.showMessage('success', 'Kural kaydı eklendi.');
        this.dataTableComponent?._dataTableService.refresh();
      }
    });
    this.subscriptions.push(sbDialog);
  }

  onEdit(row: unknown): void {
    const dialogData: KuralFormDialogData = {
      isEditMode: true,
      kuralModel: row as ResKuralModel,
    };

    const dialogRef = this.dialog.open(ModalFormComponent, {
      width: '700px',
      data: dialogData,
      disableClose: true,
    });

    const sbDialog = dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.sweetAlertService.showMessage('success', 'Kural kaydı güncellendi.');
        this.dataTableComponent?._dataTableService.refresh();
      }
    });
    this.subscriptions.push(sbDialog);
  }

  onDelete(row: unknown): void {
    const sbDelete = this.kuralService.Del(row as ResKuralModel).subscribe((res: string) => {
      if (res === 'success') {
        this.sweetAlertService.showMessage('success', 'Kural kaydı silindi.');
        this.dataTableComponent?._dataTableService.refresh();
      }
    });
    this.subscriptions.push(sbDelete);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sb) => sb.unsubscribe());
  }
}
