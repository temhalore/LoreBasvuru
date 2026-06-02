# 11 — Raporlama

## Genel Yaklaşım

Raporlama katmanı iki seviyede çalışır:

1. **Admin Raporlama**: Belirli bir forma ait tüm başvuruları, cevap alanlarını dinamik kolon olarak gösterir. CSV/XML export destekler.
2. **Kullanıcı Raporlama**: Giriş yapmış kullanıcı kendi başvurularını görür.

---

## RaporController

```csharp
// Lore.Basvuru.Service/Controllers/Rapor/RaporController.cs
[Route("Api/Rapor")]
[ApiController]
public class RaporController : ControllerBase
{
    private readonly IRaporManager _raporManager;

    /// <summary>
    /// Başvuru listesi (admin — datatable)
    /// </summary>
    [HttpPost("BasvuruListesi")]
    public IActionResult BasvuruListesi([FromBody] BasvuruRaporFiltreDTO filtre)
    {
        var tenantId = HttpContextHelper.GetTenantId();
        var response = new ServiceResponse<DatatableResponseDTO<BasvuruRaporSatirDTO>>();
        response.data = _raporManager.BasvuruListesiGetir(filtre, tenantId);
        return Ok(response);
    }

    /// <summary>
    /// Başvuru detay (admin — tek başvuru tüm cevaplarıyla)
    /// </summary>
    [HttpGet("BasvuruDetay/{basvuruEid}")]
    public IActionResult BasvuruDetay(string basvuruEid)
    {
        var basvuruId = CryptoHelper.DecryptLong(basvuruEid);
        var tenantId = HttpContextHelper.GetTenantId();
        var response = new ServiceResponse<AdminBasvuruDetayDTO>();
        response.data = _raporManager.AdminBasvuruDetayGetir(basvuruId, tenantId);
        return Ok(response);
    }

    /// <summary>
    /// CSV İndir — tüm filtreli başvurular
    /// </summary>
    [HttpPost("CsvIndir")]
    public IActionResult CsvIndir([FromBody] BasvuruRaporFiltreDTO filtre)
    {
        var tenantId = HttpContextHelper.GetTenantId();
        var csvBytes = _raporManager.CsvOlustur(filtre, tenantId);
        return File(csvBytes, "text/csv", $"basvurular_{DateTime.Now:yyyyMMdd_HHmmss}.csv");
    }

    /// <summary>
    /// XML İndir — tüm filtreli başvurular
    /// </summary>
    [HttpPost("XmlIndir")]
    public IActionResult XmlIndir([FromBody] BasvuruRaporFiltreDTO filtre)
    {
        var tenantId = HttpContextHelper.GetTenantId();
        var xmlBytes = _raporManager.XmlOlustur(filtre, tenantId);
        return File(xmlBytes, "application/xml", $"basvurular_{DateTime.Now:yyyyMMdd_HHmmss}.xml");
    }

    /// <summary>
    /// Form özet istatistikleri (grafik için)
    /// </summary>
    [HttpGet("FormIstatistik/{formEid}")]
    public IActionResult FormIstatistik(string formEid)
    {
        var formId = CryptoHelper.DecryptLong(formEid);
        var tenantId = HttpContextHelper.GetTenantId();
        var response = new ServiceResponse<FormIstatistikDTO>();
        response.data = _raporManager.FormIstatistikGetir(formId, tenantId);
        return Ok(response);
    }

    /// <summary>
    /// Başvuru durumunu güncelle (admin işlemi)
    /// </summary>
    [HttpPost("DurumGuncelle")]
    public IActionResult DurumGuncelle([FromBody] DurumGuncelleReqDTO req)
    {
        var tenantId = HttpContextHelper.GetTenantId();
        _raporManager.DurumGuncelle(req, tenantId);
        return Ok(new ServiceResponse<bool>(true));
    }
}
```

---

## RaporManager

