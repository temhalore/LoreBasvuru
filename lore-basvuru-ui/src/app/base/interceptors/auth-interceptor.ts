import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor() {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const loginResponse = LocalStorageService.getDecodedLocalStorageObject();
        const appToken = loginResponse?.kisiTokenDto?.appToken ?? '';
        const language = 'tr';

        // Sadece API isteklerine Authorization header ekle
        if (req.url.includes('/api/')) {
            const clonedRequest = req.clone({
                setHeaders: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'appToken': appToken,
                    'Authorization': appToken ? `Bearer ${appToken}` : '',
                    'language': language,
                }
            });
            return next.handle(clonedRequest);
        }

        return next.handle(req);
    }
}
