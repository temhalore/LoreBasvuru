# 09 — Workflow (Onay Akışı) Motoru

## Kavramlar

| Kavram | Açıklama |
|--------|---------|
| **Workflow** | Onay akışının tanımı (birden fazla adımdan oluşur) |
| **Adım** | Workflow'un her bir onay basamağı |
| **Adım Rol** | Bir adımı kimlerin yönetebileceği (roller) |
| **Adım Durum** | Başvurunun belirli bir adımdaki durumu |
| **Rol Filtre** | Adım içinde başvuruları kime göstereceğini belirler |

---

## Workflow Akış Örneği

```
[Başvuru Tamamlandı]
        ↓
[Adım 1: Ön İnceleme] ← Sekreterlik Rolü
    ↓ Onayla    ↓ İade
[Adım 2: Değerlendirme] ← Komite Rolü
    ↓ Onayla    ↓ Red
[SONUÇ: Onaylandı] / [SONUÇ: Reddedildi]
```

---

## WorkflowController

```csharp
// Lore.Basvuru.Service/Controllers/Workflow/WorkflowController.cs
[Route("Api/Workflow")]
[ApiController]
public class WorkflowController : ControllerBase
{
    private readonly IWorkflowManager _wfManager;

    public WorkflowController(IWorkflowManager wfManager)
    {
        _wfManager = wfManager;
    }

    // ── Workflow Tanımlama (Admin) ──────────────────────────────

    [HttpPost("Listele")]
    public IActionResult WorkflowListele()
    {
        var response = new ServiceResponse<List<WorkflowDTO>>();
        response.data = _wfManager.WorkflowListele();
        return Ok(response);
    }

    [HttpPost("Kaydet")]
    public IActionResult WorkflowKaydet([FromBody] WorkflowDTO dto)
    {
        var response = new ServiceResponse<WorkflowDTO>();
        response.data = _wfManager.WorkflowKaydet(dto);
        return Ok(response);
    }

    [HttpPost("Sil")]
    public IActionResult WorkflowSil([FromBody] EidDTO req)
    {
        _wfManager.WorkflowSil(req.id);
        return Ok(new ServiceResponse<bool>(true));
    }

    [HttpPost("Adim/Kaydet")]
    public IActionResult AdimKaydet([FromBody] WorkflowAdimDTO dto)
    {
        var response = new ServiceResponse<WorkflowAdimDTO>();
        response.data = _wfManager.AdimKaydet(dto);
        return Ok(response);
    }

    [HttpPost("Adim/RolAta")]
    public IActionResult AdimRolAta([FromBody] AdimRolAtaReqDTO req)
    {
        _wfManager.AdimRolAta(req);
        return Ok(new ServiceResponse<bool>(true));
    }

    [HttpPost("Adim/RolFiltresiKaydet")]
    public IActionResult AdimRolFiltresiKaydet([FromBody] AdimRolFiltreReqDTO req)
    {
        _wfManager.AdimRolFiltresiKaydet(req);
        return Ok(new ServiceResponse<bool>(true));
    }

    // ── Onay İşlemleri ─────────────────────────────────────────

    [HttpPost("OnayBekleyenler")]
    public IActionResult OnayBekleyenleriGetir(
        [FromBody] DatatableRequestDTO<BasvuruOnayFiltrDTO> req)
    {
        var response = new ServiceResponse<DatatableResponseDTO<BasvuruOnayListDTO>>();
        response.data = _wfManager.OnayBekleyenleriGetir(req);
        return Ok(response);
    }

    [HttpPost("AdimIslem")]
    public IActionResult AdimIslemYap([FromBody] WorkflowAdimIslemReqDTO req)
    {
        _wfManager.AdimIslemYap(req);
        return Ok(new ServiceResponse<bool>(true));
    }

    [HttpPost("BasvuruAkisGecmisi")]
    public IActionResult BasvuruAkisGecmisiniGetir([FromBody] EidDTO req)
    {
        var response = new ServiceResponse<List<WorkflowAdimDurumDTO>>();
        response.data = _wfManager.BasvuruAkisGecmisiniGetir(req.id);
        return Ok(response);
    }
}
```

