# 14 — Angular Mimarisi

## Proje Yapısı

```
lore-basvuru-ui/
├── src/
│   ├── app/
│   │   ├── core/                        # Singleton servisler, guard'lar, interceptor'lar
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── api.service.ts       # HTTP wrapper
│   │   │   │   └── storage.service.ts   # localStorage wrapper
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── admin.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── token.interceptor.ts
│   │   │   │   └── error.interceptor.ts
│   │   │   └── models/
│   │   │       ├── service-response.model.ts
│   │   │       ├── kullanici.model.ts
│   │   │       └── common.model.ts
│   │   ├── modules/
│   │   │   ├── auth/                    # Login, register, SSO
│   │   │   ├── admin/                   # Form builder, workflow, raporlama
│   │   │   │   ├── form-builder/
│   │   │   │   ├── workflow/
│   │   │   │   └── raporlama/
│   │   │   ├── basvuru/                 # Form doldurma (respondent)
│   │   │   │   ├── form-list/
│   │   │   │   ├── form-fill/
│   │   │   │   └── basvurularim/
│   │   │   └── shared/                  # Ortak bileşenler
│   │   │       ├── components/
│   │   │       └── pipes/
│   │   ├── app-routing.module.ts
│   │   └── app.module.ts
│   ├── assets/
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   └── index.html
├── angular.json
└── package.json
```

---

## Core Servisler

### ApiService

```typescript
// core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ServiceResponse } from '../models/service-response.model';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private storage: StorageService) {}

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<ServiceResponse<T>>(`${this.baseUrl}/${endpoint}`, {
      headers: this.getHeaders()
    }).pipe(
      map(res => this.handleResponse<T>(res)),
      catchError(err => throwError(() => err))
    );
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<ServiceResponse<T>>(`${this.baseUrl}/${endpoint}`, body, {
      headers: this.getHeaders()
    }).pipe(
      map(res => this.handleResponse<T>(res)),
      catchError(err => throwError(() => err))
    );
  }

  postFile(endpoint: string, formData: FormData): Observable<any> {
    // Dosya yüklemede Content-Type set etme (browser otomatik boundary koyar)
    const headers = new HttpHeaders({
      'appToken': this.storage.getToken() || '',
      'tenantKod': this.storage.getTenantKod() || ''
    });
    return this.http.post<ServiceResponse<any>>(`${this.baseUrl}/${endpoint}`, formData, {
      headers
    }).pipe(
      map(res => this.handleResponse<any>(res))
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<ServiceResponse<T>>(`${this.baseUrl}/${endpoint}`, {
      headers: this.getHeaders()
    }).pipe(
      map(res => this.handleResponse<T>(res))
    );
  }

  downloadFile(endpoint: string, body: any, filename: string): Observable<void> {
    return this.http.post(`${this.baseUrl}/${endpoint}`, body, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      map((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      })
    );
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'appToken': this.storage.getToken() || '',
      'tenantKod': this.storage.getTenantKod() || '',
      'language': 'tr'
    });
  }

  private handleResponse<T>(res: ServiceResponse<T>): T {
    if (!res.isSuccess) {
      throw { code: res.error_code, message: res.error_message || res.message };
    }
    return res.data;
  }
}
```

### AuthService

