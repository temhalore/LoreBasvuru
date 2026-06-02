# 10 — Form Builder ve Form Respondent

## Soru Tipleri

| Tip No | Kod | Açıklama |
|--------|-----|---------|
| 1 | text | Kısa metin |
| 2 | textarea | Uzun metin |
| 3 | number | Sayı |
| 4 | date | Tarih |
| 5 | datetime | Tarih + Saat |
| 6 | select | Tek seçim (dropdown) |
| 7 | multiselect | Çoklu seçim |
| 8 | radio | Radio button |
| 9 | checkbox | Checkbox grubu |
| 10 | file | Dosya yükleme |
| 11 | yesno | Evet/Hayır |
| 12 | address | Adres (il/ilçe/mahalle cascade) |
| 13 | phone | Telefon |
| 14 | email | E-posta |
| 15 | tckimlik | TC Kimlik No (Mernis doğrulama opsiyonel) |
| 16 | info | Bilgi metni (readonly) |
| 17 | signature | İmza (canvas) |
| 18 | rating | Değerlendirme (1-5 yıldız) |
| 19 | table | Tablo (dinamik satır eklenebilir) |
| 20 | crosslink | Başka formdan referans seç |

---

## Seçenek Kaynakları (t_frm_soru.SecenekKaynakTipi)

| Kod | Açıklama |
|-----|---------|
| 1 | Manuel (t_frm_soru_secenek tablosu) |
| 2 | Dış servis GET |
| 3 | Dış servis POST |
| 4 | DB sorgusu (t_sis_kod_tablosu) |
| 5 | Cross-link form başvuruları |

---

## Kural Motoru — JSON Formatı

`t_frm_kural.KuralJson` alanında saklanır.

```json
{
  "tetikleyici": {
    "soruId": 42,
    "operasyon": "equals",
    "deger": "evet"
  },
  "aksiyonlar": [
    {
      "tip": "goster",
      "hedefSoruId": 55
    },
    {
      "tip": "goster",
      "hedefSoruId": 56
    },
    {
      "tip": "zorunlu_yap",
      "hedefSoruId": 55
    }
  ]
}
```

### Kural Operasyonları
- `equals` / `notEquals`
- `greaterThan` / `lessThan` / `greaterOrEqual` / `lessOrEqual`
- `contains` / `notContains`
- `isEmpty` / `isNotEmpty`
- `in` / `notIn` (deger virgülle ayrılmış liste)

### Aksiyon Tipleri
- `goster` / `gizle` — Soruyu göster/gizle
- `zorunlu_yap` / `zorunlu_kaldir` — Soruyu zorunlu yap/kaldır
- `deger_set` — Soruya değer ata (`{ "deger": "x" }`)
- `sayfaya_git` — Belirtilen sayfaya atla (`{ "sayfaNo": 3 }`)
- `formu_bitir` — Başvuruyu sonlandır

---

## KuralManager

