# İstanbul Üniversitesi Mobil Admin Panel

> **Proje Türü:** Angular 19+ Enterprise Admin Panel  
> **Amaç:** Üniversite mobil uygulamalarının yönetimi

---

## 🚀 Hızlı Komutlar

```bash
# Geliştirme
npm start                 # Dev server başlat (localhost:4200)
npm run build             # Development build
npm run build_prod        # Production build (dist/fuse)
npm run build_test        # Test ortamı build

# Test
npm test                  # Unit test (Karma + Jasmine)
```

---

## 📁 Proje Mimarisi

```
src/
├── @fuse/                    # Fuse Admin Template
│   ├── components/           # Alert, Card, Drawer, Navigation, Loading-bar
│   ├── services/             # Config, Confirmation, Loading, MediaWatcher, Platform
│   ├── directives/           # Scroll-reset, Scrollbar
│   ├── pipes/                # Find-by-key
│   ├── validators/           # Custom validators
│   └── styles/               # SCSS themes, Tailwind utilities
│
├── app/
│   ├── base/                 # 🔧 Altyapı Katmanı
│   │   ├── services/         # HttpService, AuthService, LocalStorage, SweetAlert
│   │   ├── models/           # BaseModel, ServiceResponseModel, Entity modelleri
│   │   ├── interceptors/     # HTTP interceptors
│   │   └── security/         # Guards (IsAuthGuard, IsAntiAuthGuard)
│   │
│   ├── core/                 # 🎯 Çekirdek Katman
│   │   ├── auth/             # Authentication logic
│   │   ├── navigation/       # Menü yapısı
│   │   ├── user/             # Kullanıcı servisleri
│   │   ├── error-handler/    # GlobalErrorHandler
│   │   └── transloco/        # i18n yükleyici
│   │
│   ├── shared/               # ♻️ Paylaşılan Bileşenler
│   │   ├── components/
│   │   │   ├── data-table/   # Gelişmiş veri tablosu
│   │   │   ├── form-controls/# Text, Select, Datepicker, OTP, Froala
│   │   │   ├── action-button/
│   │   │   ├── shared-button/
│   │   │   ├── tree-list/
│   │   │   └── json-viewer/
│   │   └── services/         # FormValidationService
│   │
│   ├── modules/              # 📦 Özellik Modülleri (Lazy-loaded)
│   │   ├── admin/            # Oturum yönetimi, işlem tabloları
│   │   ├── super-admin/      # Kullanıcı, rol, yetki, widget, menü
│   │   ├── auth/             # Login/Logout
│   │   ├── config/           # Uygulama konfigürasyonu
│   │   └── notifications/    # Bildirimler
│   │
│   └── layout/               # 🎨 Layout Varyantları
│       ├── classic/
│       ├── compact/
│       └── dense/
│
├── environments/             # Ortam konfigürasyonları
│   ├── environment.ts        # Development
│   ├── environment.test.ts   # Test
│   └── environment.prod.ts   # Production
│
└── styles/                   # Global stiller
```

---

## 🔑 Kritik Servisler ve Kullanımları

### HttpService (API İletişimi)
```typescript
// ✅ DOĞRU - HttpService kullan
constructor(private httpService: HttpService) {}

getData(): Observable<MyModel[]> {
    return this.httpService.Post<MyModel[]>('Controller/Action', { ...request }).pipe(
        map(response => {
            if (response.isSuccess) {
                return response.data;
            }
            return [];
        })
    );
}

// ❌ YANLIŞ - Doğrudan HttpClient kullanma
constructor(private http: HttpClient) {} // ASLA!
```

### FormValidationService
```typescript
if (this.formValidationService.isFormValid(this.myForm)) {
    // Kaydet
} else {
    this.formValidationService.markAllFieldsAsTouched(this.myForm);
}
```

### Model Yapısı
```typescript
// Tüm entity modelleri BaseModel'den türetilmeli
export class User extends BaseModel {
    name: string;
    email: string;
}
```

---

## 🎨 UI Bileşen Hiyerarşisi

Yeni UI oluştururken bu öncelik sırasını takip et:

| Öncelik | Kaynak | Örnek Bileşenler |
|---------|--------|------------------|
| 1️⃣ | `shared/components/` | `app-data-table`, `app-action-button`, form kontrolleri |
| 2️⃣ | `@fuse/components/` | `fuse-alert`, `fuse-card`, `fuse-drawer` |
| 3️⃣ | Angular Material | `mat-button`, `mat-input`, `mat-select` |
| 4️⃣ | HTML + Tailwind | Son çare olarak native HTML |

### Shared Form Kontrolleri
- `app-text-input`
- `app-select-input`
- `app-api-select-input`
- `app-code-select-input`
- `app-datepicker-input`
- `app-checkbox-input`
- `app-textarea-input`
- `app-froala-textarea-input`
- `app-otp-input`
- `app-tag-input`

---

## 📋 Kod Standartları

