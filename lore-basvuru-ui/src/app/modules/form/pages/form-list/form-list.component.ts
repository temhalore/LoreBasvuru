import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { MetaService } from 'app/core/services/meta.service';
import { DataTableComponent, DataTableConfig } from 'app/shared/components/data-table';
import { FormBuildService } from '../../services/form-build.service';

@Component({
    selector: 'app-admin-form-list',
    standalone: true,
    templateUrl: './form-list.component.html',
    styleUrls: ['./form-list.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, DataTableComponent, MatDialogModule],
    providers: [SweetAlertService, FormBuildService],
})
export class FormListComponent implements OnInit, OnDestroy {
    @ViewChild(DataTableComponent) private dataTableComponent?: DataTableComponent;

    private readonly destroy$ = new Subject<void>();

    readonly tableConfig: DataTableConfig = {
        title: 'Form Yönetimi',
        subtitle: 'Oluşturduğunuz başvuru formlarını görüntüleyin ve yönetin.',
        showTitle: false,
        apiUrl: 'FormBuild/FormListesiGetir',
        dataTemplate: () => ({}),
        columns: [
            { key: 'Ad', dataName: 'ad', label: 'Form Adı', sortable: true, searchable: true },
            { key: 'Aciklama', dataName: 'aciklama', label: 'Açıklama', sortable: false, searchable: false },
            { key: 'Durum', dataName: 'durum', label: 'Durum', sortable: true, searchable: false, width: '120px' },
            { key: 'OlusturulmaTarihi', dataName: 'olusturulmaTarihi', label: 'Tarih', type: 'date', format: 'dd.MM.yyyy', sortable: true, searchable: false, width: '160px' },
            { key: 'actions', dataName: 'actions', label: 'İşlemler', type: 'dropdown-actions', width: '140px', sortable: false, searchable: false }
        ],
        actions: [
            {
                label: 'Düzenle',
                icon: 'heroicons_outline:pencil',
                color: 'primary',
                action: (row) => this.openEditor(row)
            },
            {
                label: 'Önizle',
                icon: 'heroicons_outline:eye',
                color: 'accent',
                action: (row) => this.openPreview(row)
            },
            {
                label: 'Yayınla',
                icon: 'heroicons_outline:globe-alt',
                color: 'warn',
                action: (row) => this.yayinla(row)
            }
        ],
        customButtons: [
            {
                label: 'Yeni Form',
                icon: 'heroicons_outline:plus-circle',
                color: 'primary',
                variant: 'raised',
                action: () => this.yeniForm(),
                tooltip: 'Yeni başvuru formu oluştur'
            }
        ],
        searchable: true,
        pagination: { enabled: true, pageSize: 10 },
        sorting: { enabled: true, defaultSort: { column: 'OlusturulmaTarihi', direction: 'desc' } },
    };

    constructor(
        private readonly metaService: MetaService,
        private readonly router: Router,
        private readonly formBuildService: FormBuildService,
        private readonly sweetAlertService: SweetAlertService,
    ) {}

    ngOnInit(): void {
        this.metaService.setPageTitle('Form Yönetimi');
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private yeniForm(): void {
        // Yeni form oluştur ve editöre yönlendir
        this.formBuildService.FormKaydet({ ad: 'Yeni Form', aciklama: '' }).subscribe({
            next: (res) => {
                if (res?.isSuccess && res.data?.eid) {
                    void this.router.navigate(['/form', res.data.eid, 'editor']);
                }
            },
            error: () => this.sweetAlertService.showMessage('error', 'Form oluşturulamadı.')
        });
    }

    private openEditor(row?: { eid?: string; ad?: string }): void {
        if (!row?.eid) return;
        void this.router.navigate(['/form', row.eid, 'editor']);
    }

    private openPreview(row?: { eid?: string }): void {
        if (!row?.eid) return;
        void this.router.navigate(['/form/preview', row.eid]);
    }

    private yayinla(row?: { eid?: string; ad?: string }): void {
        if (!row?.eid) return;
        this.formBuildService.FormYayinla(row.eid).subscribe({
            next: () => {
                this.sweetAlertService.showMessage('success', `"${row.ad}" yayınlandı.`);
                this.dataTableComponent?._dataTableService.refresh();
            },
            error: () => this.sweetAlertService.showMessage('error', 'Yayınlama başarısız.')
        });
    }
}