```csharp
// Lore.Basvuru.Bal/Managers/Form/KuralManager.cs
public interface IKuralManager
{
    List<KuralDTO> FormKurallariniGetir(long formId);
    KuralDTO KuralKaydet(KuralDTO dto);
    void KuralSil(long kuralId);
    // Frontend'e gönderilecek: hangi sorular bu soruya bağlı?
    Dictionary<long, List<KuralDTO>> KuralHaritasiGetir(long formId);
}

public class KuralManager : IKuralManager
{
    private readonly IGenericRepository<t_frm_kural> _kuralRepo;
    private readonly IMapper _mapper;

    public List<KuralDTO> FormKurallariniGetir(long formId)
    {
        var sql = @"
            SELECT k.Id, k.BasvuruFormId, k.TetikleyiciSoruId, k.KuralJson,
                   k.AktifMi, k.SiraNo
            FROM t_frm_kural k
            WHERE k.BasvuruFormId = @fid AND k.IsDeleted = 0 AND k.AktifMi = 1
            ORDER BY k.SiraNo";

        var list = _kuralRepo.Query<KuralDTO>(sql, new { fid = formId });
        return list;
    }

    public KuralDTO KuralKaydet(KuralDTO dto)
    {
        // JSON parse validate
        try
        {
            JsonConvert.DeserializeObject<KuralJsonModel>(dto.kuralJson);
        }
        catch
        {
            throw new AppException(400, "Geçersiz kural JSON formatı");
        }

        var entity = _mapper.Map<t_frm_kural>(dto);
        entity.TenantId = HttpContextHelper.GetTenantId();

        if (dto.id > 0)
        {
            _kuralRepo.Update(entity);
        }
        else
        {
            dto.id = _kuralRepo.Insert(entity);
        }

        return dto;
    }

    public Dictionary<long, List<KuralDTO>> KuralHaritasiGetir(long formId)
    {
        var kurallar = FormKurallariniGetir(formId);
        var harita = new Dictionary<long, List<KuralDTO>>();

        foreach (var kural in kurallar)
        {
            var tetikleyiciId = kural.tetikleyiciSoruId;
            if (!harita.ContainsKey(tetikleyiciId))
                harita[tetikleyiciId] = new List<KuralDTO>();
            harita[tetikleyiciId].Add(kural);
        }

        return harita;
    }
}

// Kural JSON model (deserialization için)
public class KuralJsonModel
{
    public KuralTetikleyici tetikleyici { get; set; }
    public List<KuralAksiyon> aksiyonlar { get; set; }
}

public class KuralTetikleyici
{
    public long soruId { get; set; }
    public string operasyon { get; set; }
    public string deger { get; set; }
}

public class KuralAksiyon
{
    public string tip { get; set; }
    public long? hedefSoruId { get; set; }
    public string deger { get; set; }
    public int? sayfaNo { get; set; }
}
```

---

## FormRespondentManager

