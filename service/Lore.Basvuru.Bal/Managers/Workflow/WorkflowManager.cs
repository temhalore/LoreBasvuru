using AutoMapper;
using Lore.Basvuru.Bal.Managers.Workflow.Interfaces;
using Lore.Basvuru.Common.DTO.Base.Datatable;
using Lore.Basvuru.Common.DTO.Workflow;
using Lore.Basvuru.Common.Helpers;
using Lore.Basvuru.Common.Logging;
using Lore.Basvuru.Common.Models;
using Lore.Basvuru.Dal.Model;
using Lore.Basvuru.Dal.Repository;
using Newtonsoft.Json;

namespace Lore.Basvuru.Bal.Managers.Workflow
{
    public class WorkflowManager : IWorkflowManager
    {
        private readonly IGenericRepository<t_wf_workflow> _wfRepo;
        private readonly IGenericRepository<t_wf_adim> _adimRepo;
        private readonly IGenericRepository<t_wf_adim_rol> _adimRolRepo;
        private readonly IGenericRepository<t_wf_adim_rol_filtre> _adimRolFiltreRepo;
        private readonly IGenericRepository<t_bsv_user_basvuru> _basvuruRepo;
        private readonly IGenericRepository<t_bsv_wf_adim_durum> _adimDurumRepo;
        private readonly IGenericRepository<t_bsv_cevap> _cevapRepo;
        private readonly IGenericRepository<t_sis_user_rol> _userRolRepo;
        private readonly IMapper _mapper;

        public WorkflowManager(
            IGenericRepository<t_wf_workflow> wfRepo,
            IGenericRepository<t_wf_adim> adimRepo,
            IGenericRepository<t_wf_adim_rol> adimRolRepo,
            IGenericRepository<t_wf_adim_rol_filtre> adimRolFiltreRepo,
            IGenericRepository<t_bsv_user_basvuru> basvuruRepo,
            IGenericRepository<t_bsv_wf_adim_durum> adimDurumRepo,
            IGenericRepository<t_bsv_cevap> cevapRepo,
            IGenericRepository<t_sis_user_rol> userRolRepo,
            IMapper mapper)
        {
            _wfRepo = wfRepo;
            _adimRepo = adimRepo;
            _adimRolRepo = adimRolRepo;
            _adimRolFiltreRepo = adimRolFiltreRepo;
            _basvuruRepo = basvuruRepo;
            _adimDurumRepo = adimDurumRepo;
            _cevapRepo = cevapRepo;
            _userRolRepo = userRolRepo;
            _mapper = mapper;
        }

        // ── WORKFLOW TANIMLAMA ─────────────────────────────────────