```csharp
// Lore.Basvuru.Bal/Managers/Rapor/RaporManager.cs
public interface IRaporManager
{
    DatatableResponseDTO<BasvuruRaporSatirDTO> BasvuruListesiGetir(
        BasvuruRaporFiltreDTO filtre, long tenantId);
    AdminBasvuruDetayDTO AdminBasvuruDetayGetir(long basvuruId, long tenantId);
    byte[] CsvOlustur(BasvuruRaporFiltreDTO filtre, long tenantId);
    byte[] XmlOlustur(BasvuruRaporFiltreDTO filtre, long tenantId);
    FormIstatistikDTO FormIstatistikGetir(long formId, long tenantId);
    void DurumGuncelle(DurumGuncelleReqDTO req, long tenantId);
}

public class RaporManager : IRaporManager
{
    private readonly IGenericRepository<t_bsv_user_basvuru> _basvuruRepo;
    private readonly IGenericRepository<t_bsv_cevap> _cevapRepo;
    private readonly IGenericRepository<t_frm_soru> _soruRepo;
    private readonly IGenericRepository<t_frm_basvuru_form> _formRepo;
    private readonly IMapper _mapper;

    public DatatableResponseDTO<BasvuruRaporSatirDTO> BasvuruListesiGetir(
        BasvuruRaporFiltreDTO filtre, long tenantId)
    {
        // Dinamik WHERE oluştur
        var whereParts = new List<string> { "b.TenantId = @tenantId", "b.IsDeleted = 0" };
        var param = new DynamicParameters();
        param.Add("tenantId", tenantId);

        if (filtre.formId.HasValue)
        {
            whereParts.Add("b.BasvuruFormId = @formId");
            param.Add("formId", filtre.formId.Value);
        }
        if (filtre.durum.HasValue)
        {
            whereParts.Add("b.Durum = @durum");
            param.Add("durum", filtre.durum.Value);
        }
        if (filtre.baslangicTarihi.HasValue)
        {
            whereParts.Add("b.BaslamaTarihi >= @baslangic");
            param.Add("baslangic", filtre.baslangicTarihi.Value);
        }
        if (filtre.bitisTarihi.HasValue)
        {
            whereParts.Add("b.BaslamaTarihi <= @bitis");
            param.Add("bitis", filtre.bitisTarihi.Value.Date.AddDays(1));
        }
        if (!string.IsNullOrWhiteSpace(filtre.aramaMetni))
        {
            whereParts.Add("(u.Ad + ' ' + u.Soyad LIKE @arama OR u.Email LIKE @arama)");
            param.Add("arama", $"%{filtre.aramaMetni}%");
        }

        var where = string.Join(" AND ", whereParts);
        var offset = (filtre.pageNumber - 1) * filtre.pageSize;
        param.Add("offset", offset);
        param.Add("pageSize", filtre.pageSize);

        var sql = $@"
            SELECT b.Id, b.Durum, b.BaslamaTarihi, b.TamamlamaTarihi,
                   f.Ad AS FormAd,
                   u.Ad + ' ' + u.Soyad AS KullaniciAdSoyad,
                   u.Email AS KullaniciEmail,
                   u.TcKimlik,
                   (SELECT COUNT(*) FROM t_wf_adim_islem ai
                    INNER JOIN t_wf_workflow_adim wa ON wa.Id = ai.WorkflowAdimId
                    WHERE ai.BasvuruId = b.Id AND ai.IsDeleted = 0) AS IslemSayisi
            FROM t_bsv_user_basvuru b
            INNER JOIN t_frm_basvuru_form f ON f.Id = b.BasvuruFormId
            INNER JOIN t_sis_user u ON u.Id = b.UserId
            WHERE {where}
            ORDER BY b.BaslamaTarihi DESC
            OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY";

        var countSql = $@"
            SELECT COUNT(*)
            FROM t_bsv_user_basvuru b
            INNER JOIN t_frm_basvuru_form f ON f.Id = b.BasvuruFormId
            INNER JOIN t_sis_user u ON u.Id = b.UserId
            WHERE {where}";

        var data = _basvuruRepo.Query<BasvuruRaporSatirDTO>(sql, param);
        var total = _basvuruRepo.Query<int>(countSql, param).FirstOrDefault();

        // EID hesapla
        foreach (var item in data)
            item.eid = CryptoHelper.EncryptLong(item.rawId);

        return new DatatableResponseDTO<BasvuruRaporSatirDTO>
        {
            data = data,
            totalRecords = total,
            pageNumber = filtre.pageNumber,
            pageSize = filtre.pageSize
        };
    }

    public AdminBasvuruDetayDTO AdminBasvuruDetayGetir(long basvuruId, long tenantId)
    {
        var basvuruSql = @"
            SELECT b.Id, b.Durum, b.BaslamaTarihi, b.TamamlamaTarihi,
                   f.Ad AS FormAd,
                   u.Ad + ' ' + u.Soyad AS KullaniciAdSoyad,
                   u.Email, u.Telefon, u.TcKimlik
            FROM t_bsv_user_basvuru b
            INNER JOIN t_frm_basvuru_form f ON f.Id = b.BasvuruFormId
            INNER JOIN t_sis_user u ON u.Id = b.UserId
            WHERE b.Id = @bid AND b.TenantId = @tid AND b.IsDeleted = 0";

        var detay = _basvuruRepo.Query<AdminBasvuruDetayDTO>(basvuruSql,
            new { bid = basvuruId, tid = tenantId }).FirstOrDefault();

        if (detay == null)
            throw new AppException(404, "Başvuru bulunamadı");

        // Cevaplar
        var cevapSql = @"
            SELECT s.Etiket AS SoruEtiket, s.SoruTipi, s.SiraNo,
                   c.Deger, c.DegerJson, sa.SiraNo AS SayfaSiraNo, sa.Ad AS SayfaAd
            FROM t_bsv_cevap c
            INNER JOIN t_frm_soru s ON s.Id = c.SoruId
            INNER JOIN t_frm_sayfa sa ON sa.Id = s.SayfaId
            WHERE c.BasvuruId = @bid AND c.IsDeleted = 0
            ORDER BY sa.SiraNo, s.SiraNo";

        detay.cevaplar = _cevapRepo.Query<AdminCevapDTO>(cevapSql, new { bid = basvuruId });

        // Workflow geçmişi
        var wfSql = @"
            SELECT ai.IslemTipi, ai.Aciklama, ai.CreatedDate AS IslemTarihi,
                   u.Ad + ' ' + u.Soyad AS IslemYapan,
                   wa.Ad AS AdimAd
            FROM t_wf_adim_islem ai
            INNER JOIN t_wf_workflow_adim wa ON wa.Id = ai.WorkflowAdimId
            INNER JOIN t_sis_user u ON u.Id = ai.CreatedUser
            WHERE ai.BasvuruId = @bid AND ai.IsDeleted = 0
            ORDER BY ai.CreatedDate";

        detay.workflowGecmisi = _basvuruRepo.Query<WorkflowGecmisDTO>(wfSql, new { bid = basvuruId });

        return detay;
    }

    public byte[] CsvOlustur(BasvuruRaporFiltreDTO filtre, long tenantId)
    {
        // Tüm sayfaları çek (pageSize = int.MaxValue)
        filtre.pageNumber = 1;
        filtre.pageSize = int.MaxValue;
        var result = BasvuruListesiGetir(filtre, tenantId);

        // Formun dinamik soru kolonlarını belirle
        List<SoruKolonDTO> soruKolonlar = new();
        if (filtre.formId.HasValue)
            soruKolonlar = FormSoruKolonlariniGetir(filtre.formId.Value);

        using var ms = new MemoryStream();
        using var sw = new StreamWriter(ms, Encoding.UTF8);

        // BOM (Excel Türkçe uyumu için)
        sw.Write('﻿');

        // Başlık satırı
        var basliklar = new List<string>
        {
            "Başvuru ID", "Kullanıcı", "E-posta", "TC Kimlik",
            "Form Adı", "Durum", "Başlama Tarihi", "Tamamlama Tarihi"
        };
        basliklar.AddRange(soruKolonlar.Select(s => s.etiket));
        sw.WriteLine(string.Join(";", basliklar.Select(CsvHucresi)));

        // Veri satırları
        foreach (var satir in result.data)
        {
            var degerler = new List<string>
            {
                satir.eid,
                satir.KullaniciAdSoyad,
                satir.KullaniciEmail,
                satir.TcKimlik,
                satir.FormAd,
                BasvuruDurumAd(satir.Durum),
                satir.BaslamaTarihi?.ToString("dd.MM.yyyy HH:mm"),
                satir.TamamlamaTarihi?.ToString("dd.MM.yyyy HH:mm")
            };

            // Soru cevaplarını ekle
            if (soruKolonlar.Any())
            {
                var cevaplar = GetirBasvuruCevaplar(satir.rawId);
                foreach (var kolon in soruKolonlar)
                    degerler.Add(cevaplar.TryGetValue(kolon.soruId, out var deger) ? deger : "");
            }

            sw.WriteLine(string.Join(";", degerler.Select(CsvHucresi)));
        }

        sw.Flush();
        return ms.ToArray();
    }

    public byte[] XmlOlustur(BasvuruRaporFiltreDTO filtre, long tenantId)
    {
        filtre.pageNumber = 1;
        filtre.pageSize = int.MaxValue;
        var result = BasvuruListesiGetir(filtre, tenantId);
        List<SoruKolonDTO> soruKolonlar = new();
        if (filtre.formId.HasValue)
            soruKolonlar = FormSoruKolonlariniGetir(filtre.formId.Value);

        var root = new XElement("Basvurular",
            new XAttribute("OlusturmaTarihi", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")),
            new XAttribute("ToplamKayit", result.totalRecords)
        );

        foreach (var satir in result.data)
        {
            var basvuruEl = new XElement("Basvuru",
                new XAttribute("id", satir.eid),
                new XElement("Kullanici", satir.KullaniciAdSoyad),
                new XElement("Email", satir.KullaniciEmail ?? ""),
                new XElement("TcKimlik", satir.TcKimlik ?? ""),
                new XElement("FormAd", satir.FormAd),
                new XElement("Durum", BasvuruDurumAd(satir.Durum)),
                new XElement("BaslamaTarihi", satir.BaslamaTarihi?.ToString("yyyy-MM-dd HH:mm:ss") ?? ""),
                new XElement("TamamlamaTarihi", satir.TamamlamaTarihi?.ToString("yyyy-MM-dd HH:mm:ss") ?? "")
            );

            if (soruKolonlar.Any())
            {
                var cevaplarEl = new XElement("Cevaplar");
                var cevaplar = GetirBasvuruCevaplar(satir.rawId);
                foreach (var kolon in soruKolonlar)
                {
                    cevaplarEl.Add(new XElement(XmlGuvenliBelirt(kolon.etiket),
                        cevaplar.TryGetValue(kolon.soruId, out var deger) ? deger : ""));
                }
                basvuruEl.Add(cevaplarEl);
            }

            root.Add(basvuruEl);
        }

        using var ms = new MemoryStream();
        var doc = new XDocument(new XDeclaration("1.0", "UTF-8", null), root);
        doc.Save(ms);
        return ms.ToArray();
    }

    public FormIstatistikDTO FormIstatistikGetir(long formId, long tenantId)
    {
        var sql = @"
            SELECT
                COUNT(*) AS ToplamBasvuru,
                SUM(CASE WHEN Durum = 1 THEN 1 ELSE 0 END) AS Taslak,
                SUM(CASE WHEN Durum = 4 THEN 1 ELSE 0 END) AS Tamamlandi,
                SUM(CASE WHEN Durum = 5 THEN 1 ELSE 0 END) AS Onaylandi,
                SUM(CASE WHEN Durum = 6 THEN 1 ELSE 0 END) AS Reddedildi,
                MIN(BaslamaTarihi) AS IlkBasvuruTarihi,
                MAX(BaslamaTarihi) AS SonBasvuruTarihi
            FROM t_bsv_user_basvuru
            WHERE BasvuruFormId = @fid AND TenantId = @tid AND IsDeleted = 0";

        return _basvuruRepo.Query<FormIstatistikDTO>(sql,
            new { fid = formId, tid = tenantId }).FirstOrDefault()
            ?? new FormIstatistikDTO();
    }

    public void DurumGuncelle(DurumGuncelleReqDTO req, long tenantId)
    {
        var basvuruId = CryptoHelper.DecryptLong(req.basvuruEid);
        var basvuru = _basvuruRepo.Get(basvuruId);

        if (basvuru == null || basvuru.TenantId != tenantId)
            throw new AppException(404, "Başvuru bulunamadı");

        basvuru.Durum = req.yeniDurum;
        basvuru.AdminNotu = req.aciklama;
        _basvuruRepo.Update(basvuru);

        AppLog.Info($"[RaporManager] DurumGuncelle: BasvuruId={basvuruId}, YeniDurum={req.yeniDurum}");
    }

    // --- Yardımcı metodlar ---

    private List<SoruKolonDTO> FormSoruKolonlariniGetir(long formId)
    {
        var sql = @"
            SELECT s.Id AS soruId, s.Etiket AS etiket, s.SoruTipi, s.SiraNo,
                   sa.SiraNo AS sayfaSiraNo
            FROM t_frm_soru s
            INNER JOIN t_frm_sayfa sa ON sa.Id = s.SayfaId
            WHERE s.BasvuruFormId = @fid AND s.IsDeleted = 0 AND s.AktifMi = 1
            AND s.SoruTipi NOT IN (16) -- info tipini dışla
            ORDER BY sa.SiraNo, s.SiraNo";

        return _soruRepo.Query<SoruKolonDTO>(sql, new { fid = formId });
    }

    private Dictionary<long, string> GetirBasvuruCevaplar(long basvuruId)
    {
        var sql = @"
            SELECT SoruId, COALESCE(Deger, DegerJson) AS Deger
            FROM t_bsv_cevap
            WHERE BasvuruId = @bid AND IsDeleted = 0";

        return _cevapRepo.Query<(long SoruId, string Deger)>(sql, new { bid = basvuruId })
            .ToDictionary(x => x.SoruId, x => x.Deger ?? "");
    }

    private static string CsvHucresi(string deger)
    {
        if (string.IsNullOrEmpty(deger)) return "\"\"";
        deger = deger.Replace("\"", "\"\"");
        return $"\"{deger}\"";
    }

    private static string XmlGuvenliBelirt(string etiket)
    {
        // XML element adı için geçersiz karakterleri temizle
        etiket = System.Text.RegularExpressions.Regex.Replace(etiket, @"[^\w]", "_");
        if (char.IsDigit(etiket[0])) etiket = "_" + etiket;
        return etiket;
    }

    private static string BasvuruDurumAd(int durum) => durum switch
    {
        1 => "Taslak",
        2 => "Devam Ediyor",
        3 => "Onay Bekliyor",
        4 => "Tamamlandı",
        5 => "Onaylandı",
        6 => "Reddedildi",
        7 => "İade Edildi",
        _ => "Bilinmiyor"
    };
}
```