### İsimlendirme
| Tip | Format | Örnek |
|-----|--------|-------|
| Dosya | `kebab-case` | `user-profile.component.ts` |
| Sınıf | `PascalCase` | `UserProfileComponent` |
| Değişken/Fonksiyon | `camelCase` | `getUserData()`, `isLoading` |
| Sabit | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Observable | `camelCase$` | `users$`, `loading$` |

### Component Yapısı
```typescript
@Component({
    selector: 'app-my-component',
    standalone: true,                           // ✅ Standalone zorunlu
    changeDetection: ChangeDetectionStrategy.OnPush, // ✅ OnPush tercih et
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './my-component.component.html',
    styleUrls: ['./my-component.component.scss']
})
export class MyComponent {
    // Reactive Forms kullan
    form = new FormGroup({
        name: new FormControl('', Validators.required)
    });
}
```

---

## 🚫 Yasaklar (Kırmızı Çizgiler)

| ❌ Yapma | ✅ Yap |
|----------|--------|
| `any` tipi kullanma | Açık tip tanımla |
| `HttpClient` direkt kullan | `HttpService.Post<T>()` kullan |
| Hard-coded URL/config | `environment.ts` kullan |
| Template-driven forms | Reactive Forms kullan |
| Manuel tablo HTML | `app-data-table` kullan |
| `I` prefix (IUser) | Prefix'siz model (User) |
| `.spec.ts` oluştur | Kullanıcı istemezse oluşturma |

---

## 🔧 Teknoloji Yığını

| Kategori | Teknoloji | Versiyon |
|----------|-----------|----------|
| Framework | Angular | 19.0.5 |
| UI Library | Angular Material | 19.0.4 |
| CSS Framework | Tailwind CSS | 3.4.17 |
| Template | Fuse Admin | - |
| i18n | Transloco | 7.5.1 |
| State | RxJS | 7.8.1 |
| Charts | ApexCharts | 4.3.0 |
| Rich Text | Froala / Quill | 4.6.2 / 2.0.3 |
| Date | Luxon | 3.5.0 |
| Crypto | CryptoJS | 4.2.0 |
| Alerts | SweetAlert2 | 11.22.5 |

---

## 🌐 Ortam Değişkenleri

```typescript
// environment.ts yapısı
export const environment = {
    production: false,
    apiUrl: 'https://localhost:7085/Api/',
    loginUrl: 'https://giris.istanbul.edu.tr/...',
    appName: 'Web Mobil Admin',
    // ...
};
```

---

## 📝 Routing Yapısı

- **Hash-based routing** (IIS uyumluluğu için `HashLocationStrategy`)
- **Lazy loading** ile modül yükleme
- **Guards:** `IsAuthGuard`, `IsAntiAuthGuard`
- **Resolvers:** Veri ön yükleme için

```typescript
// Örnek lazy-load route
{
    path: 'admin',
    loadChildren: () => import('app/modules/admin/admin.routes'),
    canActivate: [IsAuthGuard]
}
```

---

## 🎯 Geliştirme Kontrol Listesi

Yeni özellik geliştirirken:

- [ ] Standalone component mi?
- [ ] OnPush change detection eklendi mi?
- [ ] HttpService kullanıldı mı?
- [ ] Reactive Forms kullanıldı mı?
- [ ] Shared bileşenler kontrol edildi mi?
- [ ] ServiceResponseModel.isSuccess kontrol ediliyor mu?
- [ ] Environment değişkenleri hard-coded değil mi?
- [ ] Model BaseModel'den türetildi mi?

---

## 🏛️ EtikKurul Domain Bilgisi

### Projenin Amacı
İstanbul Üniversitesi Etik Kurul Başvuru Sistemi — 3 farklı etik kurul için dijital başvuru, yönetim ve raporlama platformu.

### 3 Etik Kurul
| Kısa Ad | Tam Ad |
|---------|--------|
| **HADYEK** | Hayvan Deneyleri Yerel Etik Kurulu |
| **SBBEK** | Sosyal ve Beşeri Bilimler Araştırma Etik Kurulu |
| **SOÇDEK** | Sucul Omurgalı Canlı Deneyleri Yerel Etik Kurulu |

### Kullanıcı Tipleri
- **Kurum Dışı Başvurucu** — E-posta/şifre ile kayıt, profil doldurma, başvuru yapma
- **Kurum İçi Başvurucu** — SSO ile giriş, başvuru yapma
- **Sekreter** — Soru motoru yönetimi, yetkilendirme, teslim alındı, kullanıcı doğrulama
- **Başkan** — Başvuruları görüntüleme, rapor okuma
- **Raportör** — Rapor hazırlama, PDF üretimi

---

## 📺 Ekranlar ve Route Eşlemesi

### Mevcut (güncellenecek)
| Route | Component | Notlar |
|-------|-----------|--------|
| `/auth/sign-in` | SignInComponent | SSO butonu + Kurum Dışı form + Captcha eklenecek |
| `/auth/sign-out` | SignOutComponent | Mevcut yeterli |

### Yeni Oluşturulacak Modüller

