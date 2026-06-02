# Postmortem — Reorder sessiz mutasyon bug'ı (2026-05-21)

Form editor'de soru sıralama sırasında karşılaşılan iki katmanlı bir
hatanın teşhisi ve çözümü. Sentinel return değeri karşılaştırılırken
yapılan klasik bir hatanın nasıl iki ayrı semptoma yol açtığını ve
hangi diagnostic yöntemiyle yakalandığını belgeler.

## Belirti

- Kullanıcı bir soruyu sürüklediğinde:
  - Item görsel olarak eski konumuna geri donüyor (response beklenmeden).
  - API yanıtı sonrası da sıra güncellenmiyor.
- API isteği `200 OK`, `isSuccess: true` dönüyor.
- Editörü kapatıp tekrar açtığımızda da sıra eski → backend persist etmiyor
  gibi görünüyor.
- İki ayrı reorder denemesi tarayıcıdan birebir aynı JSON payload ile
  çıkıyor (sıra hiç değişmemiş).

## Teşhis

Kod analiziyle iki taraf da kâğıt üzerinde doğru görünüyordu. Teşhisi
mümkün kılan adımlar:

1. **Request gözlemi.** Kullanıcı iki denemeden gelen request gövdelerini
   paylaşınca payload'ın hiç değişmediği görüldü → frontend optimistic
   update'in `orderedEids`'e yansımadığı kesinleşti.
2. **Diagnostic log (v1).** Store reorderQuestions akışına
   `event` / `children(pre-mutate)` / mutator giriş-çıkış / `orderedEids`
   log'ları eklendi. Mutator log'ları görünmedi ama orderedEids yine de
   yazıldı; "nextForm aynı kaldı" warn'i de tetiklenmedi.
3. **Diagnostic log (v2).** `console.error` + `V2` prefix + JSON.stringify
   + explicit `mutatorWasCalled` flag + `nextForm === stateFormBefore`
   karşılaştırması eklendi. Net sonuç:
   - `mutatorWasCalled = false`
   - `nextForm === stateFormBefore = false`
   - `targetPageBefore === targetPageAfter = true`
4. Yukarıdaki üç gözlem mevcut `updateContainerChildren` koduyla mantıken
   tutarsızdı (mutator çağrılmadan yeni form referansı üretilemez). Bu
   tutarsızlık, fonksiyonun mutator'ı **gerçek hedef sayfaya ulaşmadan
   önceki bir sayfada** çağırmamış ama yine de `mutated=true`
   atamış olduğunu gösterdi.

## Kök neden

`web/src/app/modules/form/pages/form-editor/utils/form-tree.util.ts`
içindeki `updateContainerChildren`, page-tree alt dalı için
`mutateChildrenInQuestionTree`'nin döndürdüğü sentinel'i yanlış
karşılaştırıyordu:

```ts
// ❌ Buggy
const nextSorular = mutateChildrenInQuestionTree(page.sorular ?? [], containerEid, mutator);
if (nextSorular !== (page.sorular ?? null)) {
    mutated = true;
    return { ...page, sorular: nextSorular ?? [] };
}
```

`mutateChildrenInQuestionTree` sözleşmesi: değişim varsa **yeni dizi**,
yoksa **`null`** döner. "Değişim yok" senaryosunda:

- `nextSorular = null`
- `page.sorular ?? null = page.sorular` (dolu bir dizi)
- `null !== <dolu dizi>` → **her zaman `true`**

Sonuç:

1. `mutated = true` set edilir (mutator hiç çağrılmadan).
2. `nextSorular ?? []` → `[]` → o sayfanın `sorular` listesi sessizce
   boşaltılır.
3. `if (mutated) return page` mantığı nedeniyle döngüdeki sonraki sayfalar
   skip edilir → containerEid'in gerçek hedef sayfasına asla ulaşılmaz
   → mutator çağrılmaz → reorder uygulanmaz.

Bu zincir iki ayrı bozulma üretir:

