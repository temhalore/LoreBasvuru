import { ChangeDetectionStrategy, Component, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { DataTableComponent, DataTableConfig } from 'app/shared/components/data-table';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { ResKuralV2Model } from 'app/base/models/form/kuralV2';
import { KuralV2Service } from './kuralv2.service';
import { KuralV2ModalFormComponent, KuralV2FormDialogData } from './components/modal-form/modal-form.component';

@Component({
  selector: 'app-kuralv2',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatDialogModule],
  templateUrl: './kuralv2.component.html',
  styleUrls: ['./kuralv2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [KuralV2Service, SweetAlertService],
})
export class KuralV2Component implements OnDestroy {
  @ViewChild(DataTableComponent) dataTableComponent!: DataTableComponent;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly dialog: MatDialog,
    private readonly kuralV2Service: KuralV2Service,
    private readonly sweetAlertService: SweetAlertService,
  ) {}

  kuralV2Dto: ResKuralV2Model = new ResKuralV2Model();

  datatableConfig: DataTableConfig = {
    title: 'Kural Yönetimi V2',
    subtitle: 'Form ve soru kuralları — validasyon ve yönlendirme tanımları',
    showTitle: false, // başlık görünsün istersen true yap, eklenen custom butonlar yine görünür merak etme ae
    apiUrl: 'Form/KuralV2/GetDataTable',
    dataTemplate: () => this.kuralV2Dto,
    customButtons: [
      {
        label: 'Yeni Kural',
        icon: 'heroicons_outline:plus-circle',
        color: 'primary',
        variant: 'raised',
        action: () => this.onCreate(),
        tooltip: 'V2 kural tanımı ekle',
      },
    ],
    columns: [
      { key: 'KuralTipKID', dataName: 'kuralTipKodDto.kod', label: 'Kural Tipi', sortable: true, searchable: true, width: '180px' },
      { key: 'FormKokID', dataName: 'formKokEIdDto.eid', label: 'Form', sortable: false, searchable: false, width: '140px' },
      { key: 'FormSoruKokID', dataName: 'formSoruKokEIdDto.eid', label: 'Soru', sortable: false, searchable: false, width: '140px' },
      { key: 'IsAktif', dataName: 'isAktif', label: 'Aktif', type: 'boolean', sortable: true, searchable: false, width: '80px' },
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
    const dialogData: KuralV2FormDialogData = { isEditMode: false };
    const dialogRef = this.dialog.open(KuralV2ModalFormComponent, {
      width: '750px',
      data: dialogData,
      disableClose: true,
    });
    const sb = dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.sweetAlertService.showMessage('success', 'Kural kaydı eklendi.');
        this.dataTableComponent?._dataTableService.refresh();
      }
    });
    this.subscriptions.push(sb);
  }

  onEdit(row: unknown): void {
    const rowModel = row as ResKuralV2Model;
    // DataTable row'unda KuralDetay (JSON içeriği) gelmez — Get ile tam veriyi çek
    const sb = this.kuralV2Service.Get({ eid: rowModel.eid } as any).subscribe((fullModel) => {
      const dialogData: KuralV2FormDialogData = {
        isEditMode: true,
        kuralModel: fullModel,
      };
      const dialogRef = this.dialog.open(KuralV2ModalFormComponent, {
        width: '750px',
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
    });
    this.subscriptions.push(sb);
  }

  onDelete(row: unknown): void {
    const sb = this.kuralV2Service.Del(row as ResKuralV2Model).subscribe((res: string) => {
      if (res === 'success') {
        this.sweetAlertService.showMessage('success', 'Kural kaydı silindi.');
        this.dataTableComponent?._dataTableService.refresh();
      }
    });
    this.subscriptions.push(sb);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sb) => sb.unsubscribe());
  }
}
