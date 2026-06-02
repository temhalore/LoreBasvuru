using AutoMapper;
using Lore.Basvuru.Bal.Managers.Form.Interfaces;
using Lore.Basvuru.Bal.Managers.Workflow.Interfaces;
using Lore.Basvuru.Common.DTO.Base;
using Lore.Basvuru.Common.DTO.Form.FormBuild;
using Lore.Basvuru.Common.DTO.Form.FormRespondent;
using Lore.Basvuru.Common.Helpers;
using Lore.Basvuru.Common.Logging;
using Lore.Basvuru.Common.Models;
using Lore.Basvuru.Dal.Model;
using Lore.Basvuru.Dal.Repository;

namespace Lore.Basvuru.Bal.Managers.Form
{
    public class FormRespondentManager : IFormRespondentManager
    {
        private readonly IGenericRepository<t_bsv_user_basvuru> _basvuruRepo;
        private readonly IGenericRepository<t_bsv_cevap> _cevapRepo;
        private readonly IGenericRepository<t_frm_basvuru_form> _formRepo;
        private readonly IGenericRepository<t_frm_sayfa> _sayfaRepo;
        private readonly IGenericRepository<t_frm_soru> _soruRepo;
        private readonly IGenericRepository<t_frm_soru_secenek> _secenekRepo;
        private readonly IGenericRepository<t_wf_workflow> _workflowRepo;
        private readonly IWorkflowManager _workflowManager;
        private readonly IMapper _mapper;

        public FormRespondentManager(
            IGenericRepository<t_bsv_user_basvuru> basvuruRepo,
            IGenericRepository<t_bsv_cevap> cevapRepo,
            IGenericRepository<t_frm_basvuru_form> formRepo,
            IGenericRepository<t_frm_sayfa> sayfaRepo,
            IGenericRepository<t_frm_soru> soruRepo,
            IGenericRepository<t_frm_soru_secenek> secenekRepo,
            IGenericRepository<t_wf_workflow> workflowRepo,
            IWorkflowManager workflowManager,
            IMapper mapper)
        {
            _basvuruRepo = basvuruRepo;
            _cevapRepo = cevapRepo;
            _formRepo = formRepo;
            _sayfaRepo = sayfaRepo;
            _soruRepo = soruRepo;
            _secenekRepo = secenekRepo;
            _workflowRepo = workflowRepo;
            _workflowManager = workflowManager;
            _mapper = mapper;
        }

        public BasvuruBaslatResponseDTO BasvuruBaslat(long formId, long userId)
        {
            var form = _formRepo.Get(formId);
            if (form == null || form.Durum != 3)
                throw new AppException(400, "Form aktif değil veya bulunamadı");

            if (form.BaslamaTarihi.HasValue && DateTime.Now < form.BaslamaTarihi.Value)
                throw new AppException(400, "Form henüz başlamadı");
            if (form.BitisTarihi.HasValue && DateTime.Now > form.BitisTarihi.Value)
                throw new AppException(400, "Formun süresi dolmuş");

            // Mevcut başvuru kontrolü
            var mevcutBasvuru = _basvuruRepo.Get(
                "\"BasvuruFormId\" = @fid AND \"UserId\" = @uid AND \"Durum\" != 4 AND \"IsDeleted\" = FALSE",
                new { fid = formId, uid = userId });

            if (mevcutBasvuru != null && !form.CokluBasvuruIzinliMi)
                throw new AppException(409, "Bu forma zaten bir başvurunuz bulunmaktadır");

            var basvuru = new t_bsv_user_basvuru
            {
                TenantId = form.TenantId,
                BasvuruFormId = formId,
                UserId = userId,
                Durum = 1,
                BasvuruTarihi = DateTime.Now,
                IpAdresi = HttpContextHelper.GetClientIP()
            };
            _basvuruRepo.Insert(basvuru);

            var sayfaSayisi = _sayfaRepo.Query<int>(
                "SELECT COUNT(*) FROM t_frm_sayfa WHERE \"BasvuruFormId\" = @fid AND \"IsDeleted\" = FALSE",
                new { fid = formId }).FirstOrDefault();

            AppLog.Info($"[FormRespondentManager] BasvuruBaslat: FormId={formId}, UserId={userId}, BasvuruId={basvuru.Id}");

            return new BasvuruBaslatResponseDTO
            {
                basvuruEid = new EidDTO { id = basvuru.Id }, // id → eid otomatik encrypt
                formAd = form.Ad,
                sayfaSayisi = sayfaSayisi
            };
        }

