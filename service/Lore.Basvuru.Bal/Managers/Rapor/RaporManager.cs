using Lore.Basvuru.Bal.Managers.Rapor.Interfaces;
using Lore.Basvuru.Common.DTO.Base.Datatable;
using Lore.Basvuru.Common.DTO.Rapor;
using Lore.Basvuru.Common.Helpers;
using Lore.Basvuru.Common.Logging;
using Lore.Basvuru.Common.Models;
using Lore.Basvuru.Dal.Model;
using Lore.Basvuru.Dal.Repository;
using System.Text;
using System.Xml.Linq;

namespace Lore.Basvuru.Bal.Managers.Rapor
{
    public class RaporManager : IRaporManager
    {
        private readonly IGenericRepository<t_bsv_user_basvuru> _basvuruRepo;
        private readonly IGenericRepository<t_bsv_cevap> _cevapRepo;
        private readonly IGenericRepository<t_frm_soru> _soruRepo;
        private readonly IGenericRepository<t_frm_basvuru_form> _formRepo;

        public RaporManager(
            IGenericRepository<t_bsv_user_basvuru> basvuruRepo,
            IGenericRepository<t_bsv_cevap> cevapRepo,
            IGenericRepository<t_frm_soru> soruRepo,
            IGenericRepository<t_frm_basvuru_form> formRepo)
        {
            _basvuruRepo = basvuruRepo;
            _cevapRepo = cevapRepo;
            _soruRepo = soruRepo;
            _formRepo = formRepo;
        }

