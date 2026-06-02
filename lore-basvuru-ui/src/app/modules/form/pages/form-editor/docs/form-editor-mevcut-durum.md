# Form Editor Mevcut Durum

Bu belge, `src/app/modules/form/pages/form-editor` modülünün bugünkü çalışan
durumunu tek yerde toplar. Eski plan, review ve session notları bu dosya ile
supersede edilmiştir.

## Kapsam

Bu özet doğrudan mevcut frontend kodundan çıkarılmıştır. Ana kaynaklar:

- `form-editor.component.{ts,html}`
- `form-editor-panel.config.ts`
- `services/form-editor-store.service.ts`
- `services/form-editor-persistence-coordinator.service.ts`
- `services/form-editor-panel-state.service.ts`
- `services/form-editor-validation.orchestrator.ts`
- `components/form-editor-canvas/*`
- `components/form-editor-structure-tree/*`
- `components/form-editor-palette/*`
- `components/question-editor-host/*`
- `components/question-editors/question-editor-outlet/*`
- `components/question-editors/question-validation-editor-outlet/*`

## Kısa Özet

Form editor bugün üç ana eksen etrafında çalışır:

- Shell + store tabanlı tek sayfa editör akışı
- Canvas içinde inline soru düzenleme ve inline validasyon surface'leri
- Sol/sağ panelin generic chrome + içerik component'leri olarak ayrıştırılması

Modül artık büyük ölçüde store-owned state ile çalışır. Soru içerik düzenleme,
sayfa düzenleme, validasyon düzenleme, panel açık/kapalı durumu ve tekrarli grup
workspace stack'i birbirinden ayrılmıştır.

## Üst Seviye Mimari

### Shell

`FormEditorComponent` route-scoped shell'dir.

Sorumlulukları:

- route `eid` alıp store'u başlatmak
- shell view-model'ini store selector'larından birleştirmek
- header, canvas ve paneller arasındaki event akışını bağlamak
- panel içerik template'lerini seçmek

Shell doğrudan domain mantığı taşımaz; çoğu işlem store veya yardımcı servislere
delege edilir.

### Store

`FormEditorStoreService` modülün ana state holder'ıdır.

Tuttuğu ana state alanları:

- yüklü form taslağı
- diagnostics
- seçili node
- aktif soru surface'i
- soru draft'ı
- sayfa edit draft'ı
- validasyon session'ı
- validasyon editor config'i
- aktif sayfa
- loading / saving / error alanları
- workspace stack

Store aynı zamanda kullanıcı aksiyonlarının ana orkestrasyon noktasıdır:

- node seçimi
- soru edit surface açma/kapama
- sayfa edit begin/patch/commit/cancel
- soru draft save
- validasyon session save
- soru ekleme
- soru ve sayfa sıralama
- tekrarli grup workspace açma/geri dönme

### Yardımcı servisler

`FormEditorPersistenceCoordinatorService`

- document save pipeline'ının tek sahibidir
- `hasPendingChanges`, `isSaving`, `saveError`, `lastSavedAt` gibi alanları üretir
- document save ile draft/reorder op'larının aynı anda yarışmasını engeller
- preview öncesi `flush()` ile kalıcı yazımı settle eder

`FormEditorPanelStateService`

- sol/sağ panel açık-kapalı durumu
- aktif tab
- structure tree collapse state'i
- selection sonrası reveal/scroll orkestrasyonu

`FormEditorValidationOrchestratorService`

- validation editor config yükleme
- soru bazlı validasyon kuralları yükleme
- validasyon session'ını tek `TopluKaydet` çağrısıyla commit etme

`FormBuildApiService`

- form taslağı yükleme/kaydetme
- sayfa oluşturma
- soru draft oluşturma/kaydetme
- soru sıralama
- taslak doğrulama
- publish

## UI Yapısı

### Sol panel

Sol panel generic `FormEditorPanelComponent` chrome'u üzerinde çalışır.

Bugün görünen tek sol tab:

- `structure`

İçerik component'i:

- `FormEditorStructureTreeComponent`

Structure tree presentationaldır; collapse state'i component içinde tutulmaz.
State, `FormEditorPanelStateService` üzerinden gelir.

Öne çıkan davranışlar:

- sayfa ve soru sayıları hesaplanır
- selected node ve active page ayrı vurgulanır
- collapse/expand state route ömrü boyunca korunur
- selection değişince servis ilgili ataları açıp reveal tetikler

### Sağ panel

Sağ panel tab sistemi `form-editor-panel.config.ts` içindeki registry ile yönetilir.

Bugün görünür sağ tablar:

- `add`
- `library`
- `conditions`
- `diagnostics`

Bugün gerçekten implement edilen içerikler:

- `add` -> `FormEditorPaletteComponent`
- `diagnostics` -> `FormEditorDiagnosticsComponent`

Bugün placeholder kalan görünür tablar:

- `library`
- `conditions`

Bugün config'te tanımlı ama gizli/kapalı tablar:

- `general`
- `validation`
- `view`
- `advanced`
- `effects`

Önemli ayrım:

- Sağ panelde `validation` tabı açık değildir.
- Soru validasyon düzenleme bugün sağ panelde değil, soru kartı içindeki inline
  surface olarak çalışır.

### Canvas

`FormEditorCanvasComponent` ana çalışma alanıdır.

Bugünkü görevleri:

- aktif sayfayı render etmek
- sayfa geçiş animasyonunu yönetmek
- soru listelerini `cdkDropList` ile sunmak
- soru kartı aksiyonlarını host etmek
- sayfa edit yüzeyini göstermek
- tekrarli grup alt soru workspace pencerelerini göstermek
- seçili node'u görünür alanda scroll ile merkeze almak

Canvas iki mod arasında çalışır:

- root page workspace
- group workspace

### Group workspace

Tekrarli grup veya çocuk sorusu olan container'larda `edit-children` aksiyonu ile
ayrı bir alt soru workspace açılır.

Bugünkü davranış:

- store `workspaceStack` içine container eid push eder
- canvas breadcrumb'lı ayrı bir group window açar
- root page görünümü muted kalır
- aktif child workspace içinde soru listesi ayrı drop list olarak çalışır
- geri aksiyonu bir seviye pop eder

`workspace-stack.util.ts` ile:

- seçim değişince stack daraltılır veya sıfırlanır
- form değişince artık var olmayan container'lar stack'ten düşer

## Soru Kartı ve Surface Modeli

`QuestionEditorHostComponent` soru kartının ana container'ıdır.

Aksiyon modeli:

- `edit-content`
- `edit-validation`
- `edit-children`

Surface modeli:

- `content`
- `validation`

Kurallar:

- aynı anda bir soruda tek surface açık kalır
- `edit-children` yalnız çocuk sorusu olan kartlarda görünür
- edit açıkken widget preview yerine ilgili outlet render edilir
- edit bileşenleri `@defer` ile lazy yüklenir

## İçerik Düzenleme

`QuestionEditorOutletComponent` soru içerik editörüdür.

Bugünkü özellikler:

- form factory ile question draft'tan reactive form üretir
- dirty bilgisini dışarı verir
- kaydettiğinde yetkili draft modeli geri üretir
- iptalde discard confirm gösterir

Soru tipi bazlı davranışlar:

- seçimli sorular için option editor
- matris soruları için matrix editor
- ölçek/derecelendirme için scale alanları
- açıklama sorularında gereksiz alanlar temizlenir

Kaydetme sınırı:

- outlet doğrudan API çağrısı yapmaz
- shell/store üzerinden `saveQuestionDraft` akışına gider

## Sayfa Düzenleme

Sayfa düzenleme canvas içinde inline yapılır.

Akış:

- `beginPageEdit`
- `patchPageEditDraft`
- `commitPageEdit`
- `cancelPageEdit`

Özellikler:

- sayfa başlık ve açıklaması local draft olarak tutulur
- değişiklik yoksa commit no-op olur
- commit, working copy'yi günceller ve document save pipeline'a bırakır
- cancel'de dirty ise confirm gösterilir

## Palette ve Soru Ekleme

`FormEditorPaletteComponent` saf presentational içeriktir.

Bugünkü davranış:

- palette item'ları gruplar
- aktif item'lar tıklanabilir ve drag edilebilir
- `connectedTo` listesi shell/store tarafından verilir
- canvas'a drag ile veya tıkla-ekle akışıyla soru oluşturulabilir

Drop hedefi:

- root modda aktif sayfa
- group workspace modunda aktif container

## Validasyon Düzenleme