        public void CevapKaydet(CevapKaydetReqDTO req)
        {
            var basvuruId = req.basvuruEid.id;
            var basvuru = _basvuruRepo.Get(basvuruId);
            if (basvuru == null || basvuru.UserId != HttpContextHelper.GetUserId())
                throw new AppException(403, "Başvuru bulunamadı veya yetkisiz erişim");

            if (basvuru.Durum == 4)
                throw new AppException(400, "Tamamlanan başvuruda değişiklik yapılamaz");

            using var scope = _basvuruRepo.BeginTransaction();

            foreach (var cevap in req.cevaplar)
            {
                var mevcutCevap = _cevapRepo.Get(
                    "\"UserBasvuruId\" = @bid AND \"SoruId\" = @sid AND \"IsDeleted\" = FALSE",
                    new { bid = basvuruId, sid = cevap.soruId });

                if (mevcutCevap != null)
                {
                    mevcutCevap.CevapMetin = cevap.cevapMetin;
                    mevcutCevap.CevapSayi = cevap.cevapSayi;
                    mevcutCevap.CevapTarih = cevap.cevapTarih;
                    mevcutCevap.CevapJson = cevap.cevapJson;
                    _cevapRepo.Update(mevcutCevap);
                }
                else
                {
                    _cevapRepo.Insert(new t_bsv_cevap
                    {
                        TenantId = basvuru.TenantId,
                        UserBasvuruId = basvuruId,
                        SoruId = cevap.soruId,
                        CevapMetin = cevap.cevapMetin,
                        CevapSayi = cevap.cevapSayi,
                        CevapTarih = cevap.cevapTarih,
                        CevapJson = cevap.cevapJson
                    });
                }
            }

            basvuru.Durum = 2; // Devam Ediyor
            _basvuruRepo.Update(basvuru);

            scope.Complete();
        }

        public void BasvuruTamamla(long basvuruId)
        {
            var basvuru = _basvuruRepo.Get(basvuruId);
            if (basvuru == null || basvuru.UserId != HttpContextHelper.GetUserId())
                throw new AppException(403, "Yetkisiz erişim");

            if (basvuru.Durum == 4)
                throw new AppException(400, "Başvuru zaten tamamlanmış");

            ZorunluAlanKontrol(basvuru);

            basvuru.Durum = 4;
            basvuru.TamamlanmaTarih = DateTime.Now;
            _basvuruRepo.Update(basvuru);

            // Workflow varsa başlat
            var workflow = _workflowRepo.Get(
                "\"AktifMi\" = TRUE AND \"IsDeleted\" = FALSE AND \"Id\" = (SELECT \"WorkflowId\" FROM t_frm_basvuru_form WHERE \"Id\" = @fid AND \"IsDeleted\" = FALSE)",
                new { fid = basvuru.BasvuruFormId });

            if (workflow != null)
            {
                _workflowManager.WorkflowBaslat(basvuruId, workflow.Id);
            }

            AppLog.Info($"[FormRespondentManager] BasvuruTamamla: BasvuruId={basvuruId}");
        }