        public DatatableResponseDTO<BasvuruRaporSatirDTO> BasvuruListesiGetir(
            BasvuruRaporFiltreDTO filtre, long tenantId)
        {
            var whereParts = new List<string>
            {
                "b.\"TenantId\" = @tenantId",
                "b.\"IsDeleted\" = FALSE"
            };
            var param = new Dapper.DynamicParameters();
            param.Add("tenantId", tenantId);

            if (filtre.formId.HasValue)
            {
                whereParts.Add("b.\"BasvuruFormId\" = @formId");
                param.Add("formId", filtre.formId.Value);
            }
            if (filtre.durum.HasValue)
            {
                whereParts.Add("b.\"Durum\" = @durum");
                param.Add("durum", filtre.durum.Value);
            }
            if (filtre.baslangicTarihi.HasValue)
            {
                whereParts.Add("b.\"BasvuruTarihi\" >= @baslangic");
                param.Add("baslangic", filtre.baslangicTarihi.Value);
            }
            if (filtre.bitisTarihi.HasValue)
            {
                whereParts.Add("b.\"BasvuruTarihi\" <= @bitis");
                param.Add("bitis", filtre.bitisTarihi.Value.Date.AddDays(1));
            }
            if (!string.IsNullOrWhiteSpace(filtre.aramaMetni))
            {
                whereParts.Add("(u.\"Ad\" || ' ' || u.\"Soyad\" ILIKE @arama OR u.\"Email\" ILIKE @arama)");
                param.Add("arama", $"%{filtre.aramaMetni}%");
            }

            var where = string.Join(" AND ", whereParts);
            var offset = (filtre.pageNumber - 1) * filtre.pageSize;
            param.Add("offset", offset);
            param.Add("pageSize", filtre.pageSize);

            var sql = $@"
                SELECT b.""Id"" AS rawId, b.""Durum"",
                       b.""BasvuruTarihi"" AS BaslamaTarihi,
                       b.""TamamlanmaTarih"" AS TamamlamaTarihi,
                       f.""Ad"" AS FormAd,
                       u.""Ad"" || ' ' || u.""Soyad"" AS KullaniciAdSoyad,
                       u.""Email"" AS KullaniciEmail,
                       u.""TcKimlik"",
                       (SELECT COUNT(*) FROM t_bsv_wf_adim_durum d
                        WHERE d.""UserBasvuruId"" = b.""Id"" AND d.""IsDeleted"" = FALSE) AS IslemSayisi
                FROM t_bsv_user_basvuru b
                INNER JOIN t_frm_basvuru_form f ON f.""Id"" = b.""BasvuruFormId""
                INNER JOIN t_sis_user u ON u.""Id"" = b.""UserId""
                WHERE {where}
                ORDER BY b.""BasvuruTarihi"" DESC
                LIMIT @pageSize OFFSET @offset";

            var countSql = $@"
                SELECT COUNT(*)
                FROM t_bsv_user_basvuru b
                INNER JOIN t_frm_basvuru_form f ON f.""Id"" = b.""BasvuruFormId""
                INNER JOIN t_sis_user u ON u.""Id"" = b.""UserId""
                WHERE {where}";

            var data = _basvuruRepo.Query<BasvuruRaporSatirDTO>(sql, param);
            var total = _basvuruRepo.Query<int>(countSql, param).FirstOrDefault();

            foreach (var item in data)
                item.id = item.rawId;

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
                SELECT b.""Id"", b.""Durum"",
                       b.""BasvuruTarihi"" AS BaslamaTarihi,
                       b.""TamamlanmaTarih"" AS TamamlamaTarihi,
                       f.""Ad"" AS FormAd,
                       u.""Ad"" || ' ' || u.""Soyad"" AS KullaniciAdSoyad,
                       u.""Email"", u.""Telefon"", u.""TcKimlik""
                FROM t_bsv_user_basvuru b
                INNER JOIN t_frm_basvuru_form f ON f.""Id"" = b.""BasvuruFormId""
                INNER JOIN t_sis_user u ON u.""Id"" = b.""UserId""
                WHERE b.""Id"" = @bid AND b.""TenantId"" = @tid AND b.""IsDeleted"" = FALSE";

            var detay = _basvuruRepo.Query<AdminBasvuruDetayDTO>(basvuruSql,
                new { bid = basvuruId, tid = tenantId }).FirstOrDefault()
                ?? throw new AppException(404, "Başvuru bulunamadı");

            var cevapSql = @"
                SELECT s.""Etiket"" AS SoruEtiket, s.""SoruTipi"", s.""SiraNo"",
                       c.""CevapMetin"" AS Deger, c.""CevapJson"" AS DegerJson,
                       sa.""SiraNo"" AS SayfaSiraNo, sa.""Ad"" AS SayfaAd
                FROM t_bsv_cevap c
                INNER JOIN t_frm_soru s ON s.""Id"" = c.""SoruId""
                INNER JOIN t_frm_sayfa sa ON sa.""Id"" = s.""SayfaId""
                WHERE c.""UserBasvuruId"" = @bid AND c.""IsDeleted"" = FALSE
                ORDER BY sa.""SiraNo"", s.""SiraNo""";

            detay.cevaplar = _cevapRepo.Query<AdminCevapDTO>(cevapSql, new { bid = basvuruId });

            var wfSql = @"
                SELECT d.""Durum"" AS IslemTipi, d.""Yorum"" AS Aciklama, d.""IslemTarihi"",
                       u.""Ad"" || ' ' || u.""Soyad"" AS IslemYapan,
                       a.""Ad"" AS AdimAd
                FROM t_bsv_wf_adim_durum d
                INNER JOIN t_wf_adim a ON a.""Id"" = d.""WorkflowAdimId""
                LEFT JOIN t_sis_user u ON u.""Id"" = d.""IslemYapanId""
                WHERE d.""UserBasvuruId"" = @bid AND d.""IsDeleted"" = FALSE
                ORDER BY d.""IslemTarihi""";

            detay.workflowGecmisi = _basvuruRepo.Query<WorkflowGecmisDTO>(wfSql, new { bid = basvuruId });

            return detay;
        }