```
src/app/modules/etikkurul/
├── pages/
│   ├── profil/                     # /profil
│   ├── etik-kurul-secimi/          # /etik-kurul-secimi
│   ├── basvuru-islemleri/          # /basvuru-islemleri
│   │   ├── list/                   # Başvuru listesi
│   │   ├── form/                   # Dinamik başvuru formu (yeni/güncelle)
│   ├── tum-basvurular/             # /tum-basvurular (Sekreter/Başkan)
│   ├── raportör/                   # /raportör/:eid
│   ├── yetkilendirme/              # /yetkilendirme (Sekreter)
│   ├── kullanici-listesi/          # /kullanici-listesi (Sekreter)
│   └── soru-bankasi/               # /soru-bankasi (Sekreter)
│       ├── soru-yonetimi/          # Sol panel: Soru Ekle/Güncelle
│       └── basvuru-onizleme/       # Sağ panel: Dinamik form önizleme
├── components/
│   ├── captcha/                    # 5-6 haneli güvenlik kodu bileşeni
│   ├── dinamik-form/               # Soru tipine göre form render motoru
│   ├── teslim-alindi-modal/        # Teslim alındı popup
│   └── raportör-atama-modal/       # Raportör atama popup
├── models/
│   ├── etik-kurul.model.ts
│   ├── soru.model.ts               # QuestionType, QuestionRules, QuestionCondition
│   ├── basvuru.model.ts
│   └── raportör-rapor.model.ts
└── services/
    ├── etik-kurul.service.ts
    ├── soru-motoru.service.ts
    ├── basvuru.service.ts
    ├── tum-basvurular.service.ts
    ├── raportör.service.ts
    ├── yetkilendirme.service.ts
    └── kullanici.service.ts
```

### Yeni Auth Sayfaları (auth modülüne eklenecek)
| Route | Component | Açıklama |
|-------|-----------|----------|
| `/auth/register` | RegisterComponent | E-posta, şifre, captcha |
| `/auth/forgot-password` | ForgotPasswordComponent | E-posta + captcha |
| `/auth/verify-email` | VerifyEmailComponent | Token ile e-posta doğrulama |
| `/auth/reset-password` | ResetPasswordComponent | Yeni şifre belirleme |

---

## 🎯 Kritik: Dinamik Form Engine

Soru Bankası ve Başvuru formu için dinamik render sistemi:

```typescript
// Soru tipleri
type QuestionType =
  'section' | 'text' | 'number' | 'date' | 'file' |
  'single' | 'multi' | 'checkbox' | 'info' | 'table';

// Kural motoru (JSON format - backend'den gelir)
interface QuestionRules {
  numericOnly?: boolean;       // Sadece sayısal giriş
  minLen?: number;             // Minimum karakter uzunluğu
  minDaysFromToday?: number;   // Bugünden en az X gün sonrası
  visibleIf?: string;          // "q_123=evet" formatında koşullu görünürlük
  requiredIf?: string;         // Koşullu zorunluluk
  lockIf?: string;             // Koşullu kilitleme
}

// Koşullu alt soru ilişkisi
interface QuestionCondition {
  triggerValue: string;        // Bu değer seçilince
  childQuestionId: string;     // Bu soru görünür olur
}
```

**Form Engine Davranışları:**
- `section` tipi sorular akordiyon başlığı olarak render edilir
- `dependsOn` varsa ve bağımlı soru boşsa → disabled
- `visibleIf` koşulu sağlanmıyorsa → DOM'dan kaldırılır (sadece gizlenme değil)
- Cevap değişince `visibleIf`/`lockIf`/`requiredIf` koşulları yeniden değerlenir
- Sürükle-bırak için Angular CDK DragDrop kullanılır

---

## 📋 Login Ekranı Güncellemeleri

Mevcut `sign-in.component` üzerine eklenmesi gerekenler:

```
Sol Alan:   Hero görsel (T.C. İstanbul Üniversitesi / Etik Kurul Başvuru Sistemi)
Sağ Alan:   2 bölüm
  ├── Kurum Dışı Personel
  │   ├── E-posta (email input)
  │   ├── Şifre (password input)
  │   ├── Beni Hatırla (checkbox)
  │   ├── Captcha (app-captcha bileşeni)
  │   ├── Giriş Yap butonu
  │   ├── Parolamı Unuttum linki
  │   └── Hesap Oluştur butonu
  └── Kurum İçi Personel
      └── Personel Girişi butonu (SSO)
```

---

## 🎨 Başvuru Durum Renklendirmesi

| Durum | Renk | Kullanım |
|-------|------|----------|
| Yeni Başvuru (eksik) | Kırmızı etiket | Başvuru listesi |
| Düzeltme (tamamlandı) | Yeşil etiket | Başvuru listesi |
| Gönderilmiş | Sarı etiket | Başvuru listesi |
| Teslim Alındı | Yeşil satır arka planı | Tüm Başvurular |
| Eksik Profil | Sarı satır arka planı | Kullanıcı Listesi |
| Doğrulama Bekliyor | ⚠ ikon + hafif vurgu | Kullanıcı Listesi |