```csharp
// Lore.Basvuru.Bal/Managers/Form/FormRespondentManager.cs
public interface IFormRespondentManager
{
    // Başvuru başlat (yoksa oluştur, varsa devam)
    BasvuruBaslatResponseDTO BasvuruBaslat(long formId, long userId);
    // Sayfa cevaplarını kaydet
    void CevapKaydet(CevapKaydetReqDTO req);
    // Başvuruyu tamamla
    void BasvuruTamamla(long basvuruId);
    // Kullanıcının başvurularını listele
    List<KullaniciBasvuruListDTO> BasvurularimListele(long userId);
    // Başvuru detayını getir
    BasvuruDetayDTO BasvuruDetayGetir(long basvuruId, long userId);
    // Önceki başvurudan kopyala
    void OncekiBasvurudanKopyala(long basvuruId, long kaynakBasvuruId);
}

public class FormRespondentManager : IFormRespondentManager
{
    private readonly IGenericRepository<t_bsv_user_basvuru> _basvuruRepo;
    private readonly IGenericRepository<t_bsv_cevap> _cevapRepo;
    private readonly IGenericRepository<t_frm_basvuru_form> _formRepo;
    private readonly IGenericRepository<t_frm_sayfa> _sayfaRepo;
    private readonly IGenericRepository<t_frm_soru> _soruRepo;
    private readonly IGenericRepository<t_lnk_cross_link_kural> _crossLinkRepo;
    private readonly IGenericRepository<t_wf_workflow> _workflowRepo;
    private readonly IWorkflowManager _workflowManager;
    private readonly IDosyaManager _dosyaManager;
    private readonly IMapper _mapper;

    public BasvuruBaslatResponseDTO BasvuruBaslat(long formId, long userId)
    {
        // Form aktif mi?
        var form = _formRepo.Get(formId);
        if (form == null || form.Durum != 3) // 3 = Yayında
            throw new AppException(400, "Form aktif değil veya bulunamadı");

        // Tarih kontrolü
        if (form.BaslamaTarihi.HasValue && DateTime.Now < form.BaslamaTarihi.Value)
            throw new AppException(400, "Form henüz başlamadı");
        if (form.BitisTarihi.HasValue && DateTime.Now > form.BitisTarihi.Value)
            throw new AppException(400, "Formun süresi dolmuş");

        // Çakışma kontrolü: Aynı kullanıcı bu formu daha önce açtı mı?
        var mevcutBasvuru = _basvuruRepo.Get(
            "BasvuruFormId = @fid AND UserId = @uid AND Durum != 4 AND IsDeleted = 0",
            new { fid = formId, uid = userId });

        if (mevcutBasvuru != null && !form.CokluBasvuruIzniVarMi)
            throw new AppException(409, "Bu forma zaten bir başvurunuz bulunmaktadır");

        // Cross-link IN/NOT IN kontrolü
        CrossLinkKontrol(formId, userId);

        // Yeni başvuru oluştur
        var basvuru = new t_bsv_user_basvuru
        {
            TenantId = form.TenantId,
            BasvuruFormId = formId,
            UserId = userId,
            Durum = 1, // Taslak
            BaslamaTarihi = DateTime.Now
        };
        var basvuruId = _basvuruRepo.Insert(basvuru);

        AppLog.Info($"[FormRespondentManager] BasvuruBaslat: FormId={formId}, UserId={userId}, BasvuruId={basvuruId}");

        return new BasvuruBaslatResponseDTO
        {
            basvuruId = basvuruId,
            formAd = form.Ad,
            sayfaSayisi = _sayfaRepo.GetList(
                "BasvuruFormId = @fid AND IsDeleted = 0",
                new { fid = formId }).Count
        };
    }

    private void CrossLinkKontrol(long formId, long userId)
    {
        // Bu forma ait cross-link kurallarını getir
        var kurallar = _crossLinkRepo.GetList(
            "HedefFormId = @fid AND IsDeleted = 0 AND AktifMi = 1",
            new { fid = formId });

        foreach (var kural in kurallar)
        {
            var sql = @"
                SELECT COUNT(*) FROM t_bsv_user_basvuru
                WHERE BasvuruFormId = @kaynak AND UserId = @uid
                AND Durum = 4 AND IsDeleted = 0";  // 4 = Tamamlandı

            var count = _basvuruRepo.Query<int>(sql,
                new { kaynak = kural.KaynakFormId, uid = userId })
                .FirstOrDefault();

            if (kural.KuralTipi == 1 && count == 0) // IN — olması gerekiyor
                throw new AppException(403, kural.HatamesajI ?? "Bu forma başvurabilmek için önce diğer formu tamamlamanız gerekmektedir");

            if (kural.KuralTipi == 2 && count > 0) // NOT IN — olmaması gerekiyor
                throw new AppException(403, kural.HataMessajI ?? "Bu forma daha önce başvurmuş olanlar tekrar başvuramaz");
        }
    }

    public void CevapKaydet(CevapKaydetReqDTO req)
    {
        var basvuru = _basvuruRepo.Get(req.basvuruId);
        if (basvuru == null || basvuru.UserId != HttpContextHelper.GetUserId())
            throw new AppException(403, "Başvuru bulunamadı veya yetkisiz erişim");

        if (basvuru.Durum == 4)
            throw new AppException(400, "Tamamlanan başvuruda değişiklik yapılamaz");

        using var scope = _basvuruRepo.BeginTransaction();

        foreach (var cevap in req.cevaplar)
        {
            // Mevcut cevap var mı?
            var mevcutCevap = _cevapRepo.Get(
                "BasvuruId = @bid AND SoruId = @sid AND IsDeleted = 0",
                new { bid = req.basvuruId, sid = cevap.soruId });

            if (mevcutCevap != null)
            {
                mevcutCevap.Deger = cevap.deger;
                mevcutCevap.DegerJson = cevap.degerJson;
                _cevapRepo.Update(mevcutCevap);
            }
            else
            {
                var yeniCevap = new t_bsv_cevap
                {
                    TenantId = basvuru.TenantId,
                    BasvuruId = req.basvuruId,
                    SoruId = cevap.soruId,
                    Deger = cevap.deger,
                    DegerJson = cevap.degerJson
                };
                _cevapRepo.Insert(yeniCevap);
            }
        }

        // Mevcut sayfa no güncelle
        basvuru.MevcutSayfaNo = req.sayfaNo;
        _basvuruRepo.Update(basvuru);

        scope.Complete();
    }

    public void BasvuruTamamla(long basvuruId)
    {
        var basvuru = _basvuruRepo.Get(basvuruId);
        if (basvuru == null || basvuru.UserId != HttpContextHelper.GetUserId())
            throw new AppException(403, "Yetkisiz erişim");

        // Zorunlu alanlar dolu mu?
        ZorunluAlanKontrol(basvuru);

        basvuru.Durum = 4; // Tamamlandı
        basvuru.TamamlamaTarihi = DateTime.Now;
        _basvuruRepo.Update(basvuru);

        // Workflow varsa başlat
        var workflow = _workflowRepo.Get(
            "BasvuruFormId = @fid AND AktifMi = 1 AND IsDeleted = 0",
            new { fid = basvuru.BasvuruFormId });

        if (workflow != null)
        {
            _workflowManager.WorkflowBaslat(basvuruId, workflow.Id);
        }

        AppLog.Info($"[FormRespondentManager] BasvuruTamamla: BasvuruId={basvuruId}");
    }

    private void ZorunluAlanKontrol(t_bsv_user_basvuru basvuru)
    {
        // Zorunlu soruların cevap verip vermediğini kontrol et
        var zorunluSorular = _soruRepo.GetList(
            "BasvuruFormId = @fid AND ZorunluMu = 1 AND IsDeleted = 0 AND AktifMi = 1",
            new { fid = basvuru.BasvuruFormId });

        if (!zorunluSorular.Any()) return;

        var cevaplar = _cevapRepo.GetList(
            "BasvuruId = @bid AND IsDeleted = 0",
            new { bid = basvuru.Id });

        var cevapliSoruIds = cevaplar
            .Where(c => !string.IsNullOrWhiteSpace(c.Deger) || !string.IsNullOrWhiteSpace(c.DegerJson))
            .Select(c => c.SoruId)
            .ToHashSet();

        var eksikSorular = zorunluSorular
            .Where(s => !cevapliSoruIds.Contains(s.Id))
            .Select(s => s.Etiket)
            .ToList();

        if (eksikSorular.Any())
            throw new AppException(400,
                $"Zorunlu alanlar doldurulmadı: {string.Join(", ", eksikSorular)}");
    }

    public void OncekiBasvurudanKopyala(long basvuruId, long kaynakBasvuruId)
    {
        var hedef = _basvuruRepo.Get(basvuruId);
        var kaynak = _basvuruRepo.Get(kaynakBasvuruId);

        if (hedef == null || kaynak == null)
            throw new AppException(404, "Başvuru bulunamadı");

        if (hedef.UserId != HttpContextHelper.GetUserId())
            throw new AppException(403, "Yetkisiz erişim");

        // Kaynaktaki cevapları al
        var kaynakCevaplar = _cevapRepo.GetList(
            "BasvuruId = @bid AND IsDeleted = 0",
            new { bid = kaynakBasvuruId });

        // Hedef formun soru Id'leri
        var hedefSoruIds = _soruRepo.GetList(
            "BasvuruFormId = @fid AND IsDeleted = 0",
            new { fid = hedef.BasvuruFormId })
            .Select(s => s.Id)
            .ToHashSet();

        using var scope = _basvuruRepo.BeginTransaction();

        foreach (var cevap in kaynakCevaplar.Where(c => hedefSoruIds.Contains(c.SoruId)))
        {
            // Hedef başvuruda bu soru için cevap var mı?
            var mevcutCevap = _cevapRepo.Get(
                "BasvuruId = @bid AND SoruId = @sid AND IsDeleted = 0",
                new { bid = basvuruId, sid = cevap.SoruId });

            if (mevcutCevap != null) continue; // Zaten cevap verilmiş, üzerine yazma

            _cevapRepo.Insert(new t_bsv_cevap
            {
                TenantId = hedef.TenantId,
                BasvuruId = basvuruId,
                SoruId = cevap.SoruId,
                Deger = cevap.Deger,
                DegerJson = cevap.DegerJson
            });
        }

        scope.Complete();
        AppLog.Info($"[FormRespondentManager] OncekiBasvurudanKopyala: Kaynak={kaynakBasvuruId} → Hedef={basvuruId}");
    }

    public BasvuruDetayDTO BasvuruDetayGetir(long basvuruId, long userId)
    {
        var sql = @"
            SELECT b.Id, b.BasvuruFormId, b.Durum, b.BaslamaTarihi, b.TamamlamaTarihi,
                   b.MevcutSayfaNo, f.Ad AS FormAd, f.Aciklama AS FormAciklama
            FROM t_bsv_user_basvuru b
            INNER JOIN t_frm_basvuru_form f ON f.Id = b.BasvuruFormId
            WHERE b.Id = @bid AND b.UserId = @uid AND b.IsDeleted = 0";

        var basvuruDetay = _basvuruRepo.Query<BasvuruDetayDTO>(sql,
            new { bid = basvuruId, uid = userId })
            .FirstOrDefault();

        if (basvuruDetay == null)
            throw new AppException(404, "Başvuru bulunamadı");

        // Cevapları getir
        var cevapSql = @"
            SELECT c.SoruId, c.Deger, c.DegerJson,
                   s.Etiket AS SoruEtiket, s.SoruTipi
            FROM t_bsv_cevap c
            INNER JOIN t_frm_soru s ON s.Id = c.SoruId
            WHERE c.BasvuruId = @bid AND c.IsDeleted = 0";

        basvuruDetay.cevaplar = _cevapRepo.Query<CevapDetayDTO>(cevapSql,
            new { bid = basvuruId });

        return basvuruDetay;
    }
}
```

