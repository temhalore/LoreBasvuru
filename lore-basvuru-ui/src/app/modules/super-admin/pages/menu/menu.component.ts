import { OnDestroy } from '@angular/core';
/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
import { Component, OnInit, SimpleChanges, ViewEncapsulation, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, AbstractControl, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MenuService } from './menu.service';
import { AuthService } from 'app/base/services/auth.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { TreeListComponent, TreeListConfig } from 'app/shared/components/tree-list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ModalFormComponent, MenuFormDialogData } from './components/modal-form/modal-form.component';
import { MenuModel } from 'app/base/models/security/menu/menu.model';


@Component({
  selector: 'app-superadmin-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    TreeListComponent,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
  ],

  providers: [MenuService, SweetAlertService]
})
export class MenuComponent implements OnInit, OnDestroy {
  @ViewChild(TreeListComponent) treeListComponent!: TreeListComponent;

  private subscriptions: Subscription[] = [];
  // TreeNode ve LazyLoadEvent types will be replaced with basic interfaces
  menuTreeList$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  treeList$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  seletedMenuDto$: BehaviorSubject<MenuModel> = new BehaviorSubject<MenuModel>(new MenuModel);
  public cols: any[];
  constructor(
    public readonly menuService: MenuService,
    public readonly authService: AuthService,
    private dialog: MatDialog,
    private sweetAlertService: SweetAlertService) {
  }

  ngOnInit() {
    // Component initialization complete
  }

  menuTreeConfig: TreeListConfig = {
        title: 'Menü Ağacı Yönetimi',
        subtitle: 'Sistem menülerini hiyerarşik yapıda görüntüleyin ve yönetin - Backend API\'den çekiliyor',
        apiUrl: 'Security/Menu/GetMenuTreeListForAdmin',
        dataTemplate: () => new MenuModel(),
        displayFields: [
            {
                key: 'title',
                label: 'Menü Başlığı',
                width: '180px',
                sortable: true,
                searchable: true
            },
            {
                key: 'type',
                label: 'Tip',
                width: '100px',
                sortable: true,
                searchable: true
            },
            {
                key: 'tree',
                label: 'Menü Yolu',
                width: '220px',
                sortable: true,
                searchable: true
            },
            {
                key: 'icon',
                label: 'İkon',
                width: '100px',
                type: 'icon'
            },
            {
                key: 'pageDto.routerLink',
                label: 'Router Link',
                width: '350px',
                type: 'link'
            },
            {
                key: 'orderIndex',
                label: 'Sıra No',
                width: '80px',
                sortable: true,
                type: 'text'
            },
            {
                key: 'isActive',
                label: 'Aktif',
                width: '80px',
                type: 'boolean'
            },
        ],
        actions: [
            {
                label: 'Düzenle',
                icon: 'heroicons_outline:pencil',
                color: 'primary',
                action: (node) => this.SetModal(node.data as MenuModel),
            },
          // {
          //   label: 'Menü Yetki',
          //   icon: 'heroicons_outline:shield-check',
          //   color: 'accent',
          //   action: (node) => this.OpenMenuPermissionModal(node.data as MenuModel),
          // },
            {
                label: 'Yukarı Taşı',
                icon: 'heroicons_outline:arrow-up',
                color: 'accent',
                action: (node) => this.MoveUp(node.data as MenuModel),
            },
            {
                label: 'Aşağı Taşı',
                icon: 'heroicons_outline:arrow-down',
                color: 'accent',
                action: (node) => this.MoveDown(node.data as MenuModel),
            },
            {
                label: 'Sil',
                icon: 'heroicons_outline:trash',
                color: 'warn',
                action: (node) => this.Del(node.data as MenuModel),
            }
        ],
        customButtons: [
            {
                label: 'Yeni Menü Ekle',
                icon: 'heroicons_outline:plus-circle',
                color: 'primary',
                variant: 'raised',
                action: () => this.AddModal(),
                tooltip: 'Yeni menü eklemek için tıklayın'
            },
            {
                label: 'Tümünü Yenile',
                icon: 'heroicons_outline:arrow-path',
                color: 'accent',
                variant: 'stroked',
                action: () => this.treeListComponent?.onRefresh(),
                tooltip: 'Menü listesini yeniden yükle'
            }
        ],
        filters: [
            {
                key: 'type',
                label: 'Menü Tipi',
                type: 'select',
                options: [
                    { value: 'basic', label: 'Temel Menü' },
                    { value: 'collapsable', label: 'Daraltılabilir Menü' },
                    { value: 'group', label: 'Menü Grubu' },
                    { value: 'divider', label: 'Ayırıcı' },
                    { value: 'spacer', label: 'Boşluk' }
                ]
            },
            {
                key: 'isActive',
                label: 'Menü Durumu',
                type: 'select',
                options: [
                    { value: true, label: 'Aktif Menüler' },
                    { value: false, label: 'Pasif Menüler' }
                ]
            },
            {
                key: 'pageDto',
                label: 'Sayfa Bağlantısı',
                type: 'select',
                options: [
                    { value: 'exists', label: 'Sayfa Linki Var' },
                    { value: 'not_exists', label: 'Sayfa Linki Yok' }
                ]
            }
        ],
        searchable: true,
        expandable: true,
        selectable: true
    };