```typescript
// core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { KullaniciTokenModel } from '../models/kullanici.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private kullanici$ = new BehaviorSubject<KullaniciTokenModel | null>(null);

  get kullanici(): Observable<KullaniciTokenModel | null> {
    return this.kullanici$.asObservable();
  }

  get aktifKullanici(): KullaniciTokenModel | null {
    return this.kullanici$.value;
  }

  constructor(
    private api: ApiService,
    private storage: StorageService,
    private router: Router
  ) {
    // Sayfa yenilenince token'dan kullanıcıyı geri yükle
    const token = this.storage.getToken();
    if (token) {
      this.tokenDogrula(token).subscribe({
        error: () => this.cikisYap()
      });
    }
  }

  giris(kullaniciAdi: string, parola: string, tenantKod: string): Observable<KullaniciTokenModel> {
    return this.api.post<KullaniciTokenModel>('Auth/Giris', {
      kullaniciAdi, parola, tenantKod
    }).pipe(
      tap(data => this.oturumAc(data))
    );
  }

  ssoGiris(token: string, providerTip: number, tenantKod: string): Observable<KullaniciTokenModel> {
    return this.api.post<KullaniciTokenModel>('Auth/SSOGiris', {
      token, providerTip, tenantKod
    }).pipe(
      tap(data => this.oturumAc(data))
    );
  }

  tokenDogrula(token: string): Observable<KullaniciTokenModel> {
    return this.api.post<KullaniciTokenModel>('Auth/TokenDogrula', { value: token }).pipe(
      tap(data => {
        this.storage.setToken(data.token);
        this.kullanici$.next(data);
      })
    );
  }

  private oturumAc(data: KullaniciTokenModel): void {
    this.storage.setToken(data.token);
    this.kullanici$.next(data);
  }

  cikisYap(): void {
    if (this.storage.getToken()) {
      this.api.post('Auth/CikisYap', {}).subscribe();
    }
    this.storage.clear();
    this.kullanici$.next(null);
    this.router.navigate(['/giris']);
  }

  isAdmin(): boolean {
    return this.aktifKullanici?.kullaniciDto?.roller?.includes('Admin') ?? false;
  }

  isLoggedIn(): boolean {
    return !!this.aktifKullanici;
  }
}
```

### StorageService

```typescript
// core/services/storage.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private TOKEN_KEY = 'appToken';
  private TENANT_KEY = 'tenantKod';

  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }
  setToken(token: string): void { localStorage.setItem(this.TOKEN_KEY, token); }

  getTenantKod(): string | null { return localStorage.getItem(this.TENANT_KEY); }
  setTenantKod(kod: string): void { localStorage.setItem(this.TENANT_KEY, kod); }

  clear(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TENANT_KEY);
  }
}
```

---

## Guard'lar

```typescript
// core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.auth.isLoggedIn()) return true;
    this.router.navigate(['/giris']);
    return false;
  }
}

// core/guards/admin.guard.ts
@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.auth.isAdmin()) return true;
    this.router.navigate(['/yetkisiz']);
    return false;
  }
}
```

---

## Interceptor

```typescript
// core/interceptors/error.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.auth.cikisYap();
        }
        return throwError(() => error);
      })
    );
  }
}
```

---

## Routing

```typescript
// app-routing.module.ts
const routes: Routes = [
  { path: '', redirectTo: 'basvurular', pathMatch: 'full' },
  {
    path: 'giris',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'admin',
    canActivate: [AuthGuard, AdminGuard],
    loadChildren: () => import('./modules/admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: 'basvurular',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/basvuru/basvuru.module').then(m => m.BasvuruModule)
  },
  { path: '**', redirectTo: 'basvurular' }
];
```

---

## Form Builder Modülü