---

## Dış Servis Entegrasyonu (SecenekKaynakTipi = 2 veya 3)

```csharp
// Lore.Basvuru.Bal/Managers/Form/DisServisManager.cs
public interface IDisServisManager
{
    List<SelectItemDTO> SecenekleriGetir(long soruId, string aramaMetni = null,
        Dictionary<string, string> ekParametreler = null);
}

public class DisServisManager : IDisServisManager
{
    private readonly IGenericRepository<t_frm_soru> _soruRepo;
    private readonly HttpClient _httpClient;

    public List<SelectItemDTO> SecenekleriGetir(long soruId, string aramaMetni = null,
        Dictionary<string, string> ekParametreler = null)
    {
        var soru = _soruRepo.Get(soruId);
        if (soru == null)
            throw new AppException(404, "Soru bulunamadı");

        if (soru.SecenekKaynakTipi == 1)
        {
            // Manuel seçenekler zaten formla birlikte gelir
            throw new AppException(400, "Manuel seçenekler ayrı endpoint ile getirilir");
        }

        var config = JsonConvert.DeserializeObject<DisServisConfig>(soru.DisServisJson ?? "{}");
        if (config == null || string.IsNullOrEmpty(config.url))
            throw new AppException(400, "Dış servis yapılandırması eksik");

        // Header'ları hazırla
        var request = new HttpRequestMessage();
        if (config.headers != null)
        {
            foreach (var header in config.headers)
                request.Headers.TryAddWithoutValidation(header.Key, header.Value);
        }

        // Parametre yerine koy: {aramaMetni}, {tenantId} vb.
        var url = config.url
            .Replace("{aramaMetni}", Uri.EscapeDataString(aramaMetni ?? ""))
            .Replace("{tenantId}", HttpContextHelper.GetTenantId().ToString());

        if (ekParametreler != null)
        {
            foreach (var p in ekParametreler)
                url = url.Replace($"{{{p.Key}}}", Uri.EscapeDataString(p.Value));
        }

        HttpResponseMessage response;

        if (soru.SecenekKaynakTipi == 2) // GET
        {
            request.Method = HttpMethod.Get;
            request.RequestUri = new Uri(url);
            response = _httpClient.SendAsync(request).Result;
        }
        else // POST
        {
            var body = config.requestBody ?? "{}";
            if (aramaMetni != null)
                body = body.Replace("{aramaMetni}", aramaMetni);

            request.Method = HttpMethod.Post;
            request.RequestUri = new Uri(url);
            request.Content = new StringContent(body, Encoding.UTF8, "application/json");
            response = _httpClient.SendAsync(request).Result;
        }

        if (!response.IsSuccessStatusCode)
            throw new AppException(502, "Dış servis yanıt vermedi");

        var json = response.Content.ReadAsStringAsync().Result;

        // Yanıtı SelectItemDTO formatına dönüştür
        // config.valueField ve config.labelField kullanılır
        var data = JsonConvert.DeserializeObject<dynamic>(json);
        var items = new List<SelectItemDTO>();

        // Sonuç dizisi config.dataPath ile bulunur (örn: "data.items")
        dynamic dataArray = data;
        if (!string.IsNullOrEmpty(config.dataPath))
        {
            foreach (var segment in config.dataPath.Split('.'))
                dataArray = dataArray[segment];
        }

        foreach (var item in dataArray)
        {
            items.Add(new SelectItemDTO
            {
                value = item[config.valueField ?? "id"]?.ToString(),
                label = item[config.labelField ?? "ad"]?.ToString()
            });
        }

        return items;
    }
}

// Dış servis config modeli
public class DisServisConfig
{
    public string url { get; set; }
    public Dictionary<string, string> headers { get; set; }
    public string requestBody { get; set; }    // POST için body template
    public string dataPath { get; set; }       // Yanıttaki dizi yolu (örn: "data")
    public string valueField { get; set; }     // Değer alanı (örn: "id")
    public string labelField { get; set; }     // Etiket alanı (örn: "ad")
}
```