`QuestionValidationEditorOutletComponent` soru bazlı inline validasyon editörüdür.

Bugünkü giriş verileri:

- `question`
- `session`
- `editorConfig`
- `isLoading`
- `isSaving`
- `error`

Bugünkü akış:

1. Store aktif surface'i `validation` yapar.
2. Store `forkJoin` ile editor config ve mevcut kuralları parallel yükler.
3. Outlet gelen session üzerinde local düzenleme yapar.
4. Kaydetmede outlet session'ı store'a emit eder.
5. Store orchestrator üzerinden `TopluKaydet` çağırır.
6. Başarılıysa normalized kural listesi tekrar session'a yazılır ve surface kapanır.

Outlet içi önemli davranışlar:

- soru tipi desteklenmiyorsa unsupported state gösterir
- kural listesi aktif/pasif birlikte render edilir
- yeni kural local draft eid ile açılır
- koşul satırları editor config'e göre gösterilir/temizlenir
- koşulsuz save engellenir
- form dirty iken kural değiştirirken discard confirm vardır

Bugünkü backend bağımlılıkları:

- `GetKuralEditorConfig`
- `GetValidasyonBySoruKokId`
- `TopluKaydet`

## Save ve Doğrulama Modeli

Modülde iki farklı persistence sınırı vardır:

- document save
- op bazlı save

### Document save

Document save şunları kapsar:

- form başlığı
- sayfa başlığı/açıklaması
- soru sıralama gibi working-copy üstünden document'i etkileyen değişiklikler

Özellikler:

- debounce'lu queue yapısı vardır
- revision takibi ile stale response etkisi daraltılır
- hata olursa dirty state korunur
- retry mümkündür

### Op bazlı save

Ayrı boundary kullanan işlemler:

- soru draft kaydı
- validasyon toplu kaydı
- bazı create/reorder akışları

Koordinatör kuralı:

- op başlamadan önce gerekirse document save settle edilir
- op sürerken document save başlamaz
- böylece iki write hattı aynı anda yarışmaz

### Diagnostics

Diagnostics store seviyesinde tutulur.

Kaynaklar:

- ilk form yükleme
- document save yanıtı
- explicit `validateDraft` çağrıları
- publish sonucu

## Bugün Gerçekten Açık Olan Özellikler

- form taslağı yükleme
- form başlığı düzenleme
- sayfa geçişi
- sayfa inline edit
- soru ekleme
- soru reorder
- soru içerik düzenleme
- soru bazlı inline validasyon düzenleme
- tekrarli grup child workspace
- structure tree reveal/collapse
- diagnostics paneli

## Placeholder / Kapalı Alanlar

- sağ panel `library` sekmesi placeholder
- sağ panel `conditions` sekmesi placeholder
- sağ panel `validation` sekmesi config'te tanımlı ama gizli
- `general`, `view`, `advanced`, `effects` tabları kapalı
- undo/redo view-model alanları var ama aktif değil

## Test Görünürlüğü

Modül altında görünür spec kapsamı vardır. Öne çıkan dosyalar:

- `form-editor.component.spec.ts`
- `form-editor-store.service.spec.ts`
- `form-editor-panel-state.service.spec.ts`
- `form-editor-validation.orchestrator.spec.ts`
- `form-editor-panel.component.spec.ts`
- `form-editor-structure-tree.component.spec.ts`
- `form-editor-palette.component.spec.ts`
- `question-validation-editor-outlet.component.spec.ts`
- `workspace-stack.util.spec.ts`

Bu, modülün artık yalnızca session notlarıyla değil, kod seviyesinde de
karakterizasyon testleriyle korunduğunu gösterir.

## Doğrulama Notu

Bu güncelleme sırasında kodlar doğrudan okundu.

Bu ortamda tekrar çalıştırılamayan doğrulamalar:

- `npx tsc -p tsconfig.app.json --noEmit`

Sebep:

- mevcut terminal ortamında `npx` bulunmuyor

## Bakım Kuralı

Bu modül için doküman güncellerken öncelik sırası şu olmalı:

1. çalışan component/service kodu
2. spec dosyaları
3. backend sözleşmesi
4. geçmiş plan notları

Yeni değişikliklerde bu dosya güncellenmeli; yeni session notları biriktirmek
yerine mevcut durum burada tutulmalıdır.