```typescript
// modules/admin/form-builder/form-builder.component.ts (özet)
@Component({
  selector: 'app-form-builder',
  template: `
    <div class="form-builder-container">
      <!-- Sol panel: Soru tipleri paleti -->
      <div class="question-palette" cdkDropList>
        <div *ngFor="let tip of soruTipleri"
             class="question-type-item"
             cdkDrag
             [cdkDragData]="tip">
          <i [class]="tip.ikon"></i>
          {{ tip.ad }}
        </div>
      </div>

      <!-- Orta: Form canvas -->
      <div class="form-canvas">
        <!-- Sayfalar -->
        <div *ngFor="let sayfa of sayfalar; let i = index" class="page-container">
          <div class="page-header">
            <input [(ngModel)]="sayfa.ad" (blur)="sayfaKaydet(sayfa)" />
            <button (click)="sayfaSil(sayfa)">Sil</button>
          </div>

          <!-- Sorular (drag-drop) -->
          <div cdkDropList
               [cdkDropListData]="sayfa.sorular"
               (cdkDropListDropped)="soruBirakti($event, sayfa)">
            <div *ngFor="let soru of sayfa.sorular"
                 cdkDrag
                 [cdkDragData]="soru"
                 class="question-item"
                 [class.selected]="seciliSoru?.id === soru.id"
                 (click)="soruSec(soru)">
              <span class="question-label">{{ soru.etiket || '(etiket yok)' }}</span>
              <span class="question-type-badge">{{ soruTipAd(soru.soruTipi) }}</span>
              <button (click)="soruSil(soru, $event)">×</button>
            </div>
          </div>

          <button (click)="soruEkle(sayfa)">+ Soru Ekle</button>
        </div>

        <button (click)="sayfaEkle()">+ Sayfa Ekle</button>
      </div>

      <!-- Sağ panel: Soru özellikleri -->
      <div class="question-properties" *ngIf="seciliSoru">
        <app-soru-ozellikleri
          [soru]="seciliSoru"
          (kaydet)="soruKaydet($event)">
        </app-soru-ozellikleri>
      </div>
    </div>
  `
})
export class FormBuilderComponent implements OnInit {
  form: BasvuruFormModel;
  sayfalar: SayfaModel[] = [];
  seciliSoru: SoruModel | null = null;
  soruTipleri = SORU_TIPLERI;

  constructor(
    private formBuildService: FormBuildService,
    private route: ActivatedRoute,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    const formEid = this.route.snapshot.paramMap.get('eid');
    if (formEid) {
      this.formYukle(formEid);
    }
  }

  soruBirakti(event: CdkDragDrop<SoruModel[]>, sayfa: SayfaModel): void {
    if (event.previousContainer === event.container) {
      // Aynı sayfa içinde sıra değişikliği
      moveItemInArray(sayfa.sorular, event.previousIndex, event.currentIndex);
      this.siraGuncelle(sayfa);
    } else if (event.previousContainer.data === this.soruTipleri) {
      // Palette'den sürüklendi → yeni soru
      const yeniSoru: SoruModel = {
        sayfaId: sayfa.id,
        soruTipi: event.item.data.tip,
        etiket: '',
        zorunluMu: false,
        siraNo: event.currentIndex
      };
      sayfa.sorular.splice(event.currentIndex, 0, yeniSoru);
      this.soruKaydet(yeniSoru);
    } else {
      // Farklı sayfaya taşı
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }
}
```

---

## Form Doldurma (Respondent) Modülü