---

## FormRespondentController

```csharp
// Lore.Basvuru.Service/Controllers/Form/FormRespondentController.cs
[Route("Api/FormRespondent")]
[ApiController]
public class FormRespondentController : ControllerBase
{
    private readonly IFormRespondentManager _manager;
    private readonly IDisServisManager _disServisManager;

    [DirectAccess]
    [HttpGet("FormBilgisiGetir/{formEid}")]
    public IActionResult FormBilgisiGetir(string formEid)
    {
        // Token olmadan da form görüntülenebilir (public formlar)
        // Ama başvuru başlatmak için token gerekli
        var formId = CryptoHelper.DecryptLong(formEid);
        var response = new ServiceResponse<FormPublicDTO>();
        response.data = _manager.FormPublicBilgisiGetir(formId);
        return Ok(response);
    }

    [HttpPost("BasvuruBaslat")]
    public IActionResult BasvuruBaslat([FromBody] SingleValueDTO req)
    {
        var formId = CryptoHelper.DecryptLong(req.value);
        var userId = HttpContextHelper.GetUserId();
        var response = new ServiceResponse<BasvuruBaslatResponseDTO>();
        response.data = _manager.BasvuruBaslat(formId, userId);
        return Ok(response);
    }

    [HttpPost("CevapKaydet")]
    public IActionResult CevapKaydet([FromBody] CevapKaydetReqDTO req)
    {
        req.basvuruId = CryptoHelper.DecryptLong(req.basvuruEid);
        _manager.CevapKaydet(req);
        var response = new ServiceResponse<bool>(true);
        response.message = "Cevaplar kaydedildi";
        return Ok(response);
    }

    [HttpPost("Tamamla")]
    public IActionResult Tamamla([FromBody] SingleValueDTO req)
    {
        var basvuruId = CryptoHelper.DecryptLong(req.value);
        _manager.BasvuruTamamla(basvuruId);
        var response = new ServiceResponse<bool>(true);
        response.message = "Başvurunuz tamamlandı";
        return Ok(response);
    }

    [HttpGet("Basvurularim")]
    public IActionResult Basvurularim()
    {
        var userId = HttpContextHelper.GetUserId();
        var response = new ServiceResponse<List<KullaniciBasvuruListDTO>>();
        response.data = _manager.BasvurularimListele(userId);
        return Ok(response);
    }

    [HttpGet("BasvuruDetay/{basvuruEid}")]
    public IActionResult BasvuruDetay(string basvuruEid)
    {
        var basvuruId = CryptoHelper.DecryptLong(basvuruEid);
        var userId = HttpContextHelper.GetUserId();
        var response = new ServiceResponse<BasvuruDetayDTO>();
        response.data = _manager.BasvuruDetayGetir(basvuruId, userId);
        return Ok(response);
    }

    [HttpPost("OncekiBasvurudanKopyala")]
    public IActionResult OncekiBasvurudanKopyala([FromBody] KopyalaReqDTO req)
    {
        var basvuruId = CryptoHelper.DecryptLong(req.basvuruEid);
        var kaynakId = CryptoHelper.DecryptLong(req.kaynakBasvuruEid);
        _manager.OncekiBasvurudanKopyala(basvuruId, kaynakId);
        var response = new ServiceResponse<bool>(true);
        response.message = "Önceki başvurudan kopyalandı";
        return Ok(response);
    }

    [HttpPost("DisServisSecenekler")]
    public IActionResult DisServisSecenekler([FromBody] DisServisSecenekReqDTO req)
    {
        var soruId = CryptoHelper.DecryptLong(req.soruEid);
        var response = new ServiceResponse<List<SelectItemDTO>>();
        response.data = _disServisManager.SecenekleriGetir(soruId, req.aramaMetni, req.ekParametreler);
        return Ok(response);
    }
}
```