        public List<WorkflowDTO> WorkflowListele(long tenantId)
        {
            var sql = @"
                SELECT w.""Id"", w.""Ad"", w.""Aciklama"", w.""AktifMi""
                FROM t_wf_workflow w
                WHERE w.""TenantId"" = @tid AND w.""IsDeleted"" = FALSE
                ORDER BY w.""Ad""";

            return _wfRepo.Query<WorkflowDTO>(sql, new { tid = tenantId });
        }

        public WorkflowDTO WorkflowGetir(long workflowId)
        {
            var entity = _wfRepo.Get(workflowId)
                ?? throw new AppException(404, "Workflow bulunamadı");

            var dto = _mapper.Map<WorkflowDTO>(entity);

            var adimlar = _adimRepo.GetList(
                "\"WorkflowId\" = @wid AND \"IsDeleted\" = FALSE",
                new { wid = workflowId },
                OrderOption.asc, t_wf_adim_properties.SiraNo);

            dto.adimlar = _mapper.Map<List<WorkflowAdimDTO>>(adimlar);
            return dto;
        }

        public WorkflowDTO WorkflowKaydet(WorkflowDTO dto)
        {
            var entity = _mapper.Map<t_wf_workflow>(dto);
            entity.TenantId = HttpContextHelper.GetTenantId();
            _wfRepo.Save(entity);
            dto.id = entity.Id;
            AppLog.Info($"[WorkflowManager] WorkflowKaydet: WorkflowId={entity.Id}");
            return dto;
        }

        public void WorkflowSil(long workflowId)
        {
            var entity = _wfRepo.Get(workflowId)
                ?? throw new AppException(404, "Workflow bulunamadı");
            _wfRepo.Delete(entity);
        }

        public WorkflowAdimDTO AdimKaydet(WorkflowAdimDTO dto)
        {
            if (!string.IsNullOrEmpty(dto.workflowEid))
                dto.workflowId = CryptoHelper.DecryptLong(dto.workflowEid);

            var entity = _mapper.Map<t_wf_adim>(dto);
            entity.TenantId = HttpContextHelper.GetTenantId();
            _adimRepo.Save(entity);
            dto.id = entity.Id;
            return dto;
        }

        public void AdimSil(long adimId)
        {
            var entity = _adimRepo.Get(adimId)
                ?? throw new AppException(404, "Adım bulunamadı");
            _adimRepo.Delete(entity);
        }

        public void AdimRolAta(AdimRolAtaReqDTO req)
        {
            // Mevcut rol atamalarını sil
            var mevcutlar = _adimRolRepo.GetList(
                "\"WorkflowAdimId\" = @aid AND \"IsDeleted\" = FALSE",
                new { aid = req.adimId });

            if (mevcutlar.Any())
                _adimRolRepo.DeleteAll(mevcutlar.Select(x => x.Id).ToList());

            // Yeni atamalar
            var tenantId = HttpContextHelper.GetTenantId();
            foreach (var rolId in req.rolIdler)
            {
                _adimRolRepo.Insert(new t_wf_adim_rol
                {
                    TenantId = tenantId,
                    WorkflowAdimId = req.adimId,
                    RolId = rolId
                });
            }
        }

        public void AdimRolFiltresiKaydet(AdimRolFiltreReqDTO req)
        {
            var entity = new t_wf_adim_rol_filtre
            {
                TenantId = HttpContextHelper.GetTenantId(),
                WorkflowAdimRolId = req.adimRolId,
                SoruId = req.soruId,
                Operator = req.operator_,
                FiltreJson = req.filtreDegerleri != null
                    ? JsonConvert.SerializeObject(req.filtreDegerleri)
                    : "{}"
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

        // ── ONAY İŞLEMLERİ ────────────────────────────────────────

        public DatatableResponseDTO<BasvuruOnayListDTO> OnayBekleyenleriGetir(
            DatatableRequestDTO<BasvuruOnayFiltrDTO> req)
        {
            var userId = HttpContextHelper.GetUserId();
            var tenantId = HttpContextHelper.GetTenantId();

            var kullaniciRolleri = _userRolRepo.GetList(
                "\"UserId\" = @uid AND \"TenantId\" = @tid AND \"AktifMi\" = TRUE AND \"IsDeleted\" = FALSE",
                new { uid = userId, tid = tenantId })
                .Select(r => r.RolId)
                .ToList();

            if (!kullaniciRolleri.Any())
                return new DatatableResponseDTO<BasvuruOnayListDTO>
                { data = new List<BasvuruOnayListDTO>(), totalRecords = 0 };

            var adimRolSql = @"
                SELECT DISTINCT ar.""WorkflowAdimId""
                FROM t_wf_adim_rol ar
                WHERE ar.""RolId"" = ANY(@roller) AND ar.""IsDeleted"" = FALSE";

            var yonetilebilirAdimlar = _adimRolRepo
                .Query<long>(adimRolSql, new { roller = kullaniciRolleri.ToArray() })
                .ToArray();

            if (!yonetilebilirAdimlar.Any())
                return new DatatableResponseDTO<BasvuruOnayListDTO>
                { data = new List<BasvuruOnayListDTO>(), totalRecords = 0 };

            var pageNumber = req.pageNumber;
            var pageSize = req.pageSize;
            var offset = (pageNumber - 1) * pageSize;

            var sql = @"
                SELECT b.""Id"" AS rawId, b.""AktifAdimId"" AS aktifAdimId, b.""Durum"",
                       b.""BasvuruTarihi"",
                       f.""Ad"" AS FormAdi,
                       u.""Ad"" || ' ' || u.""Soyad"" AS BasvuranAdSoyad,
                       u.""Email"",
                       a.""Ad"" AS AktifAdimAdi
                FROM t_bsv_user_basvuru b
                INNER JOIN t_frm_basvuru_form f ON f.""Id"" = b.""BasvuruFormId""
                INNER JOIN t_sis_user u ON u.""Id"" = b.""UserId""
                LEFT JOIN t_wf_adim a ON a.""Id"" = b.""AktifAdimId""
                WHERE b.""TenantId"" = @tid
                AND b.""AktifAdimId"" = ANY(@adimlar)
                AND b.""Durum"" = 3
                AND b.""IsDeleted"" = FALSE
                ORDER BY b.""BasvuruTarihi"" DESC
                LIMIT @pageSize OFFSET @offset";

            var countSql = @"
                SELECT COUNT(*) FROM t_bsv_user_basvuru b
                WHERE b.""TenantId"" = @tid
                AND b.""AktifAdimId"" = ANY(@adimlar)
                AND b.""Durum"" = 3
                AND b.""IsDeleted"" = FALSE";

            var data = _basvuruRepo.Query<BasvuruOnayListDTO>(sql, new
            {
                tid = tenantId,
                adimlar = yonetilebilirAdimlar,
                pageSize,
                offset
            });

            var total = _basvuruRepo.Query<int>(countSql, new
            {
                tid = tenantId,
                adimlar = yonetilebilirAdimlar
            }).FirstOrDefault();

            return new DatatableResponseDTO<BasvuruOnayListDTO>
            {
                data = data,
                totalRecords = total,
                pageNumber = pageNumber,
                pageSize = pageSize
            };
        }

        public void AdimIslemYap(WorkflowAdimIslemReqDTO req)
        {
            var userBasvuruId = req.userBasvuruEid.id; // EidDTO → otomatik decrypt
            var adimId = req.adimEid.id;               // EidDTO → otomatik decrypt

            var basvuru = _basvuruRepo.Get(userBasvuruId)
                ?? throw new AppException(404, "Başvuru bulunamadı");

            if (basvuru.AktifAdimId != adimId)
                throw new AppException(400, "Bu adımda işlem yapma yetkiniz yok veya adım aktif değil");

            using var scope = _adimDurumRepo.BeginTransaction();

            _adimDurumRepo.Insert(new t_bsv_wf_adim_durum
            {
                TenantId = basvuru.TenantId,
                UserBasvuruId = userBasvuruId,
                WorkflowAdimId = adimId,
                Durum = req.islemTipi,
                IslemTarihi = DateTime.Now,
                Yorum = req.yorum,
                IslemYapanId = HttpContextHelper.GetUserId()
            });

            if (req.islemTipi == 2) // Onayla — sonraki adıma geç
            {
                var sonrakiAdimSql = @"
                    SELECT * FROM t_wf_adim
                    WHERE ""WorkflowId"" = (SELECT ""WorkflowId"" FROM t_wf_adim WHERE ""Id"" = @aid)
                    AND ""SiraNo"" > (SELECT ""SiraNo"" FROM t_wf_adim WHERE ""Id"" = @aid)
                    AND ""IsDeleted"" = FALSE
                    ORDER BY ""SiraNo"" ASC
                    LIMIT 1";

                var sonrakiAdim = _adimRepo.Query<t_wf_adim>(sonrakiAdimSql, new { aid = adimId })
                    .FirstOrDefault();

                if (sonrakiAdim != null)
                {
                    basvuru.AktifAdimId = sonrakiAdim.Id;
                    basvuru.Durum = 3;
                }
                else
                {
                    basvuru.AktifAdimId = null;
                    basvuru.Durum = 5; // Onaylandı
                    AppLog.Info($"[WorkflowManager] Başvuru onaylandı: BasvuruId={userBasvuruId}");
                }
            }
            else if (req.islemTipi == 3) // Reddet
            {
                basvuru.AktifAdimId = null;
                basvuru.Durum = 6;
                AppLog.Info($"[WorkflowManager] Başvuru reddedildi: BasvuruId={userBasvuruId}");
            }
            else if (req.islemTipi == 4) // İade
            {
                basvuru.AktifAdimId = null;
                basvuru.Durum = 7;
                AppLog.Info($"[WorkflowManager] Başvuru iade edildi: BasvuruId={userBasvuruId}");
            }

            _basvuruRepo.Update(basvuru);
            scope.Complete();
        }

        public List<WorkflowAdimDurumDTO> BasvuruAkisGecmisiniGetir(long basvuruId)
        {
            var sql = @"
                SELECT d.""Id"", d.""WorkflowAdimId"", d.""Durum"", d.""IslemTarihi"", d.""Yorum"",
                       a.""Ad"" AS AdimAdi, a.""SiraNo"",
                       u.""Ad"" || ' ' || u.""Soyad"" AS IslemYapan
                FROM t_bsv_wf_adim_durum d
                INNER JOIN t_wf_adim a ON a.""Id"" = d.""WorkflowAdimId""
                LEFT JOIN t_sis_user u ON u.""Id"" = d.""IslemYapanId""
                WHERE d.""UserBasvuruId"" = @bid AND d.""IsDeleted"" = FALSE
                ORDER BY a.""SiraNo"", d.""IslemTarihi""";

            return _adimDurumRepo.Query<WorkflowAdimDurumDTO>(sql, new { bid = basvuruId });
        }

