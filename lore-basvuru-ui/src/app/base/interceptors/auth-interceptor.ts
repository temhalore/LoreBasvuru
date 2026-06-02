import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Token bilgilerini LocalStorage'dan al
     const loginResponse = LocalStorageService.getDecodedLocalStorageObject();
    let selectedEtikKurulEid = '';

    if (!this.isOnlyBasvurucuRole(loginResponse)) {
      selectedEtikKurulEid = LocalStorageService.getSelectedEtikKurulEid();

      if (!selectedEtikKurulEid) {
        selectedEtikKurulEid =
          loginResponse?.kisiTokenDto?.kisiDto?.etikKurulRoleListDto?.[0]?.etikKurulDto?.eid ?? '';

        if (selectedEtikKurulEid) {
          LocalStorageService.setSelectedEtikKurulEid(selectedEtikKurulEid);
        }
      }
    } else {
      LocalStorageService.setSelectedEtikKurulEid('');
    }

    const appToken = loginResponse?.kisiTokenDto?.appToken || '';
    const language = loginResponse?.kisiTokenDto?.language || 'tr';

    // Sadece API isteklerine header ekle
    if (req.url.includes('/api/')) {
      const clonedRequest = req.clone({
        setHeaders: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'appToken': appToken,
          'language': language,
          'etikKurul': selectedEtikKurulEid || ''
        }
      });
      return next.handle(clonedRequest);
    }
    // Diğer isteklerde header ekleme
    return next.handle(req);
  }

  private isOnlyBasvurucuRole(loginResponse: any): boolean {
    const roleList = loginResponse?.kisiTokenDto?.kisiDto?.etikKurulRoleListDto ?? [];
    const hasBasvurucuRole = roleList.some((x: any) => !!x?.isBasvurucu);
    const hasNonBasvurucuRole = roleList.some(
      (x: any) => !!x?.isSekreter || !!x?.isBaskan || !!x?.isRaportor || !!x?.isUye || !!x?.isSuperAdmin
    );

    if (roleList.length > 0) {
      return hasBasvurucuRole && !hasNonBasvurucuRole;
    }

    const userTypes = loginResponse?.kisiTokenDto?.userTypes ?? [];
    const normalizedTypes = userTypes.map((x: string) => x?.toLocaleLowerCase('tr-TR') ?? '');
    const hasBasvurucuType = normalizedTypes.some((x: string) => x.includes('basvur') || x.includes('başvur'));
    const hasNonBasvurucuType = normalizedTypes.some(
      (x: string) =>
        x.includes('sekreter') ||
        x.includes('baskan') ||
        x.includes('başkan') ||
        x.includes('raportor') ||
        x.includes('raportör') ||
        x.includes('uye') ||
        x.includes('üye') ||
        x.includes('admin')
    );

    return hasBasvurucuType && !hasNonBasvurucuType;
  }
}
