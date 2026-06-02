import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { EtikKurulModel } from 'app/base/models/definition-operations/etik-kurul.model';
import { LocalStorageService } from 'app/base/services/local-storage.service';
import { FormIntegrationFilterModel } from './models/form-integration-filter.model';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { MetaService } from 'app/core/services/meta.service';
import { EtikKurulService } from 'app/modules/definition-operations/pages/etik-kurul/etik-kurul.service';
import { DataTableComponent, DataTableConfig } from 'app/shared/components/data-table';
import { CreateFormModalComponent } from './components/create-form-modal/create-form-modal.component';

@Component({
    selector: 'app-admin-form-list',
    standalone: true,
    templateUrl: './form-list.component.html',
    styleUrls: ['./form-list.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, DataTableComponent, MatDialogModule],
    providers: [SweetAlertService],
})
export class FormListComponent implements OnInit, OnDestroy {
    @ViewChild(DataTableComponent) private dataTableComponent?: DataTableComponent;

    readonly filterModel = new FormIntegrationFilterModel();
    private readonly destroy$ = new Subject<void>();
    private currentEtikKurulEid = '';

    readonly publishStatusOptions = [
        { value: 1400001, label: 'Taslak' },
        { value: 1400002, label: 'Yayında' },
        { value: 1400003, label: 'Geri Çekildi' },
    ];

    readonly tableConfig: DataTableConfig = {
        title: 'Bana Ait Formlar',
        subtitle: 'Oluşturduğunuz formları görüntüleyin, filtreleyin ve sonraki adımlar için hazırlayın.',
        showTitle: false, // başlık görünsün istersen true yap, eklenen custom butonlar yine görünür merak etme ae
        apiUrl: 'FormBuild/Form/GetMyFormsDataTableList',
        dataTemplate: () => this.filterModel,
        columns: [
            { key: 'Baslik', dataName: 'baslik', label: 'Form Başlığı', sortable: true, searchable: true },
            { key: 'OlusturulmaTarihi', dataName: 'olusturulmaTarihi', label: 'Oluşturulma Tarihi', type: 'date', format: 'dd.MM.yyyy HH:mm', sortable: true, searchable: false, width: '220px' },
            { key: 'YayinDurumKID', dataName: 'yayinDurumu.kod', label: 'Yayın Durumu', type: 'badge', sortable: true, searchable: false, width: '160px' },
            { key: 'actions', dataName: 'actions', label: 'İşlemler', type: 'dropdown-actions', width: '140px', sortable: false, searchable: false }
        ],
        actions: [
            {
                label: 'Önizle',
                icon: 'heroicons_outline:eye',
                color: 'primary',
                action: (row) => this.openPreview(row)
            },
            {
                label: 'Düzenle',
                icon: 'heroicons_outline:pencil',
                color: 'primary',
                action: (row) => this.openEditor(row)
            },
            {
                label: 'Kopyala',
                icon: 'heroicons_outline:document-duplicate',
                color: 'accent',
                action: (row) => this.showMessage('Kopyala', row?.baslik)
            }
        ],
        filters: [
            {
                key: 'baslik',
                label: 'Form Başlığı',
                type: 'text',
                placeholder: 'Başlığa göre filtreleyin',
                colSize: 'md:w-1/3'
            },
            {
                key: 'yayinDurumKID',
                label: 'Yayın Durumu',
                type: 'select',
                options: this.publishStatusOptions,
                placeholder: 'Durum seçiniz',
                colSize: 'md:w-1/4'
            }
        ],
        customButtons: [
            {
                label: 'Yeni Form Oluştur',
                icon: 'heroicons_outline:plus-circle',
                color: 'primary',
                variant: 'raised',
                action: () => this.openCreateFormModal(),
                tooltip: 'Yeni form oluşturma penceresini aç'
            }
        ],
        searchable: true,
        pagination: { enabled: true, pageSize: 10, pageSizeOptions: [5, 10, 25] },
        sorting: { enabled: true, defaultSort: { column: 'OlusturulmaTarihi', direction: 'desc' } },
    };

    constructor(
        private readonly metaService: MetaService,
        private readonly dialog: MatDialog,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly etikKurulService: EtikKurulService,
        private readonly sweetAlertService: SweetAlertService,
    ) {}

    ngOnInit(): void {
        this.metaService.setPageTitle('Form Entegrasyonu');

        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
            const routeEtikKurulEid = params.get('etikKurulEid') ?? '';
            const selectedEtikKurulEid = this.resolveSelectedEtikKurulEid();

            if (!selectedEtikKurulEid) {
                this.currentEtikKurulEid = '';
                this.filterModel.formKokId = -1;
                this.refreshTable();
                return;
            }

            if (routeEtikKurulEid !== selectedEtikKurulEid) {
                void this.router.navigate(['/form/list', selectedEtikKurulEid], { replaceUrl: true });
                return;
            }

            this.currentEtikKurulEid = selectedEtikKurulEid;
            this.loadEtikKurulFormBinding(selectedEtikKurulEid);
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private openCreateFormModal(): void {
        if (!this.currentEtikKurulEid) {
            this.sweetAlertService.showMessage('info', 'Form oluşturmak için önce geçerli bir etik kurul seçmelisiniz.');
            return;
        }

        const dialogRef = this.dialog.open(CreateFormModalComponent, {
            width: '720px',
            maxWidth: '95vw',
            autoFocus: false,
            disableClose: true,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'success') {
                this.sweetAlertService.showMessage('success', 'Form başarıyla oluşturuldu.');
                this.loadEtikKurulFormBinding(this.currentEtikKurulEid);
            }
        });
    }

    private showMessage(actionName: string, formTitle?: string): void {
        const targetLabel = formTitle ? `“${formTitle}”` : 'seçili form';
        this.sweetAlertService.showMessage('info', `${actionName} aksiyonu ${targetLabel} için henüz hazır değil.`);
    }

    private openEditor(row?: { baslik?: string; eid?: string }): void {
        if (!row?.eid) {
            this.showMessage('Düzenle', row?.baslik);
            return;
        }

        void this.router.navigate(['/form', row.eid, 'editor']);
    }

    private openPreview(row?: { baslik?: string; eid?: string }): void {
        if (!row?.eid) {
            this.showMessage('Önizle', row?.baslik);
            return;
        }

        void this.router.navigate(['/form/preview', row.eid]);
    }

    private loadEtikKurulFormBinding(etikKurulEid: string): void {
        this.etikKurulService
            .Get({ eid: etikKurulEid } as EtikKurulModel)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (etikKurul) => {
                    this.filterModel.formKokId = etikKurul?.basvuruFormKokId ?? -1;
                    this.refreshTable();
                },
                error: () => {
                    this.filterModel.formKokId = -1;
                    this.refreshTable();
                },
            });
    }

    private refreshTable(): void {
        this.dataTableComponent?._dataTableService.refresh();
    }

    private resolveSelectedEtikKurulEid(): string {
        const selectedEtikKurulEid = LocalStorageService.getSelectedEtikKurulEid();
        if (selectedEtikKurulEid) {
            return selectedEtikKurulEid;
        }

        const firstEtikKurulEid =
            LocalStorageService.getDecodedLocalStorageObject()?.kisiTokenDto?.kisiDto?.etikKurulRoleListDto?.[0]?.etikKurulDto?.eid ?? '';

        if (firstEtikKurulEid) {
            LocalStorageService.setSelectedEtikKurulEid(firstEtikKurulEid);
        }

        return firstEtikKurulEid;
    }
}