        public void WorkflowBaslat(long basvuruId, long workflowId)
        {
            // İlk adımı bul
            var ilkAdim = _adimRepo.Get(
                "\"WorkflowId\" = @wid AND \"IlkAdimMi\" = TRUE AND \"IsDeleted\" = FALSE",
                new { wid = workflowId });

            if (ilkAdim == null)
            {
                var adimlar = _adimRepo.GetList(
                    "\"WorkflowId\" = @wid AND \"IsDeleted\" = FALSE",
                    new { wid = workflowId },
                    OrderOption.asc, t_wf_adim_properties.SiraNo);
                ilkAdim = adimlar.FirstOrDefault();
            }

            if (ilkAdim == null)
            {
                AppLog.Warning($"[WorkflowManager] Workflow'da adım bulunamadı: WorkflowId={workflowId}");
                return;
            }

            var basvuru = _basvuruRepo.Get(basvuruId);
            if (basvuru == null) return;

            basvuru.AktifAdimId = ilkAdim.Id;
            basvuru.Durum = 3; // Onay Bekliyor
            _basvuruRepo.Update(basvuru);

            AppLog.Info($"[WorkflowManager] WorkflowBaslat: BasvuruId={basvuruId}, IlkAdimId={ilkAdim.Id}");
        }
    }
}
