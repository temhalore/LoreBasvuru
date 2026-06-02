# Form Editor Container Hierarchy Implementation Contract

Bu belge, form editor icinde soru ekleme, siralama, duzenleme ve silme
islemlerinin container-farkindali sekilde calismasi icin uygulanacak son
kontrati tanimlar.

Bu belge plan notu degil, uygulama sozlesmesidir. Uygulama sirasinda burada
yazili kararlar kaynak kabul edilir.

## Amac

Form editor icinde bir soru artik yalnizca iki eksenle tanimlanir:

- Hangi sayfaya ait oldugu
- Eger child ise hangi parent sorunun altinda oldugu

Soru sirasi icin tek gercek kaynak `t_form_soru.Sira` alanidir.

`t_form_soru_grup` tablosu yalnizca parent-child uyeligini tasir.
Bu tabloda bulunan `Sira` kolonu bu fazda artik davranissal kaynak olarak
kullanilmaz.

## Nihai Kararlar

1. `FormSoruDto` ve frontend `QuestionDto` icine `parentSoruKokEidDto` alani eklenecek.
2. `SoruDraftOlusturReq` icine `parentSoruKokEidDto` alani eklenecek.
3. Soru sirasi icin tek gercek kaynak `t_form_soru.Sira` olacak.
4. `sira` alani hem top-level hem child soru icin `bulundugu container icindeki efektif sira` anlamina gelecek.
5. Child create ve child reorder akislari `parentSoruKokEidDto` ile container-aware calisacak.
6. `SaveQuestionDraft` soru icerigini kaydedecek; parent veya sira degisikligi yapmayacak.
7. `SaveGrupIliskileri` editor akisindan cikarilacak.
8. Generic ve artik kullanilmayacak reorder kontratlari silinecek; yalnizca final explicit DTO'lar kalacak.
9. Bu fazda veritabani migration yapilmayacak; once kod tabani yeni kurala gore calisir hale getirilecek.
10. Sibling listesi cozumu ve `t_form_soru.Sira` kaydirma mantigi tek bir private helper'a alinacak. Bu helper hem create hem reorder akislarinda kullanilacak; cagri yeri `parentSoruKokEidDto` parametresine gore sibling listesini secer (parent null ise sayfa top-level sorulari, parent dolu ise parent'in child sorulari). Boylece iki paralel sira-kaydirma kod yolu birakilmaz.

## Deprecated Birakmama Politikasi

Bu faz sonunda asagidaki kontratlar editor akisinda yer almayacak:

- `FormBuildApiService.createQuestionDraft()` icindeki `parentKokEidDto`
- `SiralamaReq`
- Eski `SoruSirala` request semantigi
- Editor tarafinda `GrupIliskiKaydet` cagrisi

Asagidaki maddeler temizlenecek:

1. `service/etikkurul.common/DTO/Form/FormBuild/Request/SiralamaReq.cs` silinecek.
2. `service/etikkurul.common/DTO/Form/FormBuild/Request/SoruSiralamaReq.cs` final kontrata gore yeniden yazilacak.
3. `service/etikkurul.common/DTO/Form/FormBuild/Request/SayfaSiralamaReq.cs` final kontrata gore yeniden yazilacak.
4. `FormBuildController` ve `IFormBuildManager` icinde eski generic reorder imzalari kaldirilacak.
5. `SaveGrupIliskileri` endpoint'i editor akisindan cikarilacak ve tamamen silinecek. Kontrol yapildi: bu endpoint editor disinda hicbir yerden cagrilmiyor (frontend'de cagri yok; backend'de yalnizca Controller -> Interface -> Implementation ucIusu var; `FormSeedManager.InsertGrupIliskileri` bu endpoint'i kullanmiyor, dogrudan `_grupRepo.InsertNew` cagiriyor).

## Final Veri Kontratlari

### FormSoruDto

Final davranissal alanlar:

- `formKokEidDto`
- `sayfaKokEidDto`
- `soruKokEidDto`
- `parentSoruKokEidDto`
- `sira`

Anlamlari:

- `formKokEidDto`: sorunun ait oldugu form
- `sayfaKokEidDto`: sorunun ait oldugu sayfa
- `soruKokEidDto`: sorunun kendi kok id'si
- `parentSoruKokEidDto`: child ise parent soru; top-level ise `null`
- `sira`: sorunun bulundugu container icindeki efektif sira

`sira` alani artik page-global degil, container-local kabul edilir.

### SoruDraftOlusturReq

Final request alani:

- `formKokEidDto`
- `sayfaKokEidDto`
- `parentSoruKokEidDto` opsiyonel
- `soruTipKodDto`
- `sira`

Kurallar:

- `sayfaKokEidDto` zorunludur.
- `parentSoruKokEidDto` varsa parent soru `TEKRARLI_GRUP` tipinde olmalidir.
- Parent varsa ayni form ve ayni sayfa icinde olmalidir.
- `sira`, parent varsa parent'in child listesi icindeki; parent yoksa sayfa top-level listesi icindeki hedef siradir.

### SayfaSiralamaReq