        private void ZorunluAlanKontrol(t_bsv_user_basvuru basvuru)
        {
            var zorunluSorular = _soruRepo.GetList(
                "\"BasvuruFormId\" = @fid AND \"ZorunluMu\" = TRUE AND \"IsDeleted\" = FALSE",
                new { fid = basvuru.BasvuruFormId });

            if (!zorunluSorular.Any()) return;

            var cevaplar = _cevapRepo.GetList(
                "\"UserBasvuruId\" = @bid AND \"IsDeleted\" = FALSE",
                new { bid = basvuru.Id });

            var cevapliSoruIds = cevaplar
                .Where(c => !string.IsNullOrWhiteSpace(c.CevapMetin)
                    || c.CevapSayi.HasValue
                    || c.CevapTarih.HasValue
                    || !string.IsNullOrWhiteSpace(c.CevapJson))
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

        public List<KullaniciBasvuruListDTO> BasvurularimListele(long userId)
        {
            var sql = @"
                SELECT b.""Id"", b.""Durum"", b.""BasvuruTarihi"", b.""TamamlanmaTarih"",
                       f.""Ad"" AS FormAd
                FROM t_bsv_user_basvuru b
                INNER JOIN t_frm_basvuru_form f ON f.""Id"" = b.""BasvuruFormId""
                WHERE b.""UserId"" = @uid AND b.""IsDeleted"" = FALSE
                ORDER BY b.""BasvuruTarihi"" DESC";

            return _basvuruRepo.Query<KullaniciBasvuruListDTO>(sql, new { uid = userId });
        }

        public BasvuruDetayDTO BasvuruDetayGetir(long basvuruId, long userId)
        {
            var sql = @"
                SELECT b.""Id"", b.""Durum"", b.""BasvuruTarihi"", b.""TamamlanmaTarih"",
                       f.""Ad"" AS FormAd, f.""Aciklama"" AS FormAciklama
                FROM t_bsv_user_basvuru b
                INNER JOIN t_frm_basvuru_form f ON f.""Id"" = b.""BasvuruFormId""
                WHERE b.""Id"" = @bid AND b.""UserId"" = @uid AND b.""IsDeleted"" = FALSE";

            var detay = _basvuruRepo.Query<BasvuruDetayDTO>(sql, new { bid = basvuruId, uid = userId })
                .FirstOrDefault()
                ?? throw new AppException(404, "Başvuru bulunamadı");

            var cevapSql = @"
                SELECT c.""SoruId"", c.""CevapMetin"", c.""CevapSayi"", c.""CevapTarih"", c.""CevapJson"",
                       s.""Etiket"" AS SoruEtiket, s.""SoruTipi""
                FROM t_bsv_cevap c
                INNER JOIN t_frm_soru s ON s.""Id"" = c.""SoruId""
                WHERE c.""UserBasvuruId"" = @bid AND c.""IsDeleted"" = FALSE";

            detay.cevaplar = _cevapRepo.Query<CevapDetayDTO>(cevapSql, new { bid = basvuruId });
            return detay;
        }

        public void OncekiBasvurudanKopyala(long basvuruId, long kaynakBasvuruId)
        {
            var hedef = _basvuruRepo.Get(basvuruId);
            var kaynak = _basvuruRepo.Get(kaynakBasvuruId);

            if (hedef == null || kaynak == null)
                throw new AppException(404, "Başvuru bulunamadı");

            if (hedef.UserId != HttpContextHelper.GetUserId())
                throw new AppException(403, "Yetkisiz erişim");

            var kaynakCevaplar = _cevapRepo.GetList(
                "\"UserBasvuruId\" = @bid AND \"IsDeleted\" = FALSE",
                new { bid = kaynakBasvuruId });

            var hedefSoruIds = _soruRepo.GetList(
                "\"BasvuruFormId\" = @fid AND \"IsDeleted\" = FALSE",
                new { fid = hedef.BasvuruFormId })
                .Select(s => s.Id)
                .ToHashSet();

            using var scope = _basvuruRepo.BeginTransaction();

            foreach (var cevap in kaynakCevaplar.Where(c => hedefSoruIds.Contains(c.SoruId)))
            {
                var mevcutCevap = _cevapRepo.Get(
                    "\"UserBasvuruId\" = @bid AND \"SoruId\" = @sid AND \"IsDeleted\" = FALSE",
                    new { bid = basvuruId, sid = cevap.SoruId });

                if (mevcutCevap != null) continue;

                _cevapRepo.Insert(new t_bsv_cevap
                {
                    TenantId = hedef.TenantId,
                    UserBasvuruId = basvuruId,
                    SoruId = cevap.SoruId,
                    CevapMetin = cevap.CevapMetin,
                    CevapSayi = cevap.CevapSayi,
                    CevapTarih = cevap.CevapTarih,
                    CevapJson = cevap.CevapJson
                });
            }

            scope.Complete();
            AppLog.Info($"[FormRespondentManager] OncekiBasvurudanKopyala: Kaynak={kaynakBasvuruId} → Hedef={basvuruId}");
        }

        public List<SelectItemDTO> ManuelSecenekleriGetir(long soruId)
        {
            var secenekler = _secenekRepo.GetList(
                "\"SoruId\" = @sid AND \"AktifMi\" = TRUE AND \"IsDeleted\" = FALSE",
                new { sid = soruId },
                OrderOption.asc, t_frm_soru_secenek_properties.SiraNo);

            return secenekler.Select(s => new SelectItemDTO
            {
                value = s.Deger,
                label = s.EtiketTr
            }).ToList();
        }
    }
}