  // GetMenuTreeListForAdmin() {
  //   const sbMenuTreeList = this.menuService.GetMenuTreeListForAdmin()
  //     .subscribe((res: any[]) => {
  //       this.menuTreeList$.next(res);
  //       this.treeList$.next(res)

  //     }
  //     );
  //   this.subscriptions.push(sbMenuTreeList);
  // }
  AddModal() {
    const dialogRef = this.dialog.open(ModalFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
      data: {
        menu: null,
        isEditMode: false,
        dialogTitle: 'Yeni Menü Ekle'
      } as MenuFormDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.treeListComponent?.onRefresh();
      }
    });
  }

  SetModal(menuDto: MenuModel) {
    const dialogRef = this.dialog.open(ModalFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
      data: {
        menu: menuDto,
        isEditMode: true,
        dialogTitle: 'Menü Düzenle'
      } as MenuFormDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.treeListComponent?.onRefresh();
      }
    });
  }

  // OpenMenuPermissionModal(menuDto: MenuModel) {
  //   const menuId = menuDto?.eid ?? (menuDto?.id !== undefined ? `${menuDto.id}` : '');
  //   this.dialog.open(MenuPermissionModalComponent, {
  //     width: '640px',
  //     maxWidth: '95vw',
  //     disableClose: false,
  //     autoFocus: false,
  //     data: {
  //       menuId,
  //       menuName: menuDto?.title,
  //     } as MenuPermissionDialogData,
  //   });
  // }

  Del(menuDto: MenuModel) {
    const sbDel = this.menuService.Del(menuDto)
      .subscribe((res: string) => {
        if (res === 'success') {
          this.treeListComponent?.onRefresh();
        }
      });
    this.subscriptions.push(sbDel);
  }
  MoveUp(menuDto: MenuModel) {
    if (menuDto.parentMenuDto === null) {
      menuDto.parentMenuDto = new MenuModel();
    }
    const sbMenuMoveUp = this.menuService.MoveUp(menuDto)
      .subscribe(() => {
        this.treeListComponent?.onRefresh();
      });
    this.subscriptions.push(sbMenuMoveUp);
  }

  MoveDown(menuDto: MenuModel) {
    if (menuDto.parentMenuDto === null) {
      menuDto.parentMenuDto = new MenuModel();
    }
    const sbMenuMoveDown = this.menuService.MoveDown(menuDto)
      .subscribe(() => {
        this.treeListComponent?.onRefresh();
      });
    this.subscriptions.push(sbMenuMoveDown);
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((sb) => sb.unsubscribe());
  }
}