---

## Form Builder Controller

```csharp
// Lore.Basvuru.Service/Controllers/FormBuild/FormBuildController.cs
[Route("Api/FormBuild")]
[ApiController]
public class FormBuildController : ControllerBase
{
    private readonly IFormBuildManager _manager;
    private readonly IKuralManager _kuralManager;

    // --- Form CRUD ---

    [HttpPost("Form/Listele")]
    public IActionResult FormListele([FromBody] DatatableRequestDTO<BasvuruFormListDTO> req)
    {
        var tenantId = HttpContextHelper.GetTenantId();
        var response = new ServiceResponse<DatatableResponseDTO<BasvuruFormListDTO>>();
        response.data = _manager.FormListesiGetir(req, tenantId);
        return Ok(response);
    }

    [HttpPost("Form/Kaydet")]
    public IActionResult FormKaydet([FromBody] BasvuruFormDTO dto)
    {
        var response = new ServiceResponse<BasvuruFormDTO>();
        response.data = _manager.FormKaydet(dto);
        return Ok(response);
    }

    [HttpDelete("Form/Sil/{eid}")]
    public IActionResult FormSil(string eid)
    {
        var id = CryptoHelper.DecryptLong(eid);
        _manager.FormSil(id);
        return Ok(new ServiceResponse<bool>(true));
    }

    [HttpPost("Form/Yayinla/{eid}")]
    public IActionResult FormYayinla(string eid)
    {
        var id = CryptoHelper.DecryptLong(eid);
        _manager.FormYayinla(id);
        return Ok(new ServiceResponse<bool>(true));
    }

    [HttpPost("Form/Kopyala/{eid}")]
    public IActionResult FormKopyala(string eid)
    {
        var id = CryptoHelper.DecryptLong(eid);
        var tenantId = HttpContextHelper.GetTenantId();
        _manager.FormKopyala(id, tenantId);
        return Ok(new ServiceResponse<bool>(true));
    }

    // --- Sayfa CRUD ---

    [HttpGet("Sayfa/Listele/{formEid}")]
    public IActionResult SayfaListele(string formEid)
    {
        var formId = CryptoHelper.DecryptLong(formEid);
        var response = new ServiceResponse<List<SayfaDTO>>();
        response.data = _manager.SayfaListesiGetir(formId);
        return Ok(response);
    }

    [HttpPost("Sayfa/Kaydet")]
    public IActionResult SayfaKaydet([FromBody] SayfaDTO dto)
    {
        var response = new ServiceResponse<SayfaDTO>();
        response.data = _manager.SayfaKaydet(dto);
        return Ok(response);
    }

    [HttpDelete("Sayfa/Sil/{eid}")]
    public IActionResult SayfaSil(string eid)
    {
        var id = CryptoHelper.DecryptLong(eid);
        _manager.SayfaSil(id);
        return Ok(new ServiceResponse<bool>(true));
    }

    // --- Soru CRUD ---

    [HttpGet("Soru/Listele/{sayfaEid}")]
    public IActionResult SoruListele(string sayfaEid)
    {
        var sayfaId = CryptoHelper.DecryptLong(sayfaEid);
        var response = new ServiceResponse<List<SoruDTO>>();
        response.data = _manager.SoruListesiGetir(sayfaId);
        return Ok(response);
    }

    [HttpPost("Soru/Kaydet")]
    public IActionResult SoruKaydet([FromBody] SoruDTO dto)
    {
        var response = new ServiceResponse<SoruDTO>();
        response.data = _manager.SoruKaydet(dto);
        return Ok(response);
    }

    [HttpDelete("Soru/Sil/{eid}")]
    public IActionResult SoruSil(string eid)
    {
        var id = CryptoHelper.DecryptLong(eid);
        _manager.SoruSil(id);
        return Ok(new ServiceResponse<bool>(true));
    }

    [HttpPost("Soru/SiraGuncelle")]
    public IActionResult SoruSiraGuncelle([FromBody] List<SiraGuncelleDTO> req)
    {
        _manager.SoruSiraGuncelle(req);
        return Ok(new ServiceResponse<bool>(true));
    }

    // --- Kural CRUD ---

    [HttpGet("Kural/Listele/{formEid}")]
    public IActionResult KuralListele(string formEid)
    {
        var formId = CryptoHelper.DecryptLong(formEid);
        var response = new ServiceResponse<List<KuralDTO>>();
        response.data = _kuralManager.FormKurallariniGetir(formId);
        return Ok(response);
    }

    [HttpPost("Kural/Kaydet")]
    public IActionResult KuralKaydet([FromBody] KuralDTO dto)
    {
        var response = new ServiceResponse<KuralDTO>();
        response.data = _kuralManager.KuralKaydet(dto);
        return Ok(response);
    }

    [HttpDelete("Kural/Sil/{eid}")]
    public IActionResult KuralSil(string eid)
    {
        var id = CryptoHelper.DecryptLong(eid);
        _kuralManager.KuralSil(id);
        return Ok(new ServiceResponse<bool>(true));
    }
}
```

