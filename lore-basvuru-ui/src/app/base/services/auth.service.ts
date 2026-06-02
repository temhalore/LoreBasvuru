import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LocalStorageService } from './local-storage.service';
import { HttpService } from './http.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { ServiceResponseModel } from '../models/general/service-response.model';
import { LoginResponseModel } from '../models/security/auth/login-response.model';
import { LoginWithSSORequestModel } from '../models/security/auth/login-with.sso.request.model';
import { PageModel } from '../models/security/page/page.model';
import { WidgetModel } from '../models/security/widget/widget.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject: BehaviorSubject<LoginResponseModel>;
  private isLoadingSubject: BehaviorSubject<boolean>;

  currentUser$: Observable<LoginResponseModel>;
  isLoading$: Observable<boolean>;

  constructor(private router: Router, private httpService: HttpService) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.currentUserSubject = new BehaviorSubject<LoginResponseModel>(
      LocalStorageService.getDecodedLocalStorageObject() ?? new LoginResponseModel()
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  get currentUserValue(): LoginResponseModel {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.currentUserValue?.kisiTokenDto?.isLogin === true;
  }

  get ekranListesi(): PageModel[] {
    return (this.currentUserValue?.ekranListDto ?? this.currentUserValue?.pageListDto) ?? [];
  }

  get widgetListesi(): WidgetModel[] {
    return this.currentUserValue?.widgetListDto ?? [];
  }

  /** Talend SSO token ile giriş */
  LoginWithToken(request: LoginWithSSORequestModel): Observable<LoginResponseModel> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Security/Auth/LoginWithToken', request).pipe(
      map((res: ServiceResponseModel) => {
        const response = res.data as LoginResponseModel;
        if (response?.kisiTokenDto?.isLogin) {
          this.currentUserSubject.next(response);
          LocalStorageService.setEncodedLocalStorageItem(response);
        }
        return response ?? new LoginResponseModel();
      }),
      catchError(err => { console.error(err); return of(new LoginResponseModel()); }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /** Kullanıcı adı / şifre ile giriş */
  Login(loginName: string, sifre: string): Observable<LoginResponseModel> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Security/Auth/Login', { loginName, sifre }).pipe(
      map((res: ServiceResponseModel) => {
        const response = res.data as LoginResponseModel;
        if (response?.kisiTokenDto?.isLogin) {
          this.currentUserSubject.next(response);
          LocalStorageService.setEncodedLocalStorageItem(response);
        }
        return response ?? new LoginResponseModel();
      }),
      catchError(err => { console.error(err); return of(new LoginResponseModel()); }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  Logout() {
    LocalStorageService.delEncodedLocalStorageItem();
    this.currentUserSubject.next(new LoginResponseModel());
    this.router.navigate([environment.loginUrl]);
  }

  /** Widget görünürlük kontrolü */
  widgetGorunur(widgetKodu: string): boolean {
    if (!this.isLoggedIn) return false;
    return this.widgetListesi.some(w =>
      w.widgetKodu === widgetKodu || w.selector === widgetKodu
    );
  }

  /** Ekran erişim kontrolü */
  ekranYetkisiVar(ekranYolu: string): boolean {
    if (!this.isLoggedIn) return false;
    return this.ekranListesi.some(e =>
      (e as any).ekranYolu === ekranYolu || e.routerLink === ekranYolu
    );
  }

  checkPageAccess(currentUrl: string): boolean {
    return this.ekranYetkisiVar(currentUrl);
  }

  checkWidgetAccess(selector: string): boolean {
    return this.widgetGorunur(selector);
  }
}
