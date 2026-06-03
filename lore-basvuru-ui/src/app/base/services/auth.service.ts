import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LocalStorageService } from './local-storage.service';
import { HttpService } from './http.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { ServiceResponseModel } from '../models/general/service-response.model';
import { LoginResponseModel } from '../models/security/auth/login-response.model';
import { KisiTokenModel } from '../models/security/auth/kisi-token.model';
import { PageModel } from '../models/security/page/page.model';
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
    return this.currentUserValue?.kisiTokenDto?.ekranDtoList ?? [];
  }

  get widgetKodlari(): string[] {
    return this.currentUserValue?.kisiTokenDto?.widgetKodlari ?? [];
  }

  /**
   * Kullanıcı adı / şifre ile giriş.
   * Backend: POST api/Auth/Login
   * Body: { kullaniciAdi, parola, tenantKod }
   * Response data: KisiTokenDTO (NOT wrapped in LoginResponseModel)
   */
  Login(kullaniciAdi: string, parola: string, tenantKod: string = ''): Observable<LoginResponseModel> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Auth/Login', { kullaniciAdi, parola, tenantKod }).pipe(
      map((res: ServiceResponseModel) => {
        const kisiTokenDto = res.data as KisiTokenModel;
        const loginResponse = new LoginResponseModel();
        loginResponse.kisiTokenDto = kisiTokenDto;

        if (kisiTokenDto?.isLogin) {
          this.currentUserSubject.next(loginResponse);
          LocalStorageService.setEncodedLocalStorageItem(loginResponse);
        }
        return loginResponse;
      }),
      // Login başarılıysa TokenDogrula ile ekranlar/widgetlar yükle
      switchMap((loginResponse: LoginResponseModel) => {
        if (!loginResponse?.kisiTokenDto?.isLogin) {
          return of(loginResponse);
        }
        return this.TokenDogrula().pipe(
          map(fullResponse => fullResponse),
          catchError(() => of(loginResponse)) // TokenDogrula başarısız olsa bile login'i geçir
        );
      }),
      catchError(err => { console.error('[AuthService] Login error:', err); return of(new LoginResponseModel()); }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Token doğrulama ve kullanıcı bilgilerini (ekranlar, widgetlar) yükle.
   * Backend: GET api/Auth/TokenDogrula
   * Header: Authorization: Bearer <appToken>  (HttpService otomatik ekler)
   */
  TokenDogrula(): Observable<LoginResponseModel> {
    return this.httpService.Get('Auth/TokenDogrula').pipe(
      map((res: ServiceResponseModel) => {
        const kisiTokenDto = res.data as KisiTokenModel;
        const loginResponse = new LoginResponseModel();
        loginResponse.kisiTokenDto = kisiTokenDto;

        this.currentUserSubject.next(loginResponse);
        LocalStorageService.setEncodedLocalStorageItem(loginResponse);
        return loginResponse;
      }),
      catchError(err => {
        console.error('[AuthService] TokenDogrula error:', err);
        this.Logout();
        return of(new LoginResponseModel());
      })
    );
  }

  /** SSO token ile giriş */
  LoginWithToken(token: string, tenantKod: string = ''): Observable<LoginResponseModel> {
    this.isLoadingSubject.next(true);
    return this.httpService.Post('Auth/SSOGiris', { token, tenantKod }).pipe(
      map((res: ServiceResponseModel) => {
        const kisiTokenDto = res.data as KisiTokenModel;
        const loginResponse = new LoginResponseModel();
        loginResponse.kisiTokenDto = kisiTokenDto;

        if (kisiTokenDto?.isLogin) {
          this.currentUserSubject.next(loginResponse);
          LocalStorageService.setEncodedLocalStorageItem(loginResponse);
        }
        return loginResponse;
      }),
      catchError(err => { console.error(err); return of(new LoginResponseModel()); }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  Logout(): void {
    // Backend'e logout bildirimi gönder (hata olsa da devam et)
    if (this.isLoggedIn) {
      this.httpService.Post('Auth/Logout', {}).pipe(
        catchError(() => of(null))
      ).subscribe();
    }
    LocalStorageService.delEncodedLocalStorageItem();
    this.currentUserSubject.next(new LoginResponseModel());
    this.router.navigate([environment.loginUrl]);
  }

  /** Widget görünürlük kontrolü — widgetKodlari string[] üzerinden */
  widgetGorunur(widgetKodu: string): boolean {
    if (!this.isLoggedIn) return false;
    return this.widgetKodlari.includes(widgetKodu);
  }

  /** Ekran erişim kontrolü — ekranDtoList'i recursive flatten edip yol kontrolü */
  ekranYetkisiVar(ekranYolu: string): boolean {
    if (!this.isLoggedIn) return false;
    return this._ekranYoluAra(this.ekranListesi, ekranYolu);
  }

  private _ekranYoluAra(ekranlar: PageModel[], yol: string): boolean {
    for (const ekran of ekranlar) {
      if (ekran.yol === yol) return true;
      if (ekran.altEkranlar?.length && this._ekranYoluAra(ekran.altEkranlar, yol)) return true;
    }
    return false;
  }

  checkPageAccess(currentUrl: string): boolean {
    return this.ekranYetkisiVar(currentUrl);
  }

  checkWidgetAccess(widgetKodu: string): boolean {
    return this.widgetGorunur(widgetKodu);
  }
}