---

## DTOlar

```csharp
// Form başvuru DTO'ları
public class CevapKaydetReqDTO
{
    public string basvuruEid { get; set; }
    public long basvuruId { get; set; } // CryptoHelper ile çözülür
    public int sayfaNo { get; set; }
    public List<CevapItemDTO> cevaplar { get; set; }
}

public class CevapItemDTO
{
    public long soruId { get; set; }
    public string deger { get; set; }       // Tek değer (text, number, date vb.)
    public string degerJson { get; set; }   // JSON değer (multiselect, address, table vb.)
}

public class BasvuruBaslatResponseDTO
{
    public long basvuruId { get; set; }
    public string basvuruEid => CryptoHelper.EncryptLong(basvuruId);
    public string formAd { get; set; }
    public int sayfaSayisi { get; set; }
}

public class KopyalaReqDTO
{
    public string basvuruEid { get; set; }
    public string kaynakBasvuruEid { get; set; }
}

public class DisServisSecenekReqDTO
{
    public string soruEid { get; set; }
    public string aramaMetni { get; set; }
    public Dictionary<string, string> ekParametreler { get; set; }
}

public class SelectItemDTO
{
    public string value { get; set; }
    public string label { get; set; }
    public string group { get; set; }     // opsiyonel gruplandırma
    public bool disabled { get; set; }
}

public class SiraGuncelleDTO
{
    public string eid { get; set; }
    public int siraNo { get; set; }
}
```