---

## WorkflowManager (Tam Implementasyon)

```csharp
// Lore.Basvuru.Bal/Managers/Workflow/WorkflowManager.cs
public class WorkflowManager : IWorkflowManager
{
    private readonly IGenericRepository<t_wf_workflow> _wfRepo;
    private readonly IGenericRepository<t_wf_adim> _adimRepo;
    private readonly IGenericRepository<t_wf_adim_rol> _adimRolRepo;
    private readonly IGenericRepository<t_wf_adim_rol_filtre> _adimRolFiltreRepo;
    private readonly IGenericRepository<t_bsv_user_basvuru> _basvuruRepo;
    private readonly IGenericRepository<t_bsv_wf_adim_durum> _adimDurumRepo;
    private readonly IGenericRepository<t_bsv_cevap> _cevapRepo;
    private readonly IGenericRepository<t_sis_rol_kullanici> _rolKullaniciRepo;
    private readonly IMapper _mapper;

    // ── Workflow Tanımlama ────────────────────────────────────────

    public WorkflowDTO WorkflowKaydet(WorkflowDTO dto)
    {
        var tenantId = HttpContextHelper.GetTenantId();
        var entity = _mapper.Map<t_wf_workflow>(dto);
        entity.TenantId = tenantId;

        if (dto.id > 0)
        {
            entity.Id = dto.id;
            _wfRepo.Update(entity);
        }
        else
        {
            var newId = _wfRepo.Insert(entity);
            dto.id = newId;
        }

        return dto;
    }

    public WorkflowAdimDTO AdimKaydet(WorkflowAdimDTO dto)
    {
        var entity = _mapper.Map<t_wf_adim>(dto);
        entity.TenantId = HttpContextHelper.GetTenantId();

        if (dto.id > 0)
        {
            entity.Id = dto.id;
            _adimRepo.Update(entity);
        }
        else
        {
            var newId = _adimRepo.Insert(entity);
            dto.id = newId;
        }

        return dto;
    }

    public void AdimRolAta(AdimRolAtaReqDTO req)
    {
        // Mevcut rol atamalarını sil
        var mevcutlar = _adimRolRepo.GetList(
            "WorkflowAdimId = @aid AND IsDeleted = 0",
            new { aid = req.adimId });
        _adimRolRepo.DeleteAll(mevcutlar.Select(x => x.Id).ToList());

        // Yeni atamalar
        var yeniAtamalar = req.rolIdler.Select(rolId => new t_wf_adim_rol
        {
            TenantId = HttpContextHelper.GetTenantId(),
            WorkflowAdimId = req.adimId,
            RolId = rolId
        }).ToList();
        _adimRolRepo.InsertAll(yeniAtamalar);
    }

    // ── Rol Filtresi ─────────────────────────────────────────────
    // Örnek: "Birim alanı = 'Bilgi İşlem' ise sadece Bilgi İşlem yetkilileri görsün"

    public void AdimRolFiltresiKaydet(AdimRolFiltreReqDTO req)
    {
        var entity = new t_wf_adim_rol_filtre
        {
            TenantId = HttpContextHelper.GetTenantId(),
            WorkflowAdimRolId = req.adimRolId,
            SoruId = req.soruId,
            Operator = req.operator_,
            FiltreJson = JsonConvert.SerializeObject(req.filtreDegerleri)
        };

        if (req.id > 0)
        {
            entity.Id = req.id;
            _adimRolFiltreRepo.Update(entity);
        }
        else
        {
            _adimRolFiltreRepo.Insert(entity);
        }
    }

    // ── Onay İşlemleri ────────────────────────────────────────────

    public DatatableResponseDTO<BasvuruOnayListDTO> OnayBekleyenleriGetir(
        DatatableRequestDTO<BasvuruOnayFiltrDTO> req)
    {
        var userId = HttpContextHelper.GetUserId();
        var tenantId = HttpContextHelper.GetTenantId();

        // Kullanıcının rollerini al
        var kullaniciRolleri = _rolKullaniciRepo.GetList(
            "UserId = @uid AND IsDeleted = 0",
            new { uid = userId })
            .Select(r => r.RolId).ToList();

        if (!kullaniciRolleri.Any())
            return new DatatableResponseDTO<BasvuruOnayListDTO>
            { data = new List<BasvuruOnayListDTO>(), totalRecords = 0 };

        // Bu rollerin yönetebileceği aktif adımları bul
        var adimRolSql = @"
            SELECT DISTINCT ar.WorkflowAdimId
            FROM t_wf_adim_rol ar
            WHERE ar.RolId IN @roller AND ar.IsDeleted = 0";

        var yonetilenbilirAdimlar = _adimRolRepo
            .Query<long>(adimSql, new { roller = kullaniciRolleri });

        // Bu adımlardaki bekleyen başvuruları getir
        var sql = @"
            SELECT b.Id, b.CreatedDate BasvuruTarihi, b.Durum,
                   f.Ad FormAdi, u.Ad + ' ' + u.Soyad BasvuranAdSoyad,
                   u.Email, a.Ad AktifAdimAdi
            FROM t_bsv_user_basvuru b
            INNER JOIN t_frm_basvuru_form f ON f.Id = b.BasvuruFormId
            INNER JOIN t_sis_user u ON u.Id = b.UserId
            INNER JOIN t_wf_adim a ON a.Id = b.AktifAdimId
            WHERE b.TenantId = @tid
            AND b.AktifAdimId IN @adimlar
            AND b.Durum = 3
            AND b.IsDeleted = 0
            ORDER BY b.CreatedDate DESC
            OFFSET (@page - 1) * @size ROWS FETCH NEXT @size ROWS ONLY";

        var data = _basvuruRepo.Query<BasvuruOnayListDTO>(sql, new
        {
            tid = tenantId,
            adimlar = yonetilenbilirAdimlar,
            page = req.pageNumber,
            size = req.pageSize
        });

        // Rol filtrelerini uygula (dinamik alan bazlı filtreleme)
        data = RolFiltresiniUygula(data, kullaniciRolleri, userId);

        // EID mapping
        foreach (var item in data)
            item.id = item.rawId;

        return new DatatableResponseDTO<BasvuruOnayListDTO>
        {
            data = data,
            totalRecords = data.Count, // TODO: ayrı count sorgusu
            pageNumber = req.pageNumber,
            pageSize = req.pageSize
        };
    }

    /// <summary>
    /// Dinamik rol filtresi:
    /// Örnek kural: "Doğum tarihi 2000-01-01'den büyük olanları sadece Genç Rol yönetsin"
    /// Ya da: "Birim seçimi = 'BİLGİ İŞLEM' ise sadece BİLGİ İŞLEM rolü görsün"
    /// </summary>
    private List<BasvuruOnayListDTO> RolFiltresiniUygula(
        List<BasvuruOnayListDTO> liste,
        List<long> kullaniciRolleri,
        long userId)
    {
        var filtrelenmisListe = new List<BasvuruOnayListDTO>();

        foreach (var basvuru in liste)
        {
            // Bu başvurunun aktif adımındaki rol filtrelerini getir
            var filtreKurallari = _adimRolFiltreRepo.Query<RolFiltreDetayDTO>(
                @"SELECT arf.*, ar.RolId
                  FROM t_wf_adim_rol_filtre arf
                  INNER JOIN t_wf_adim_rol ar ON ar.Id = arf.WorkflowAdimRolId
                  WHERE ar.WorkflowAdimId = @adimId
                  AND ar.RolId IN @roller
                  AND arf.IsDeleted = 0",
                new { adimId = basvuru.aktifAdimId, roller = kullaniciRolleri });

            if (!filtreKurallari.Any())
            {
                // Filtre yok → göster
                filtrelenmisListe.Add(basvuru);
                continue;
            }

            // Başvurunun ilgili soru cevaplarını al
            var cevaplar = _cevapRepo.GetList(
                "UserBasvuruId = @bid AND IsDeleted = 0",
                new { bid = basvuru.id });

            // Tüm filtre kurallarını değerlendir
            var filtreTamam = true;
            foreach (var kural in filtreKurallari)
            {
                var cevap = cevaplar.FirstOrDefault(c => c.SoruId == kural.SoruId);
                if (!FiltreKosuluSaglandıMi(cevap, kural.Operator, kural.FiltreJson))
                {
                    filtreTamam = false;
                    break;
                }
            }

            if (filtreTamam)
                filtrelenmisListe.Add(basvuru);
        }

        return filtrelenmisListe;
    }

    private bool FiltreKosuluSaglandıMi(t_bsv_cevap cevap, string operator_, string filtreJson)
    {
        if (cevap == null) return false;

        var filtreData = JsonConvert.DeserializeObject<dynamic>(filtreJson);
        var cevapDeger = cevap.CevapMetin ?? cevap.CevapSayi?.ToString() ?? cevap.CevapTarih?.ToString("yyyy-MM-dd");

        return operator_ switch
        {
            "equals" => cevapDeger == (string)filtreData.deger,
            "notEquals" => cevapDeger != (string)filtreData.deger,
            "greaterThan" => cevap.CevapTarih.HasValue
                ? cevap.CevapTarih.Value > DateTime.Parse((string)filtreData.deger)
                : (cevap.CevapSayi ?? 0) > (decimal)filtreData.deger,
            "lessThan" => cevap.CevapTarih.HasValue
                ? cevap.CevapTarih.Value < DateTime.Parse((string)filtreData.deger)
                : (cevap.CevapSayi ?? 0) < (decimal)filtreData.deger,
            "in" => ((IEnumerable<string>)filtreData.degerler.ToObject<List<string>>())
                .Contains(cevapDeger),
            "notIn" => !((IEnumerable<string>)filtreData.degerler.ToObject<List<string>>())
                .Contains(cevapDeger),
            _ => true
        };
    }

    public List<WorkflowAdimDurumDTO> BasvuruAkisGecmisiniGetir(long userBasvuruId)
    {
        var sql = @"
            SELECT d.Id, d.WorkflowAdimId, d.Durum, d.IslemTarihi, d.Yorum,
                   a.Ad AdimAdi, a.SiraNo,
                   u.Ad + ' ' + u.Soyad IslemYapan
            FROM t_bsv_wf_adim_durum d
            INNER JOIN t_wf_adim a ON a.Id = d.WorkflowAdimId
            LEFT JOIN t_sis_user u ON u.Id = d.IslemYapanId
            WHERE d.UserBasvuruId = @bid AND d.IsDeleted = 0
            ORDER BY a.SiraNo, d.CreatedDate";

        return _adimDurumRepo.Query<WorkflowAdimDurumDTO>(sql, new { bid = userBasvuruId });
    }
}
```