```typescript
// modules/basvuru/form-fill/form-fill.component.ts (özet)
@Component({
  selector: 'app-form-fill',
  template: `
    <div class="form-fill-container" *ngIf="form">
      <!-- İlerleme çubuğu -->
      <div class="progress-bar">
        <div class="progress"
             [style.width.%]="(mevcutSayfaIndex / (sayfalar.length - 1)) * 100">
        </div>
      </div>

      <!-- Mevcut sayfa -->
      <div class="page-content" *ngIf="mevcutSayfa">
        <h2>{{ mevcutSayfa.ad }}</h2>

        <div *ngFor="let soru of goruntelenecekSorular(mevcutSayfa)">
          <app-dinamik-soru
            [soru]="soru"
            [deger]="cevaplar[soru.id]"
            (degerDegisti)="cevapDegisti(soru.id, $event)">
          </app-dinamik-soru>
        </div>
      </div>

      <!-- Navigasyon -->
      <div class="navigation">
        <button *ngIf="mevcutSayfaIndex > 0" (click)="oncekiSayfa()">← Geri</button>
        <button *ngIf="!sonSayfaMi" (click)="sonrakiSayfa()" [disabled]="yukleniyor">
          Devam →
        </button>
        <button *ngIf="sonSayfaMi" (click)="tamamla()" [disabled]="yukleniyor">
          Başvuruyu Tamamla ✓
        </button>
      </div>
    </div>
  `
})
export class FormFillComponent implements OnInit {
  form: BasvuruFormModel;
  sayfalar: SayfaModel[] = [];
  basvuruId: string;
  mevcutSayfaIndex = 0;
  cevaplar: Record<number, any> = {};
  kurallar: KuralModel[] = [];
  gizliSorular = new Set<number>();
  yukleniyor = false;

  get mevcutSayfa(): SayfaModel {
    return this.sayfalar[this.mevcutSayfaIndex];
  }

  get sonSayfaMi(): boolean {
    return this.mevcutSayfaIndex === this.sayfalar.length - 1;
  }

  cevapDegisti(soruId: number, deger: any): void {
    this.cevaplar[soruId] = deger;
    this.kurallariDegerlendir(soruId);
  }

  kurallariDegerlendir(tetikleyiciSoruId: number): void {
    const ilgiliKurallar = this.kurallar.filter(
      k => k.tetikleyiciSoruId === tetikleyiciSoruId
    );

    for (const kural of ilgiliKurallar) {
      const tetikleyiciDeger = this.cevaplar[kural.tetikleyiciSoruId];
      if (this.kosulSaglandimi(kural, tetikleyiciDeger)) {
        this.aksiyonUygula(kural.aksiyonlar);
      }
    }
  }

  private kosulSaglandimi(kural: KuralModel, deger: any): boolean {
    const json = JSON.parse(kural.kuralJson);
    const { operasyon, deger: beklenenDeger } = json.tetikleyici;

    switch (operasyon) {
      case 'equals': return String(deger) === String(beklenenDeger);
      case 'notEquals': return String(deger) !== String(beklenenDeger);
      case 'isEmpty': return !deger || deger === '';
      case 'isNotEmpty': return !!deger && deger !== '';
      case 'in': return beklenenDeger.split(',').includes(String(deger));
      case 'notIn': return !beklenenDeger.split(',').includes(String(deger));
      case 'greaterThan': return Number(deger) > Number(beklenenDeger);
      case 'lessThan': return Number(deger) < Number(beklenenDeger);
      default: return false;
    }
  }

  private aksiyonUygula(aksiyonlar: any[]): void {
    for (const aksiyon of aksiyonlar) {
      switch (aksiyon.tip) {
        case 'goster': this.gizliSorular.delete(aksiyon.hedefSoruId); break;
        case 'gizle': this.gizliSorular.add(aksiyon.hedefSoruId); break;
        case 'deger_set': this.cevaplar[aksiyon.hedefSoruId] = aksiyon.deger; break;
        case 'sayfaya_git':
          this.mevcutSayfaIndex = aksiyon.sayfaNo - 1;
          break;
      }
    }
  }

  goruntelenecekSorular(sayfa: SayfaModel): SoruModel[] {
    return sayfa.sorular.filter(s => !this.gizliSorular.has(s.id));
  }

  sonrakiSayfa(): void {
    this.cevaplariKaydet(() => {
      this.mevcutSayfaIndex++;
      window.scrollTo(0, 0);
    });
  }

  tamamla(): void {
    this.cevaplariKaydet(() => {
      this.basvuruService.tamamla(this.basvuruId).subscribe({
        next: () => this.router.navigate(['/basvurular/tesekkurler']),
        error: err => this.toast.error(err.message)
      });
    });
  }
}
```

---

## SSO Login Bileşeni

