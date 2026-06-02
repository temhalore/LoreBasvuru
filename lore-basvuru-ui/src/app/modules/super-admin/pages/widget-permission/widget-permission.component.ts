import { BehaviorSubject, Observable } from 'rxjs';
/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PageService } from '../page/page.service';
import { WidgetPermissionService } from './widget-permission.service';
import { WidgetService } from '../widget/widget.service';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WidgetPermissionModel } from 'app/base/models/security/widget-permission/widget-permission.model';
import { WidgetModel } from 'app/base/models/security/widget/widget.model';
import { PageModel } from 'app/base/models/security/page/page.model';
import { PermissionModel } from 'app/base/models/security/permission/permission.model';
import { AuthService } from 'app/base/services/auth.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { MetaService } from 'app/core/services/meta.service';

// Shared components
import { ApiSelectInputComponent } from 'app/shared/components/form-controls/api-select-input/api-select-input.component';
import { ActionButtonComponent } from 'app/shared/components/action-button/action-button.component';

@Component({
  selector: 'app-page-widget-permission',
  templateUrl: './widget-permission.component.html',
  styleUrls: ['./widget-permission.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ApiSelectInputComponent,
    ActionButtonComponent
  ],
  providers: [WidgetPermissionService,WidgetService,PageService, SweetAlertService],
})
export class WidgetPermissionComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  formGroup: FormGroup;

  // Widget API properties
  widgetApiUrl: string = '';
  widgetApiParam: any = {};

  // Controller filtering properties
  availableControllers: string[] = [];
  selectedController: string = '';
  filteredPermissions: PermissionModel[] = [];

  widgetPermission$: BehaviorSubject<WidgetPermissionModel> =
    new BehaviorSubject<WidgetPermissionModel>(new WidgetPermissionModel());
  pageListDto$: BehaviorSubject<PageModel[]> = new BehaviorSubject<PageModel[]>(
    []
  );
  widgetListDto$: BehaviorSubject<WidgetModel[]> = new BehaviorSubject<
    WidgetModel[]
  >([]);

  selectedPageDto$: BehaviorSubject<PageModel>;
  selectedWidgetDto$: BehaviorSubject<WidgetModel>;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private metaService: MetaService,
    public readonly authService: AuthService,
    public readonly widgetPermissionService: WidgetPermissionService,
    public readonly widgetService: WidgetService,
    public readonly pageService: PageService
  ) {
    this.InitForm();

    const pageDto = this.router.getCurrentNavigation()?.extras?.state
      ?.pageDto as PageModel;
    if (pageDto !== undefined) {
      this.selectedPageDto$ = new BehaviorSubject<PageModel>(new PageModel());
      this.selectedPageDto$.next(pageDto);
      this.GetWidgetListByPageDto(pageDto);
    }
    const widgetDto = this.router.getCurrentNavigation()?.extras?.state?.widgetDto as WidgetModel;
    if (widgetDto !== undefined) {
      this.selectedWidgetDto$ = new BehaviorSubject<WidgetModel>(new WidgetModel());
      this.selectedWidgetDto$.next(widgetDto);
      this.GetWidgetPermissionByWidgetDto(widgetDto);
    }
  }

  ngOnInit() {
    // Sayfa meta bilgilerini ayarla
    this.metaService.setPageTitle('Widget Yetkileri');
    
    this.getPageList();
    
    // Page selection değişikliklerini dinle
    const pageControl = this.formGroup.get('page');
    if (pageControl) {
      const pageSubscription = pageControl.valueChanges.subscribe(pageValue => {
        if (!pageValue) {
          // Sayfa seçilmediğinde widget API'sini temizle
          this.widgetApiUrl = '';
          this.widgetApiParam = {};
          this.formGroup.get('widget')?.setValue(null);
          this.widgetListDto$.next([]);
          this.widgetPermission$.next(new WidgetPermissionModel());
          
          // Controller filtering'i de temizle
          this.selectedController = '';
          this.availableControllers = [];
          this.filteredPermissions = [];
        }
      });
      this.subscriptions.push(pageSubscription);
    }
  }

  getPageList(): void {
    // Page listesi API Select tarafından otomatik yüklenecek - hiçbir şey yapmamıza gerek yok
  }

  InitForm() {
    this.formGroup = this.fb.group({
      page: [null, [Validators.required]],
      widget: [null, [Validators.required]],
    });

  }
  LoadForm() {


    if(this.selectedPageDto$.getValue().eid !== null && this.selectedWidgetDto$.getValue().eid !== null) {
    this.formGroup.setValue({
      page:
        this.selectedPageDto$.getValue().eid !== null
          ? this.selectedPageDto$.getValue()
          : null,
      widget:
        this.selectedWidgetDto$.getValue().eid !== null
          ? this.selectedWidgetDto$.getValue()
          : null,
    });
  }
    // if (this.selectedPageDto$.getValue().eid !== undefined) {
    //   this.formGroup.value.page = this.selectedPageDto$.getValue();
    // }
    // if (this.selectedWidgetDto$.getValue().eid !== undefined) {
    //   this.formGroup.value.widget = this.selectedWidgetDto$.getValue();
    // }
  }

  // GetPageList() {
  //   const sbSet = this.pageService.GetList().subscribe((res: PageModel[]) => {
  //     this.pageListDto$.next(res);
  //   });
  //   this.subscriptions.push(sbSet);
  // }

  GetWidgetListByPageDto(pageDto: PageModel) {
    if (this.formGroup !== undefined) {
      this.formGroup.patchValue({ widget: null });
    }
    this.widgetListDto$.next([]);
    this.widgetPermission$.next(new WidgetPermissionModel());
    
    // Widget API URL ve parametresini temizle
    this.widgetApiUrl = '';
    this.widgetApiParam = {};
    
    if (pageDto === undefined) {
      return;
    }
    
    // Widget API URL ve parametresini set et
    this.widgetApiUrl = 'Security/Widget/GetListByPageDto';
    this.widgetApiParam = pageDto;
    
    // Eski yöntemle de widget listesini al (uyumluluk için)
    const sbWidgetList = this.widgetService
      .GetListByPageDto(pageDto)
      .subscribe((res: WidgetModel[]) => {
        this.widgetListDto$.next(res);
      });
    this.subscriptions.push(sbWidgetList);
  }

  GetWidgetPermissionByWidgetDto(widgetDto: WidgetModel) {
    // this.SetSelectedWidgetDto();
    this.widgetPermission$.next(new WidgetPermissionModel());
    // Reset controller filter
    this.selectedController = '';
    this.availableControllers = [];
    this.filteredPermissions = [];
    
    if (widgetDto === undefined) {
      return;
    }
    const sbWidgetePermission = this.widgetPermissionService
      .GetList(widgetDto)
      .subscribe((res: WidgetPermissionModel) => {
        this.widgetPermission$.next(res);
        // Set up controller filtering
        this.setupControllerFiltering(res.permissionListDto || []);
      });
    this.subscriptions.push(sbWidgetePermission);
  }
  Set(permissionDto: PermissionModel) {
    // permissionDto.isModulePermission=!permissionDto.isModulePermission;
    this.widgetPermission$.getValue().permissionDto = permissionDto;
    const sbModuleList = this.widgetPermissionService
      .Set(this.widgetPermission$.getValue())
      .subscribe((res: WidgetPermissionModel) => {});
    this.subscriptions.push(sbModuleList);
  }

  // Checkbox helper methods
  isAllSelected(): boolean {
    return this.filteredPermissions.length > 0 && this.filteredPermissions.every(p => p.isWidgetPermission);
  }

  isIndeterminate(): boolean {
    const selectedCount = this.filteredPermissions.filter(p => p.isWidgetPermission).length;
    return selectedCount > 0 && selectedCount < this.filteredPermissions.length;
  }

  toggleAllPermissions(checked: boolean): void {
    this.filteredPermissions.forEach(permission => {
      if (permission.isWidgetPermission !== checked) {
        permission.isWidgetPermission = checked;
        this.Set(permission);
      }
    });
  }

  // Controller filtering methods
  setupControllerFiltering(permissions: PermissionModel[]): void {
    // Extract unique controllers
    this.availableControllers = [...new Set(permissions.map(p => p.controller))]
      .filter(controller => controller && controller.trim() !== '')
      .sort();
    
    // Initialize filtered permissions with all permissions
    this.filteredPermissions = [...permissions];
  }

  onControllerFilterChange(selectedController: string): void {
    const allPermissions = this.widgetPermission$.getValue()?.permissionListDto || [];
    
    if (!selectedController || selectedController === '') {
      // Show all permissions
      this.filteredPermissions = [...allPermissions];
    } else {
      // Filter by selected controller
      this.filteredPermissions = allPermissions.filter(p => p.controller === selectedController);
    }
  }

  GoToWidgetPermissionToPageWidget() {
    this.router.navigate(['/super-admin/widget'], {
      state: { pageDto: this.selectedPageDto$.getValue() },
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sb) => sb.unsubscribe());
  }
}
