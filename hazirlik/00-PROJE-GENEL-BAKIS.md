# 00 — LoreBaşvuru: Proje Genel Bakış

## 🎯 Proje Amacı
Her kuruma ve firmaya satılabilecek, **tamamen dinamik ve konfigüre edilebilir** bir başvuru yönetim platformu.

Üniversite öğrenci başvurusundan şirket personel alımına, okul kayıtlarından burs başvurularına kadar her türlü başvuru süreci bu platform üzerinden yönetilebilir.

---

## 🏢 Hedef Kullanım Senaryoları
| Kurum Tipi | Kullanım |
|------------|---------|
| Üniversite | Öğrenci başvurusu, burs başvurusu, proje başvurusu |
| Şirket | Personel alımı başvurusu, staj başvurusu |
| K12 Okul | Öğrenci kayıt başvurusu |
| Kamu | Personel alımı, hibe başvurusu |
| Dernek/Vakıf | Üyelik başvurusu, destek başvurusu |

---

## ✅ Temel Özellikler

### 1. Dinamik Form Builder (Admin)
- Admin panelinde sürükle-bırak ile form tasarımı
- Sayfa bazlı form yapısı (wizard)
- Soru tipleri: Metin, Sayı, Tarih, Seçim (tek/çok), Dosya, Matris, Adres, vb.
- Seçim (combo) değerleri admin tarafından manuel girilebilir VEYA dış servisden çekilebilir (GET/POST)
- Dosya alanları için izin verilen uzantı/boyut kısıtlaması
- Alanlar arası göster/gizle kuralları (rule engine)
- Alan düzeyinde zorunluluk/validasyon kuralları

### 2. Çoklu Giriş Mekanizması
- **Kendi sistemi**: Username/password, SMS OTP, E-posta OTP
- **SSO — Google**: OAuth2 ile Google hesabı
- **SSO — e-Devlet**: TC Kimlik no bazlı e-Devlet kapısı entegrasyonu
- **SSO — Kuruma özel**: Herhangi bir OIDC/JWT sağlayıcı eklenebilir
- Her başvuru formu için hangi giriş yönteminin aktif olduğu admin tarafından seçilir
- Hem kayıtlı kullanıcı (login) hem de anonim (public) başvuru desteği

### 3. Başvuru Yönetimi
- Her başvuru için zaman aralığı ayarlanabilir (başlangıç/bitiş tarihi)
- Başvurular yayına alındığında otomatik aktif olur
- Geçmiş bir başvuruyu kopyalayarak yeni başvuru oluşturma
- Başvuru durum takibi: Taslak → Yayında → Tamamlandı → İptal

### 4. Çakışma Engeli (Cross-Application Linking)
- Birden fazla başvuru formu birbirine bağlanabilir
- Koşul: "Daha önce X başvurusuna katılmış olanlar Y'ye başvuramasın"
- Alan bazlı koşul: "X başvurusunda A alanı = B olan Y başvurusuna giremesin"
- `IN` veya `NOT IN` mantığı seçilebilir

### 5. Workflow & Onay Süreci
- Her form için özelleştirilebilir çok adımlı onay akışı
- Adım bazlı rol atamaları (kuruma özel)
- Onaylama/Red/İade seçenekleri
- Adım bazlı yorum/not ekleme
- E-posta/SMS bildirimleri (opsiyonel)

### 6. Rol & Yetki Yönetimi
- Başvuru düzeyinde rol tanımı
- Rol bazlı başvuru listesi filtreleme
- Alan bazlı erişim kısıtlaması (ör: sadece kendi birimindeki başvuruları görsün)
- Alan değeri bazlı dinamik rol ataması (ör: doğum tarihi < X olanları bu rol yönetsin)
- Kendi servislerinden çekilen alanlara rol filtresi bağlanabilir

### 7. Dış Servis Entegrasyonu
- Soru seçenekleri dış servisten GET veya POST ile çekilebilir
- Auth gerektiren dış servisler için token yönetimi
- Zaman aşımı ve hata yönetimi
- İsteğe bağlı caching (Redis)

### 8. Raporlama
- Başvuru sonuçları ekranı (admin)
- Kolonlar seçilebilir, filtreler uygulanabilir
- CSV export
- XML export
- PDF özet (opsiyonel)

### 9. Çok Kiracılı (Multi-Tenant) Yapı
- Tek veritabanı, TenantId ile izolasyon
- Her firma kendi başvurularını ve ayarlarını yönetir
- Gelecekte paket/abonelik sistemi eklenebilir

---

## 🔧 Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Backend API | .NET 8 Web API |
| ORM | Dapper + Dapper.Contrib (EF Core **değil**) |
| Veritabanı | SQL Server 2019+ veya PostgreSQL 15+ |
| Dosya Depolama | MinIO (S3 compatible) |
| Caching | Redis |
| Frontend | Angular 17+ (Standalone Components) |
| UI Library | PrimeNG |
| Loglama | Dosya bazlı (AppLogger) + Serilog altyapısı |
| Deployment | IIS (Windows Server) |
| Auth | Custom Token + JWT + SSO (OIDC) |

---

## 📋 Modüller (Kısa Özet)

```
LoreBaşvuru
├── 🔐 Güvenlik & Auth Modülü
│   ├── Kullanıcı yönetimi
│   ├── Rol yönetimi
│   ├── Token yönetimi
│   └── SSO entegrasyonları
├── 🏢 Tenant Modülü
│   ├── Firma/kurum yönetimi
│   ├── Paket/lisans yönetimi (gelecek faz)
│   └── Tenant ayarları
├── 📝 Form Builder Modülü
│   ├── Başvuru formu oluşturma/düzenleme
│   ├── Sayfa yönetimi
│   ├── Soru yönetimi
│   ├── Kural motoru
│   └── Form yayınlama/geri çekme
├── 🔄 Workflow Modülü
│   ├── Onay akışı tasarımı
│   ├── Adım/rol tanımları
│   └── Bildirim ayarları
├── 📬 Başvuru Modülü (Başvurucu tarafı)
│   ├── Başvuru listeleme/seçme
│   ├── Form doldurma (wizard)
│   ├── Dosya yükleme
│   └── Başvuru takip
├── 📊 Yönetim Modülü (Admin tarafı)
│   ├── Başvuru listesi
│   ├── Başvuru detayı
│   ├── Onay/red işlemleri
│   └── Raporlama & Export
└── ⚙️ Sistem Modülü
    ├── Dış servis tanımları
    ├── E-posta/SMS şablonları
    └── Sistem logları
```

---

## 📐 Kapsam Dışı (Bu sürümde yok)
- Ödeme/abonelik sistemi (gelecek faz için altyapı hazır olacak)
- Mobil uygulama
- Real-time bildirimler (SignalR)
- İleri analitik / BI dashboard