```typescript
// modules/auth/login/login.component.ts
@Component({
  selector: 'app-login',
  template: `
    <div class="login-container">
      <h2>Giriş Yap</h2>

      <!-- Normal giriş -->
      <form (ngSubmit)="normalGiris()">
        <input [(ngModel)]="form.kullaniciAdi" placeholder="E-posta" name="email" />
        <input [(ngModel)]="form.parola" type="password" placeholder="Şifre" name="parola" />
        <button type="submit" [disabled]="yukleniyor">Giriş</button>
      </form>

      <!-- SSO Provider'lar -->
      <div *ngIf="providerlar?.length" class="sso-divider">
        <span>veya şununla devam et</span>
      </div>

      <div class="sso-buttons">
        <button *ngFor="let provider of providerlar"
                (click)="ssoIleGiris(provider)"
                class="sso-btn">
          <img [src]="provider.logoUrl" [alt]="provider.providerAd" />
          {{ provider.providerAd }} ile Giriş
        </button>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  form = { kullaniciAdi: '', parola: '' };
  providerlar: LoginProviderModel[] = [];
  tenantKod: string;
  yukleniyor = false;

  ngOnInit(): void {
    this.tenantKod = this.route.snapshot.queryParamMap.get('tenant') || '';
    if (this.tenantKod) {
      this.authService.providerlarGetir(this.tenantKod).subscribe(
        data => this.providerlar = data
      );
    }
  }

  normalGiris(): void {
    this.yukleniyor = true;
    this.authService.giris(
      this.form.kullaniciAdi, this.form.parola, this.tenantKod
    ).subscribe({
      next: () => this.router.navigate(['/basvurular']),
      error: err => { this.toast.error(err.message); this.yukleniyor = false; }
    });
  }

  ssoIleGiris(provider: LoginProviderModel): void {
    switch (provider.providerTip) {
      case 2: // Google
        this.googleGiris();
        break;
      case 3: // e-Devlet
        this.eDevletGiris(provider);
        break;
      case 4: // Özel JWT
        this.ozelJwtGiris(provider);
        break;
    }
  }

  private googleGiris(): void {
    // Google Identity Services
    (window as any).google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => {
        this.authService.ssoGiris(response.credential, 2, this.tenantKod).subscribe({
          next: () => this.router.navigate(['/basvurular']),
          error: err => this.toast.error(err.message)
        });
      }
    });
    (window as any).google.accounts.id.prompt();
  }

  private eDevletGiris(provider: LoginProviderModel): void {
    // Backend'den e-Devlet yönlendirme URL'ini al ve yönlendir
    this.authService.eDevletUrlGetir(this.tenantKod).subscribe(url => {
      window.location.href = url;
    });
  }
}
```

---

## environment.ts

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/Api',
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID'
};

// environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: '/Api',  // IIS'te aynı origin — proxy gerekmiyor
  googleClientId: 'PROD_GOOGLE_CLIENT_ID'
};
```

---

## ServiceResponse Modeli

```typescript
// core/models/service-response.model.ts
export interface ServiceResponse<T> {
  isSuccess: boolean;
  data: T;
  message: string;
  error_message: string;
  error_code: number;
  dev_message: string;
}

// core/models/kullanici.model.ts
export interface KullaniciTokenModel {
  isLogin: boolean;
  token: string;
  tokenExpiry: string;
  kullaniciDto: KullaniciDTO;
}

export interface KullaniciDTO {
  id: string;      // eid
  ad: string;
  soyad: string;
  adSoyad: string;
  email: string;
  tenantId: number;
  roller: string[];
}
```

---

## package.json — Anahtar Bağımlılıklar

```json
{
  "dependencies": {
    "@angular/core": "^17.0.0",
    "@angular/cdk": "^17.0.0",        // drag-drop için
    "@angular/material": "^17.0.0",
    "ngx-toastr": "^18.0.0",
    "ngx-spinner": "^16.0.0",
    "rxjs": "~7.8.0"
  },
  "devDependencies": {
    "@angular/cli": "^17.0.0",
    "typescript": "~5.2.0"
  }
}
```

---

## Angular Build ve Deploy

```bash
# Development
ng serve --proxy-config proxy.conf.json

# Production build
ng build --configuration production --output-path dist/lore-basvuru-ui

# IIS'e deploy: dist/lore-basvuru-ui içeriği wwwroot'a kopyalanır
```

### proxy.conf.json (geliştirme)

```json
{
  "/Api": {
    "target": "http://localhost:5000",
    "secure": false,
    "changeOrigin": true
  }
}
```

### IIS — web.config (Angular SPA yönlendirme)

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Angular SPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```
