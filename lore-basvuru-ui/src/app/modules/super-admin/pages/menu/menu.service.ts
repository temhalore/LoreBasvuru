import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, map, Observable, of, Subscription, switchMap } from 'rxjs';
// import { TreeNode } from 'primeng/api';
import { HttpService } from 'app/base/services/http.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { MenuModel } from 'app/base/models/security/menu/menu.model';

@Injectable({ providedIn: 'root' })
export class MenuService {
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  constructor(
    private readonly httpService: HttpService,
    private readonly sweetAlertService: SweetAlertService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }
  // admin-menu-list
  // GetMenuTreeListForAdmin(): Observable<TreeNode[]> {
  //   this.isLoadingSubject.next(true);

  //   return this.httpService.Post('Security/Menu/GetMenuTreeListForAdmin', { Value: 0 }).pipe(
  //     switchMap((res: ServiceResponseModel) => {
  //       return of((res.data as TreeNode[]))
  //     }),
  //     finalize(() => this.isLoadingSubject.next(false))
  //   );
  // }

  GetList(): Observable<MenuModel[]> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Security/Menu/GetList', null).pipe(
      switchMap((res: ServiceResponseModel) => {
        return of((res.data as MenuModel[]))
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  // admin-menu-add
  Add(menuDto: MenuModel): Observable<string> {

    this.isLoadingSubject.next(true);
    return this.sweetAlertService.showSave<MenuModel>(menuDto.title, menuDto, "Security/Menu/Add", "")
      .pipe(
        switchMap((res) => {
          return of(res.data as string)
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );

  }
  // admin-menu-set
  Set(menuDto: MenuModel): Observable<string> {
    this.isLoadingSubject.next(true);
    return this.sweetAlertService.showSave<MenuModel>(menuDto.title, menuDto, "Security/Menu/Set", "")
      .pipe(
        switchMap((res) => {
          return of(res.data as string)
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }
  // admin-menu-del
  Del(menuDto: MenuModel): Observable<string> {

    this.isLoadingSubject.next(true);
    return this.sweetAlertService.showDelete<MenuModel>(menuDto.title, menuDto, "Security/Menu/Del",)
      .pipe(
        switchMap((res) => {
          return of(res.data as string)
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );

  }
  // admin-menu-moveup
  MoveUp(request: MenuModel) {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Security/Menu/MoveUp', request).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  // admin-menu-movedown
  MoveDown(request: MenuModel) {
    return this.httpService.Post('Security/Menu/MoveDown', request).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

}
