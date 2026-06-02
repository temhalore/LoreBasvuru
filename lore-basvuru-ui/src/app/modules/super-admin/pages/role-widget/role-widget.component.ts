import { BehaviorSubject } from 'rxjs';
/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
import { Component, OnInit, ViewEncapsulation, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RoleWidgetService } from './role-widget.service';
import { RoleService } from '../role/role.service';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RoleWidgetModel } from 'app/base/models/security/role-widget/role-widget.model';
import { RoleModel } from 'app/base/models/security/role/role.model';
import { WidgetModel } from 'app/base/models/security/widget/widget.model';
import { AuthService } from 'app/base/services/auth.service';
import { ApiSelectInputComponent } from 'app/shared/components/form-controls/api-select-input/api-select-input.component';
import { ActionButtonComponent } from 'app/shared/components/action-button/action-button.component';
import { TreeListComponent } from 'app/shared/components/tree-list/tree-list.component';
import { TreeListConfig, TreeNode } from 'app/shared/components/tree-list/tree-list.types';
import { HierarchicalTreeComponent, HierarchicalTreeConfig, HierarchicalTreeNode, TreeItemChangeEvent } from 'app/shared/components/hierarchical-tree/hierarchical-tree.component';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';

@Component({
  selector: 'app-superadmin-rolewidget',
  templateUrl: './role-widget.component.html',
  styleUrls: ['./role-widget.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ApiSelectInputComponent,
    ActionButtonComponent,
    HierarchicalTreeComponent,
  ],
  providers: [RoleWidgetService,RoleService, SweetAlertService],
})
export class RoleWidgetComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  formGroup: FormGroup;
  roleWidgetDto$: BehaviorSubject<RoleWidgetModel> =
    new BehaviorSubject<RoleWidgetModel>(new RoleWidgetModel());
  roleListDto$: BehaviorSubject<RoleModel[]> = new BehaviorSubject<RoleModel[]>(
    []
  );
  selectedRoleDto$: BehaviorSubject<RoleModel>;
  selectedWidgets: any = [];
  
  // HierarchicalTree için data ve config
  hierarchicalTreeData: HierarchicalTreeNode[] = [];
  hierarchicalTreeConfig: HierarchicalTreeConfig = {
    parentLevel: {
      displayField: 'pageDto.name', // Sayfa adı için pageDto.name kullan
      keyField: 'eid', // Unique key için eid
      hasCheckbox: true, // Sayfa seviyesinde checkbox
      cssClass: 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800',
      icon: 'fas fa-file-alt',
      colorClass: 'text-green-600 dark:text-green-400'
    },
    childLevel: {
      displayField: 'name', // Widget adı için name kullan
      keyField: 'eid', // Unique key için eid
      hasCheckbox: true, // Widget seviyesinde checkbox
      permissionField: 'isRoleWidget', // Permission field'ı
      cssClass: 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700',
      icon: 'fas fa-puzzle-piece',
      colorClass: 'text-purple-600 dark:text-purple-400'
    },
    title: 'Rol Komponent İşlemleri',
    subtitle: 'Sayfa ve komponent yetkilerini yönetin',
    emptyStateMessage: 'Rol seçildikten sonra komponent yetkileri burada görüntülenecektir.',
    loadingMessage: 'Komponent yetkileri yükleniyor...'
  };
  isLoading: boolean = false;


  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    public readonly authService: AuthService,
    public readonly roleService: RoleService,
    public readonly roleWidgetService: RoleWidgetService
  ) {
    this.GetRoleList();
    this.InitForm();

    const roleDto = this.router.getCurrentNavigation()?.extras?.state
      ?.roleDto as RoleModel;
    if (roleDto !== undefined) {
      this.selectedRoleDto$ = new BehaviorSubject<RoleModel>(new RoleModel());
      this.selectedRoleDto$.next(roleDto);
      setTimeout(() => {
        this.LoadForm();
      }, 0);
      this.GetRoleWidgetListByRoleDto(roleDto);
      this.GetRoleWidgetTreeListForAdmin(roleDto);

    }
    this.roleWidgetDto$.getValue().widgetListDto = [];
  }

  ngOnInit() {
    // API'den veri çekileceği için test verisi kaldırıldı
  }
  
  InitForm() {
    this.formGroup = this.fb.group({
      roleDto: [null, [Validators.required]],
    });

  }
  LoadForm() {
    this.formGroup.setValue({
      role:
        this.selectedRoleDto$.getValue().eid !== null
          ? this.selectedRoleDto$.getValue()
          : null,
    });
  }

  GetRoleList() {
    this.roleWidgetDto$.getValue().widgetListDto = [];
    if (this.formGroup !== undefined) {
      this.formGroup.patchValue({ role: null });
    }
    this.roleListDto$.next([]);

    const sbRoleList = this.roleService
      .GetList()
      .subscribe((res: RoleModel[]) => {
        this.roleListDto$.next(res);
      });
    this.subscriptions.push(sbRoleList);
  }

  loadRoleWidgetData(): void {
    const selectedRole = this.selectedRoleDto$.value;
    if (!selectedRole?.eid) {
      this.hierarchicalTreeData = [];
      return;
    }

    this.isLoading = true;
    
    this.roleWidgetService.GetRoleWidgetTreeListForAdmin(selectedRole)
      .subscribe({
        next: (response: RoleWidgetModel) => {
          if (response && response.widgetTreeListDto) {
            this.hierarchicalTreeData = this.mapToHierarchicalTreeData(response.widgetTreeListDto);
          } else {
            this.hierarchicalTreeData = [];
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Role widget data loading error:', error);
          this.hierarchicalTreeData = [];
          this.isLoading = false;
        }
      });
  }

  GetRoleWidgetListByRoleDto(roleDto: RoleModel) {
    // this.roleWidgetDto$.next(new RoleWidgetModel);
    // this.roleWidgetDto$.getValue().widgetListDto = [];
    // if (roleDto === undefined) { return; }
    // const sbRoleWidget = this.roleWidgetService.GetList(roleDto)
    //   .subscribe((res: RoleWidgetModel) => {
    //     this.roleWidgetDto$.next(res);
    //   }
    //   );
    // this.subscriptions.push(sbRoleWidget);
  }
  GetRoleWidgetTreeListForAdmin(roleDto: RoleModel) {
    this.roleWidgetDto$.next(new RoleWidgetModel());
    this.roleWidgetDto$.getValue().widgetListDto = [];

    if (roleDto === undefined) {
      return;
    }
    const sbRoleWidget = this.roleWidgetService
      .GetRoleWidgetTreeListForAdmin(roleDto)
      .subscribe((res: RoleWidgetModel) => {
        this.roleWidgetDto$.next(res);
        // RoleWidgetTree için veri hazırla (eğer gerekirse)
        // this.roleWidgetTreeData = this.mapToRoleWidgetTreeData(res.widgetTreeListDto || []);
      });
    this.subscriptions.push(sbRoleWidget);
  }

  // API verisini HierarchicalTreeNode formatına dönüştür
  mapToHierarchicalTreeData(apiData: TreeNode[]): HierarchicalTreeNode[] {
    return apiData.map(item => ({
      data: {
        ...item.data,
        // API'den gelen data'yı olduğu gibi kullan
      },
      expanded: item.expanded !== false, // Default true
      children: item.children ? this.mapToHierarchicalTreeData(item.children) : []
    }));
  }

  onRoleSelectionChange(selectedRole: RoleModel): void {
    if (selectedRole) {
      this.selectedRoleDto$ = new BehaviorSubject<RoleModel>(selectedRole);
      this.loadRoleWidgetData();
      
      // Eski metodları da çağır (backup için)
      this.GetRoleWidgetListByRoleDto(selectedRole);
      this.GetRoleWidgetTreeListForAdmin(selectedRole);
    } else {
      this.selectedRoleDto$ = new BehaviorSubject<RoleModel>(new RoleModel());
      this.hierarchicalTreeData = [];
    }
  }

  // Widget permission değiştiğinde çağrılır (HierarchicalTree'den gelen event)
  onItemPermissionChange(event: TreeItemChangeEvent): void {
    const { item, checked } = event;
    
    if (item && item.eid) {
      // WidgetModel formatına uygun data oluştur
      const widgetModel: WidgetModel = {
        name: item.name || '',
        eid: item.eid,
        selector: item.selector || '',
        orderNo: item.orderNo || 0,
        isRoleWidget: checked,
        pageDto: null
      };
      this.Set(widgetModel);
    }
  }

  // Page'deki tüm widget'ların permission'ını değiştir (HierarchicalTree'den gelen parent event)
  onParentPermissionChange(event: TreeItemChangeEvent): void {
    const { item, checked } = event;
    
    // Page seviyesindeki değişiklikleri de kaydet (eğer gerekirse)
  }

  nodeSelect(event: any) {
    if (event.node.parent === undefined && event.node.children.length > 0) {
      event.node.children.forEach((item: any) => {
        item.data.isRoleWidget = true;
        this.Set(item.data);
      });
    } else {
      let widgetDto = event.node.data as WidgetModel;
      widgetDto.isRoleWidget = true;
      this.Set(widgetDto);
    }

  }
  nodeUnselect(event: any) {
    // this.messageService.add({
    //   severity: 'info',
    //   summary: 'Node Selected',
    //   detail: event.node.label,
    // });

    if (event.node.parent === undefined && event.node.children.length > 0) {
      event.node.children.forEach((item: any) => {
        item.data.isRoleWidget = false;
        this.Set(item.data);
      });
    } else {
      let widgetDto = event.node.data as WidgetModel;
      widgetDto.isRoleWidget = false;
      this.Set(widgetDto);
    }

  }
  Set(widgetDto: WidgetModel) {
    // permissionDto.isModulePermission=!permissionDto.isModulePermission;
    let request = new RoleWidgetModel();
    request.widgetDto = widgetDto;
    request.roleDto = this.roleWidgetDto$.getValue().roleDto;

    this.roleWidgetDto$.getValue().widgetDto = widgetDto;
    // let widgetTreeListDto = this.roleWidgetDto$.getValue().widgetTreeListDto
    //  this.roleWidgetDto$.getValue().widgetTreeListDto = this.roleWidgetDto$.getValue().widgetTreeListDto;
    const sbSet = this.roleWidgetService
      .Set(request)
      .subscribe((res: RoleWidgetModel) => {
        // this.roleWidgetDto$.getValue().widgetTreeListDto = widgetTreeListDto;
        // this.selectedWidgets = this.roleWidgetDto$.getValue().widgetTreeListDto;
        // this.roleWidgetDto$.getValue().widgetTreeListDto = widgetTreeListDto;
      });
    this.subscriptions.push(sbSet);
  }
  getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key: any, value: any) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  };
  GoToRoleWidgetToRole() {
    this.router.navigate(['/super-admin/role/'], {});
  }

  // Modern template için tree yapısını düzenleyen metodlar
  getPageNodes(treeList: any[]): any[] {
    if (!treeList) return [];
    return treeList.filter(node => node.data && node.data.pageId === 0);
  }

  getWidgetNodes(pageNode: any): any[] {
    if (!pageNode || !pageNode.children) return [];
    return pageNode.children.filter((child: any) => child.data && child.data.pageId !== 0);
  }

  toggleWidgetPermission(widgetData: any): void {
    // Set metodunu çağır
    this.Set(widgetData);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sb) => sb.unsubscribe());
  }
}