---

## DTOlar

```csharp
public class BasvuruRaporFiltreDTO
{
    public long? formId { get; set; }
    public int? durum { get; set; }
    public DateTime? baslangicTarihi { get; set; }
    public DateTime? bitisTarihi { get; set; }
    public string aramaMetni { get; set; }
    public int pageNumber { get; set; } = 1;
    public int pageSize { get; set; } = 20;
}

public class BasvuruRaporSatirDTO : BaseDTO
{
    [JsonIgnore]
    public long rawId { get; set; }
    public int Durum { get; set; }
    public DateTime? BaslamaTarihi { get; set; }
    public DateTime? TamamlamaTarihi { get; set; }
    public string FormAd { get; set; }
    public string KullaniciAdSoyad { get; set; }
    public string KullaniciEmail { get; set; }
    public string TcKimlik { get; set; }
    public int IslemSayisi { get; set; }
}

public class AdminBasvuruDetayDTO : BaseDTO
{
    public int Durum { get; set; }
    public DateTime? BaslamaTarihi { get; set; }
    public DateTime? TamamlamaTarihi { get; set; }
    public string FormAd { get; set; }
    public string KullaniciAdSoyad { get; set; }
    public string Email { get; set; }
    public string Telefon { get; set; }
    public string TcKimlik { get; set; }
    public List<AdminCevapDTO> cevaplar { get; set; }
    public List<WorkflowGecmisDTO> workflowGecmisi { get; set; }
}

public class AdminCevapDTO
{
    public string SoruEtiket { get; set; }
    public int SoruTipi { get; set; }
    public int SiraNo { get; set; }
    public string Deger { get; set; }
    public string DegerJson { get; set; }
    public int SayfaSiraNo { get; set; }
    public string SayfaAd { get; set; }
    // Görüntülenecek değer (frontend formatlar veya backend dönüştürür)
    [JsonIgnore]
    public string GosterilecekDeger => !string.IsNullOrEmpty(Deger) ? Deger : DegerJson;
}

public class FormIstatistikDTO
{
    public int ToplamBasvuru { get; set; }
    public int Taslak { get; set; }
    public int Tamamlandi { get; set; }
    public int Onaylandi { get; set; }
    public int Reddedildi { get; set; }
    public DateTime? IlkBasvuruTarihi { get; set; }
    public DateTime? SonBasvuruTarihi { get; set; }
}

public class DurumGuncelleReqDTO
{
    public string basvuruEid { get; set; }
    public int yeniDurum { get; set; }
    public string aciklama { get; set; }
}

public class SoruKolonDTO
{
    public long soruId { get; set; }
    public string etiket { get; set; }
    public int SoruTipi { get; set; }
    public int SiraNo { get; set; }
    public int sayfaSiraNo { get; set; }
}

public class WorkflowGecmisDTO
{
    public int IslemTipi { get; set; }
    public string Aciklama { get; set; }
    public DateTime IslemTarihi { get; set; }
    public string IslemYapan { get; set; }
    public string AdimAd { get; set; }
    public string IslemTipiAd => IslemTipi switch
    {
        1 => "Onaylandı",
        2 => "Reddedildi",
        3 => "İade Edildi",
        _ => "Bilinmiyor"
    };
}
```
