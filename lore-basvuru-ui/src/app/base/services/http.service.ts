import { Injectable, Injector } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { LocalStorageService } from './local-storage.service';
import { ServiceResponseModel } from '../models/general/service-response.model';
import { environment } from '../../../environments/environment';
import { LoginResponseModel } from '../models/security/auth/login-response.model';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  API_URL = `${environment.apiUrl}`;
  appToken: string = '';
  language: string = 'tr';

  constructor(
    private http: HttpClient,
    private injector: Injector,
    private router: Router
  ) {}

  private getHeaders(isJson = true): HttpHeaders {
    const loginResponse: LoginResponseModel = LocalStorageService.getDecodedLocalStorageObject();
    const appToken = loginResponse?.kisiTokenDto?.appToken ?? '';
    const headers: any = {
      'appToken': appToken,
      'Authorization': appToken ? `Bearer ${appToken}` : '',
      'language': this.language
    };
    if (isJson) {
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = 'application/json';
    }
    return new HttpHeaders(headers);
  }

  Get<T>(ApiControllerAction: string): Observable<ServiceResponseModel> {
    return this.http.get<ServiceResponseModel>(
      this.API_URL + ApiControllerAction,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(err => this.errorHandler(err)),
      tap(x => this.handleResponse(x))
    );
  }

  Post<T>(ApiControllerAction: string, request: any): Observable<ServiceResponseModel> {
    return this.http.post<ServiceResponseModel>(
      this.API_URL + ApiControllerAction, request,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(err => this.errorHandler(err)),
      tap(x => this.handleResponse(x))
    );
  }

  PostFormData(ApiControllerAction: string, formData: FormData): Observable<ServiceResponseModel> {
    return this.http.post<ServiceResponseModel>(
      this.API_URL + ApiControllerAction, formData,
      { headers: this.getHeaders(false) }
    ).pipe(
      catchError(err => this.errorHandler(err)),
      tap(x => this.handleResponse(x))
    );
  }

  Delete(ApiControllerAction: string): Observable<ServiceResponseModel> {
    return this.http.delete<ServiceResponseModel>(
      this.API_URL + ApiControllerAction,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(err => this.errorHandler(err)),
      tap(x => this.handleResponse(x))
    );
  }

  PostBlob(ApiControllerAction: string, request: any): Observable<HttpResponse<Blob>> {
    const loginResponse: LoginResponseModel = LocalStorageService.getDecodedLocalStorageObject();
    const appToken = loginResponse?.kisiTokenDto?.appToken ?? '';
    return this.http.post(this.API_URL + ApiControllerAction, request, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json', 'appToken': appToken, 'language': this.language }),
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      catchError(err => this.errorHandler(err))
    ) as Observable<HttpResponse<Blob>>;
  }

  private handleResponse(x: ServiceResponseModel) {
    if (x?.isSuccess === false && x?.error_message) {
      this.showErrorToast(
        x.error_message.messageHeader || 'Hata',
        x.error_message.message || 'Bir hata oluştu'
      );
      if (x.error_message.code === 501 || x.error_message.code === 401) {
        setTimeout(() => {
          LocalStorageService.delEncodedLocalStorageItem();
          this.router.navigate([environment.loginUrl]);
        }, 2000);
      }
    }
  }

  private errorHandler(error: HttpErrorResponse) {
    if (error.status === 401) {
      LocalStorageService.delEncodedLocalStorageItem();
      this.router.navigate([environment.loginUrl]);
    } else {
      this.showErrorToast('Bağlantı Hatası', 'Sunucuya erişilemiyor.');
    }
    return throwError(() => error);
  }

  private showErrorToast(title: string, message: string) {
    if (typeof window === 'undefined') return;
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;top:20px;right:20px;padding:15px 20px;border-radius:6px;
      color:white;background:#f44336;font-family:Arial,sans-serif;font-size:14px;
      z-index:9999;min-width:300px;box-shadow:0 4px 6px rgba(0,0,0,.1);
      opacity:0;transform:translateX(100%);transition:all .3s ease;`;
    toast.innerHTML = `<div style="font-weight:bold;margin-bottom:4px">${title}</div><div>${message}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; }, 10);
    setTimeout(() => {
      toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.parentNode?.removeChild(toast), 300);
    }, 4000);
  }
}