**A. Reorder hiç uygulanmaz.** `orderedEids` eski sıradaki listeyle
gönderilir. Backend `NormalizeQuestionSiblingOrder` her satır için
`existing.Sira == hedefSira` görür, hiçbir `Revise` yapmaz, transaction
boşa commit edilir. API 200 OK ama DB persist etmez.

**B. Sessiz veri kaybı.** Optimistic state içinde, döngüde önce iterate
edilen ilk sayfanın `sorular` array'i boşaltılır. Reorder sonrası
backend formu re-fetch eden bir akış yoksa, kullanıcı başka bir
sayfaya geçtiğinde sorular kaybolmuş görünebilirdi. (Mevcut akışta
re-fetch olduğu için bu yan etki yüzeye çıkmadı, ama veri yolu üzerinde
bir landmine'dı.)

İlginç çapraz referans: aynı dosyadaki rekürsif `mutateChildrenInQuestionTree`
fonksiyonu sentinel'i doğru karşılaştırıyor — `if (nextChildren !== null)`.
Yani sözleşme bir yerde tutarlı uygulanmış, sadece üst seviye karşılaştırma
gevşek yazılmış.

## Çözüm

Sentinel karşılaştırmasını sözleşmeyle hizalandır:

```ts
// ✅ Fix
const nextSorular = mutateChildrenInQuestionTree(page.sorular ?? [], containerEid, mutator);
if (nextSorular !== null) {
    mutated = true;
    return { ...page, sorular: nextSorular };
}
```

`?? []` fallback'i de kaldırıldı çünkü null durum artık dış koşulla
elenmiş oluyor; iç kısma giren her `nextSorular` tip olarak dolu dizi.

## Genel dersler

**Sentinel return'leri sözleşmeyle hizalı kontrol edin.** Bir fonksiyon
"değişim yok" durumunu `null` ile işaretliyorsa, çağıran taraf da
**`!== null`** veya **`=== null`** ile kontrol etmeli. "Önceki değerle
karşılaştır" tarzı kontroller (`x !== oldValue`) sentinel ile karışınca
sessiz false-positive üretir. Sözleşmeyi tek noktadan oku, her çağıran
yerde aynı şekilde kontrol et.

**Optimistic update + sessiz state mutasyonu çift hata maskeler.**
Frontend optimistic update API çağrısı eski sırayla gittiği için
backend yeni sıralamayı görmüyor, backend hata fırlatmadığı için
frontend de error branch'a düşmüyor. Sonuç: hiçbir tarafın hata
sinyali yok ama hiçbir şey de olmuyor. Bu tür "her şey yeşil ama
hiçbir şey persist etmiyor" senaryolarında, **request payload'ı
doğrudan inceleyin** — orada iz vardır.

**Mantıken imkansız üçlü gözlem → kod sözleşmesi ihlal edilmiş demektir.**
v2 diagnostic'in açtığı paradoks (mutator çağrılmamış + nextForm
yeni referans + hedef sayfa değişmemiş) `updateContainerChildren`'ın
gözle okunan koduyla tutarsızdı. "Bu üçü aynı anda olamaz" sonucu,
fonksiyonun mutator'ı **kullanılmayan başka bir yol üzerinden**
mutated bayrağı set ettiği iç ipucuna götürdü. Çelişen üçlü gözlem
neredeyse her zaman kodun bir yerinde sentinel/sözleşme ihlali
gösterir.

**`console.error` + JSON.stringify + uniq prefix.** Console filter
veya cache problemleri log'ları yutabilir. Kritik diagnostic için:
- `console.error` (her seviye filtresinde görünür)
- Uniq prefix (`V2` gibi) — eski cache log'larıyla karışmaz
- `JSON.stringify` — Chrome'un object lazy-evaluation'ından kaçınır
  (sonradan açılan obje GÜNCEL state'i gösterir, anlık snapshot'ı değil)
- Explicit boolean flag (`mutatorWasCalled`) — kontrol akışını dışarıdan
  gözlemlemenin tek garantili yolu