Bu DTO yeniden yazilir ve sayfa siralama icin tek kontrat olur.

Final alanlar:

- `formKokEidDto`
- `siraliSayfaKokEidDtoler`

### SoruSiralamaReq

Bu DTO yeniden yazilir ve soru siralama icin tek kontrat olur.

Final alanlar:

- `sayfaKokEidDto`
- `parentSoruKokEidDto` opsiyonel
- `siraliSoruKokEidDtoler`

Kurallar:

- Parent `null` ise top-level soru siralamasi yapilir.
- Parent dolu ise yalnizca o parent altindaki child soru listesi siralanir.

## Source Of Truth Kurali

### Soru Uyelik Kurali

`t_form_soru_grup` tablosu su iki seyi tasir:

- `GrupSoruKokID`
- `AltSoruKokID`

Bu tablo parent-child uyeliginin tek kaynagidir.

### Sira Kurali

`t_form_soru.Sira` alani su iki durumda da tek kaynaktir:

- Sayfadaki top-level sorularin sirasi
- Parent altindaki child sorularin sirasi

`t_form_soru_grup.Sira` artik hicbir read akisinda kullanilmaz.

Bu kolona write yapilip yapilmamasi davranissal karar degildir. Bu fazda
istenirse legacy uyumluluk icin doldurulabilir; ama hicbir kod onu okuyamaz.

## Operasyon Kontratlari

### 1. Create Question Draft

Backend:

1. `formKokEidDto` ve `sayfaKokEidDto` dogrulanir.
2. `parentSoruKokEidDto` varsa parent soru yuklenir.
3. Parent soru `TEKRARLI_GRUP` degilse hata verilir.
4. Parent ve child ayni sayfa ve ayni form baglaminda olmalidir.
5. Hedef sibling listesi belirlenir:
   - parent yoksa sayfa top-level sorulari
   - parent varsa parent'in child sorulari
6. `req.sira` yalnizca bu sibling listesi icinde uygulanir.
7. Gerekli sibling kayitlarin `t_form_soru.Sira` degerleri kaydirilir.
8. Yeni soru insert edilir.
9. Parent varsa `t_form_soru_grup` icine uyelik kaydi yazilir.
10. Response olarak `parentSoruKokEidDto` ve efektif `sira` doner.

Frontend:

1. `containerEid` dogrudan API'ye gonderilmez.
2. Once `containerEid -> { sayfaEid, parentSoruEid }` cozulur.
3. API'ye `sayfaKokEidDto` ve gerekiyorsa `parentSoruKokEidDto` gonderilir.
4. Response local tree'ye ilgili container altina insert edilir.

### 2. Reorder Questions

Backend:

1. `SoruSiralamaReq` request'i alinir.
2. Parent `null` ise sayfanin top-level sibling listesi uzerinde calisilir.
3. Parent dolu ise parent child listesi uzerinde calisilir.
4. Yalnizca bu sibling listesine ait sorular kabul edilir.
5. Sirali gelen kok id listesine gore `t_form_soru.Sira = 1..N` olarak revise edilir.
6. `t_form_soru_grup.Sira` okunmaz.

Frontend:

1. Reorder event mevcut `containerEid` ile gelir.
2. Store container context'i cozer.
3. API'ye explicit `sayfaKokEidDto + parentSoruKokEidDto` gonderir.
4. Local optimistic update, container icindeki `sira` alanlarini yeniden yazar.

### 3. Save Question Draft

Bu operasyonun anlami yalnizca icerik kaydidir.

Kaydedecegi alanlar:

- soru metni
- zorunluluk
- yardim metni
- placeholder
- olcek alanlari
- secenekler
- matris satir/sutunlari

Kaydetmeyecegi alanlar:

- parent degisikligi
- move islemi
- reorder islemi

Uygulama kurali:

- `SaveQuestionDraft` icindeki `updated.Sira = req.sira ...` mantigi kaldirilir.
- `SaveQuestionDraft` soru konumunu degistirmez.

### 4. Delete Question

Backend mevcut cascade mantigi korunur.

Kurallar:

- Soru grup ise alt uyelikler silinir.
- Soru child ise parent uyelikleri silinir.
- Sonra soru silinir.

Frontend delete aksiyonu eklendiginde:

- silinen sorunun `parentSoruKokEidDto` bilgisi ile dogru container cleanup yapilir
- `workspaceStack`, `selectedNodeEid` ve aktif surface state'i buna gore temizlenir

### 5. Projection / Read Model

Projection ve DTO map'leri su sekilde uretilecek:

- Top-level soru: `parentSoruKokEidDto = null`
- Child soru: `parentSoruKokEidDto = parent grup soru kok id`
- Top-level sorular `t_form_soru.Sira` ile siralanir
- Child sorular da `t_form_soru.Sira` ile siralanir
- `t_form_soru_grup.Sira` hicbir projection akisinda okunmaz

### 6. Respondent / Preview

Runtime tarafinda da ayni kural gecerli olur:

- Top-level soru listesi `question.Sira` ile siralanir
- Child soru listesi relation `Sira` ile degil `childQuestion.Sira` ile siralanir
- Grup instance sirasi ayridir; `t_form_soru_grup_instance.Sira` kullanilmaya devam eder

## Validation Kontrati

Mevcut page-level duplicate soru sira kontrolu yanlis hale gelecegi icin
container-aware sekilde yeniden yazilacak.

Final kontrol seti:

1. Her sayfa icin top-level soru sibling listesinde duplicate `Sira` var mi
2. Her parent grup icin child sibling listesinde duplicate `Sira` var mi

Asagidaki durum artik hata veya warning degildir:

- Ayni sayfada bir top-level soru ile bir child sorunun ikisinin de `sira = 1` olmasi

## Silinecek veya Yeniden Yazilacak Dosyalar

### Silinecek

- `service/etikkurul.common/DTO/Form/FormBuild/Request/SiralamaReq.cs`
- `FormBuildController.GrupIliskiKaydet`
- `IFormBuildManager.SaveGrupIliskileri`
- `FormBuildManager.SaveGrupIliskileri`
- `GrupIliskiKaydetReq`

Yukaridaki `GrupIliskiKaydet` zincirinin tamamen silinmesinin gerekcesi: bu
endpoint editor disinda hicbir yerden cagrilmiyor (kontrol edildi, bkz.
"Deprecated Birakmama Politikasi" madde 5).

### Yeniden Yazilacak

- `service/etikkurul.common/DTO/Form/FormBuild/Request/SoruSiralamaReq.cs`
- `service/etikkurul.common/DTO/Form/FormBuild/Request/SayfaSiralamaReq.cs`
- `service/etikkurul.common/DTO/Form/FormBuild/Request/SoruDraftOlusturReq.cs`
- `service/etikkurul.common/DTO/Form/Common/FormSoruDto.cs`
- `service/etikkurul.bal/Managers/Form/FormBuildManager.cs`
- `service/etikkurul.bal/Managers/Form/FormRespondentManager.cs`
- `service/etikkurul.service/Controllers/Form/FormBuildController.cs`
- `service/etikkurul.bal/Managers/Form/Interfaces/IFormBuildManager.cs`
- `web/src/app/modules/form/models/question.model.ts`
- `web/src/app/modules/form/pages/form-editor/services/form-build-api.service.ts`
- `web/src/app/modules/form/pages/form-editor/services/form-editor-store.service.ts`
- `web/src/app/modules/form/pages/form-editor/utils/form-tree.util.ts`

## Implementasyon Sirasi

1. DTO ve API kontratlari duzeltilir.
2. Backend create akisi container-aware hale getirilir.
3. Backend soru reorder akisi yeni explicit DTO ile yazilir.
4. Projection ve read model `question.Sira` source-of-truth olacak sekilde guncellenir.
5. `SaveQuestionDraft` sira ve parent write'larindan arindirilir.
6. Respondent ve preview sira okuma mantigi yeni modele cekilir.
7. Frontend store ve API adapter yeni request/response modeline gecirilir.
8. Validation ve diagnostics kontrolleri container-aware hale getirilir.
9. Editor akisindan `SaveGrupIliskileri` tumden cikarilir.
10. Eski generic reorder kontratlari ve artik kullanilmayan endpoint/DTO'lar silinir.

## Kabul Kriterleri

Bu faz tamamlandiginda su davranislar saglanmis olmalidir:

1. Page icinde soru ekleme dogru sayfa ve dogru `sira` ile calisir.
2. Group icinde child soru ekleme dogru sayfa, dogru parent ve dogru `sira` ile calisir.
3. Top-level reorder yalnizca top-level sibling listesini etkiler.
4. Child reorder yalnizca ilgili parent'in child listesini etkiler.
5. Soru edit save sonrasi parent ve sira korunur.
6. Projection, editor ve respondent ayni child sirasini gorur.
7. `t_form_soru_grup.Sira` hicbir read akisinda kullanilmaz.
8. Editor create/reorder akisinda `GrupIliskiKaydet` cagrisi kalmaz.
9. Kod tabaninda eski generic reorder kontrati kalmaz.
10. Deprecated veya artik kullanilmayan editor DTO/endpoint alanlari birakilmaz.

## Faz Disi Olanlar

Bu belge kapsaminda degildir:

- Veritabani migration
- `t_form_soru_grup.Sira` kolonunun fiziksel silinmesi
- Soru tasima (`move`) icin ayri command tasarimi
- Group instance sira modelinin degistirilmesi

## Dogrulama

Backend:

- `dotnet build etikkurul.sln`
- `FormRespondentLifecycleTest` yesil kalmalidir. Bu test zorunlu yesil
  kosuldur; cunku respondent akisi `t_form_soru_grup.Sira` -> `childQuestion.Sira`
  geciSiyle dogrudan etkilenir ve compile-time kontroller bu davranissal
  regresyonu yakalamaz.

Frontend:

- `npx tsc -p tsconfig.app.json --noEmit`

Bu belgeye gore implementasyon yapildiginda sonraki fazda veritabani sadeleme
ve fiziksel kolon temizligi dusunulebilir.