        public byte[] CsvOlustur(BasvuruRaporFiltreDTO filtre, long tenantId)
        {
            filtre.pageNumber = 1;
            filtre.pageSize = int.MaxValue;
            var result = BasvuruListesiGetir(filtre, tenantId);

            var soruKolonlar = new List<SoruKolonDTO>();
            if (filtre.formId.HasValue)
                soruKolonlar = FormSoruKolonlariniGetir(filtre.formId.Value);

            using var ms = new MemoryStream();
            using var sw = new StreamWriter(ms, new UTF8Encoding(true)); // BOM ile

            var basliklar = new List<string>
            {
                "Başvuru ID", "Kullanıcı", "E-posta", "TC Kimlik",
                "Form Adı", "Durum", "Başlama Tarihi", "Tamamlama Tarihi"
            };
            basliklar.AddRange(soruKolonlar.Select(s => s.etiket));
            sw.WriteLine(string.Join(";", basliklar.Select(CsvHucresi)));

            foreach (var satir in result.data)
            {
                var degerler = new List<string>
                {
                    satir.eid ?? "",
                    satir.KullaniciAdSoyad ?? "",
                    satir.KullaniciEmail ?? "",
                    satir.TcKimlik ?? "",
                    satir.FormAd ?? "",
                    BasvuruDurumAd(satir.Durum),
                    satir.BaslamaTarihi?.ToString("dd.MM.yyyy HH:mm") ?? "",
                    satir.TamamlamaTarihi?.ToString("dd.MM.yyyy HH:mm") ?? ""
                };

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

            var soruKolonlar = new List<SoruKolonDTO>();
            if (filtre.formId.HasValue)
                soruKolonlar = FormSoruKolonlariniGetir(filtre.formId.Value);

            var root = new XElement("Basvurular",
                new XAttribute("OlusturmaTarihi", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")),
                new XAttribute("ToplamKayit", result.totalRecords)
            );

            foreach (var satir in result.data)
            {
                var basvuruEl = new XElement("Basvuru",
                    new XAttribute("id", satir.eid ?? ""),
                    new XElement("Kullanici", satir.KullaniciAdSoyad ?? ""),
                    new XElement("Email", satir.KullaniciEmail ?? ""),
                    new XElement("TcKimlik", satir.TcKimlik ?? ""),
                    new XElement("FormAd", satir.FormAd ?? ""),
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
                    SUM(CASE WHEN ""Durum"" = 1 THEN 1 ELSE 0 END) AS Taslak,
                    SUM(CASE WHEN ""Durum"" = 4 THEN 1 ELSE 0 END) AS Tamamlandi,
                    SUM(CASE WHEN ""Durum"" = 5 THEN 1 ELSE 0 END) AS Onaylandi,
                    SUM(CASE WHEN ""Durum"" = 6 THEN 1 ELSE 0 END) AS Reddedildi,
                    MIN(""BasvuruTarihi"") AS IlkBasvuruTarihi,
                    MAX(""BasvuruTarihi"") AS SonBasvuruTarihi
                FROM t_bsv_user_basvuru
                WHERE ""BasvuruFormId"" = @fid AND ""TenantId"" = @tid AND ""IsDeleted"" = FALSE";

            return _basvuruRepo.Query<FormIstatistikDTO>(sql,
                new { fid = formId, tid = tenantId }).FirstOrDefault()
                ?? new FormIstatistikDTO();
        }

        public void DurumGuncelle(DurumGuncelleReqDTO req, long tenantId)
        {
            var basvuruId = CryptoHelper.DecryptLong(req.basvuruEid);
            var basvuru = _basvuruRepo.Get(basvuruId)
                ?? throw new AppException(404, "Başvuru bulunamadı");

            if (basvuru.TenantId != tenantId)
                throw new AppException(403, "Yetkisiz erişim");

            basvuru.Durum = req.yeniDurum;
            _basvuruRepo.Update(basvuru);

            AppLog.Info($"[RaporManager] DurumGuncelle: BasvuruId={basvuruId}, YeniDurum={req.yeniDurum}");
        }

        // ── Yardımcı Metodlar ─────────────────────────────────────

        private List<SoruKolonDTO> FormSoruKolonlariniGetir(long formId)
        {
            var sql = @"
                SELECT s.""Id"" AS soruId, s.""Etiket"" AS etiket, s.""SoruTipi"", s.""SiraNo"",
                       sa.""SiraNo"" AS sayfaSiraNo
                FROM t_frm_soru s
                INNER JOIN t_frm_sayfa sa ON sa.""Id"" = s.""SayfaId""
                WHERE s.""BasvuruFormId"" = @fid AND s.""IsDeleted"" = FALSE
                AND s.""SoruTipi"" != 16
                ORDER BY sa.""SiraNo"", s.""SiraNo""";

            return _soruRepo.Query<SoruKolonDTO>(sql, new { fid = formId });
        }

        private Dictionary<long, string> GetirBasvuruCevaplar(long basvuruId)
        {
            var sql = @"
                SELECT ""SoruId"", COALESCE(""CevapMetin"", ""CevapJson"") AS Deger
                FROM t_bsv_cevap
                WHERE ""UserBasvuruId"" = @bid AND ""IsDeleted"" = FALSE";

            return _cevapRepo.Query<(long SoruId, string Deger)>(sql, new { bid = basvuruId })
                .ToDictionary(x => x.SoruId, x => x.Deger ?? "");
        }

        private static string CsvHucresi(string? deger)
        {
            if (string.IsNullOrEmpty(deger)) return "\"\"";
            deger = deger.Replace("\"", "\"\"");
            return $"\"{deger}\"";
        }

        private static string XmlGuvenliBelirt(string etiket)
        {
            etiket = System.Text.RegularExpressions.Regex.Replace(etiket, @"[^\w]", "_");
            if (etiket.Length > 0 && char.IsDigit(etiket[0])) etiket = "_" + etiket;
            return string.IsNullOrEmpty(etiket) ? "Soru" : etiket;
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
}