---

## Workflow DTO'ları

```csharp
public class WorkflowDTO : BaseDTO
{
    public string ad { get; set; }
    public string aciklama { get; set; }
    public bool aktifMi { get; set; }
    public List<WorkflowAdimDTO> adimlar { get; set; }
}

public class WorkflowAdimDTO : BaseDTO
{
    public string workflowEid { get; set; }
    public string ad { get; set; }
    public string aciklama { get; set; }
    public int siraNo { get; set; }
    public int adimTipi { get; set; }        // 1=Onay, 2=Bilgi, 3=İade
    public bool ilkAdimMi { get; set; }
    public bool sonAdimMi { get; set; }
    public bool otomatikGecMi { get; set; }
    public List<WorkflowAdimRolDTO> roller { get; set; }
}

public class WorkflowAdimIslemReqDTO
{
    public string userBasvuruEid { get; set; }
    public long userBasvuruId => long.Parse(CryptoHelper.DecryptString(userBasvuruEid));
    public string adimEid { get; set; }
    public long adimId => long.Parse(CryptoHelper.DecryptString(adimEid));
    public int islemTipi { get; set; }       // 2=Onayla, 3=Reddet, 4=İade
    public string yorum { get; set; }
}

public class AdimRolFiltreReqDTO
{
    public long adimRolId { get; set; }
    public long soruId { get; set; }
    public string operator_ { get; set; }    // equals, greaterThan, in vb.
    public object filtreDegerleri { get; set; }
    public long id { get; set; }             // güncelleme için
}
```
