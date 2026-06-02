using AutoMapper;
using Lore.Basvuru.Bal.Managers.Form.Interfaces;
using Lore.Basvuru.Common.DTO.Base.Datatable;
using Lore.Basvuru.Common.DTO.Form.Common;
using Lore.Basvuru.Common.DTO.Form.FormBuild;
using Lore.Basvuru.Common.Helpers;
using Lore.Basvuru.Common.Logging;
using Lore.Basvuru.Common.Models;
using Lore.Basvuru.Dal.Model;
using Lore.Basvuru.Dal.Repository;

namespace Lore.Basvuru.Bal.Managers.Form
{
    public class FormBuildManager : IFormBuildManager
    {
        private readonly IGenericRepository<t_frm_basvuru_form> _formRepo;
        private readonly IGenericRepository<t_frm_sayfa> _sayfaRepo;
        private readonly IGenericRepository<t_frm_soru> _soruRepo;
        private readonly IGenericRepository<t_frm_soru_secenek> _secenekRepo;
        private readonly IMapper _mapper;

        public FormBuildManager(
            IGenericRepository<t_frm_basvuru_form> formRepo,
            IGenericRepository<t_frm_sayfa> sayfaRepo,
            IGenericRepository<t_frm_soru> soruRepo,
            IGenericRepository<t_frm_soru_secenek> secenekRepo,
            IMapper mapper)
        {
            _formRepo = formRepo;
            _sayfaRepo = sayfaRepo;
            _soruRepo = soruRepo;
            _secenekRepo = secenekRepo;
            _mapper = mapper;
        }

        // ── FORM ──────────────────────────────────────────────────

        public DatatableResponseDTO<BasvuruFormListDTO> FormListesiGetir(
            int pageNumber, int pageSize, long tenantId, string? aramaMetni)
        {
            var where = "f.\"TenantId\" = @tid AND f.\"IsDeleted\" = FALSE";
            var param = new Dapper.DynamicParameters();
            param.Add("tid", tenantId);

            if (!string.IsNullOrWhiteSpace(aramaMetni))
            {
                where += " AND f.\"Ad\" ILIKE @arama";
                param.Add("arama", $"%{aramaMetni}%");
            }

            var offset = (pageNumber - 1) * pageSize;
            param.Add("offset", offset);
            param.Add("pageSize", pageSize);

            var sql = $@"
                SELECT f.""Id"", f.""Ad"", f.""Aciklama"", f.""Durum"", f.""BaslamaTarihi"",
                       f.""BitisTarihi"", f.""CreatedDate"",
                       (SELECT COUNT(*) FROM t_bsv_user_basvuru b
                        WHERE b.""BasvuruFormId"" = f.""Id"" AND b.""IsDeleted"" = FALSE) AS BasvuruSayisi
                FROM t_frm_basvuru_form f
                WHERE {where}
                ORDER BY f.""CreatedDate"" DESC
                LIMIT @pageSize OFFSET @offset";

            var countSql = $"SELECT COUNT(*) FROM t_frm_basvuru_form f WHERE {where}";

            var data = _formRepo.Query<BasvuruFormListDTO>(sql, param);
            var total = _formRepo.Query<int>(countSql, param).FirstOrDefault();

            return new DatatableResponseDTO<BasvuruFormListDTO>
            {
                data = data,
                totalRecords = total,
                pageNumber = pageNumber,
                pageSize = pageSize
            };
        }

        public BasvuruFormDTO FormGetir(long formId)
        {
            var entity = _formRepo.Get(formId)
                ?? throw new AppException(404, "Form bulunamadı");
            return _mapper.Map<BasvuruFormDTO>(entity);
        }

        public BasvuruFormDTO FormKaydet(BasvuruFormDTO dto)
        {
            var entity = _mapper.Map<t_frm_basvuru_form>(dto);
            entity.TenantId = HttpContextHelper.GetTenantId();
            _formRepo.Save(entity);
            dto.id = entity.Id;
            AppLog.Info($"[FormBuildManager] FormKaydet: FormId={entity.Id}");
            return dto;
        }

        public void FormSil(long formId)
        {
            var entity = _formRepo.Get(formId)
                ?? throw new AppException(404, "Form bulunamadı");

            if (entity.TenantId != HttpContextHelper.GetTenantId())
                throw new AppException(403, "Yetkisiz erişim");

            if (entity.Durum == 3)
                throw new AppException(400, "Yayında olan form silinemez, önce pasife alın");

            _formRepo.Delete(entity);
        }

        public void FormYayinla(long formId)
        {
            var entity = _formRepo.Get(formId)
                ?? throw new AppException(404, "Form bulunamadı");

            if (entity.TenantId != HttpContextHelper.GetTenantId())
                throw new AppException(403, "Yetkisiz erişim");

            var sayfaSayisi = _sayfaRepo.Query<int>(
                "SELECT COUNT(*) FROM t_frm_sayfa WHERE \"BasvuruFormId\" = @fid AND \"IsDeleted\" = FALSE",
                new { fid = formId }).FirstOrDefault();

            if (sayfaSayisi == 0)
                throw new AppException(400, "Formda en az bir sayfa olmalıdır");

            entity.Durum = 3;
            _formRepo.Update(entity);
            AppLog.Info($"[FormBuildManager] FormYayinla: FormId={formId}");
        }

        public void FormKopyala(long formId, long tenantId)
        {
            var kaynak = _formRepo.Get(formId)
                ?? throw new AppException(404, "Form bulunamadı");

            using var scope = _formRepo.BeginTransaction();

            var yeniForm = new t_frm_basvuru_form
            {
                TenantId = tenantId,
                Ad = $"{kaynak.Ad} (Kopya)",
                Aciklama = kaynak.Aciklama,
                Durum = 1,
                CokluBasvuruIzinliMi = kaynak.CokluBasvuruIzinliMi,
                LoginGerekliMi = kaynak.LoginGerekliMi,
                AnonymousIzinliMi = kaynak.AnonymousIzinliMi,
                BildirimAktifMi = kaynak.BildirimAktifMi,
                KopyalandiFormId = formId
            };
            _formRepo.Insert(yeniForm);

            var sayfalar = _sayfaRepo.GetList(
                "\"BasvuruFormId\" = @fid AND \"IsDeleted\" = FALSE",
                new { fid = formId },
                OrderOption.asc, t_frm_sayfa_properties.SiraNo);

            foreach (var sayfa in sayfalar)
            {
                var yeniSayfa = new t_frm_sayfa
                {
                    TenantId = tenantId,
                    BasvuruFormId = yeniForm.Id,
                    Ad = sayfa.Ad,
                    Aciklama = sayfa.Aciklama,
                    SiraNo = sayfa.SiraNo,
                    AktifMi = sayfa.AktifMi
                };
                _sayfaRepo.Insert(yeniSayfa);

                var sorular = _soruRepo.GetList(
                    "\"SayfaId\" = @sid AND \"IsDeleted\" = FALSE",
                    new { sid = sayfa.Id },
                    OrderOption.asc, t_frm_soru_properties.SiraNo);

                foreach (var soru in sorular)
                {
                    var yeniSoru = new t_frm_soru
                    {
                        TenantId = tenantId,
                        BasvuruFormId = yeniForm.Id,
                        SayfaId = yeniSayfa.Id,
                        Etiket = soru.Etiket,
                        AltMetin = soru.AltMetin,
                        SoruTipi = soru.SoruTipi,
                        SiraNo = soru.SiraNo,
                        ZorunluMu = soru.ZorunluMu,
                        GizliMi = soru.GizliMi,
                        ReadOnlyMi = soru.ReadOnlyMi,
                        KaynakTipi = soru.KaynakTipi,
                        KaynakId = soru.KaynakId,
                        DegerValidasyonu = soru.DegerValidasyonu,
                        EkBilgi = soru.EkBilgi,
                        GrupKodu = soru.GrupKodu,
                        GrupMin = soru.GrupMin,
                        GrupMax = soru.GrupMax
                    };
                    _soruRepo.Insert(yeniSoru);

                    if (soru.KaynakTipi == 1) // Manuel seçenekler
                    {
                        var secenekler = _secenekRepo.GetList(
                            "\"SoruId\" = @sid AND \"IsDeleted\" = FALSE",
                            new { sid = soru.Id },
                            OrderOption.asc, t_frm_soru_secenek_properties.SiraNo);

                        foreach (var secenek in secenekler)
                        {
                            _secenekRepo.Insert(new t_frm_soru_secenek
                            {
                                TenantId = tenantId,
                                SoruId = yeniSoru.Id,
                                Deger = secenek.Deger,
                                EtiketTr = secenek.EtiketTr,
                                EtiketEn = secenek.EtiketEn,
                                SiraNo = secenek.SiraNo,
                                AktifMi = secenek.AktifMi
                            });
                        }
                    }
                }
            }

            scope.Complete();
            AppLog.Info($"[FormBuildManager] FormKopyala: KaynakFormId={formId}, YeniFormId={yeniForm.Id}");
        }

        // ── SAYFA ─────────────────────────────────────────────────

        public List<SayfaDTO> SayfaListesiGetir(long formId)
        {
            var sayfalar = _sayfaRepo.GetList(
                "\"BasvuruFormId\" = @fid AND \"IsDeleted\" = FALSE",
                new { fid = formId },
                OrderOption.asc, t_frm_sayfa_properties.SiraNo);

            return _mapper.Map<List<SayfaDTO>>(sayfalar);
        }

        public SayfaDTO SayfaKaydet(SayfaDTO dto)
        {
            if (!string.IsNullOrEmpty(dto.basvuruFormEid))
                dto.basvuruFormId = CryptoHelper.DecryptLong(dto.basvuruFormEid);

            var entity = _mapper.Map<t_frm_sayfa>(dto);
            entity.TenantId = HttpContextHelper.GetTenantId();
            _sayfaRepo.Save(entity);
            dto.id = entity.Id;
            return dto;
        }

        public void SayfaSil(long sayfaId)
        {
            var entity = _sayfaRepo.Get(sayfaId)
                ?? throw new AppException(404, "Sayfa bulunamadı");
            _sayfaRepo.Delete(entity);
        }

        // ── SORU ──────────────────────────────────────────────────

        public List<SoruDTO> SoruListesiGetir(long sayfaId)
        {
            var sorular = _soruRepo.GetList(
                "\"SayfaId\" = @sid AND \"IsDeleted\" = FALSE",
                new { sid = sayfaId },
                OrderOption.asc, t_frm_soru_properties.SiraNo);

            var dtos = _mapper.Map<List<SoruDTO>>(sorular);

            foreach (var dto in dtos.Where(s => s.kaynakTipi == 1))
            {
                var secenekler = _secenekRepo.GetList(
                    "\"SoruId\" = @sid AND \"AktifMi\" = TRUE AND \"IsDeleted\" = FALSE",
                    new { sid = dto.id },
                    OrderOption.asc, t_frm_soru_secenek_properties.SiraNo);

                dto.secenekler = _mapper.Map<List<SecenekDTO>>(secenekler);
            }

            return dtos;
        }

        public SoruDTO SoruKaydet(SoruDTO dto)
        {
            if (!string.IsNullOrEmpty(dto.sayfaEid))
                dto.sayfaId = CryptoHelper.DecryptLong(dto.sayfaEid);
            if (!string.IsNullOrEmpty(dto.basvuruFormEid))
                dto.basvuruFormId = CryptoHelper.DecryptLong(dto.basvuruFormEid);

            var tenantId = HttpContextHelper.GetTenantId();

            using var scope = _soruRepo.BeginTransaction();

            var entity = _mapper.Map<t_frm_soru>(dto);
            entity.TenantId = tenantId;
            _soruRepo.Save(entity);
            dto.id = entity.Id;

            if (dto.secenekler != null && dto.kaynakTipi == 1)
            {
                _secenekRepo.UpdateSqlToplu(
                    "UPDATE t_frm_soru_secenek SET \"IsDeleted\" = TRUE WHERE \"SoruId\" = @sid",
                    new { sid = entity.Id });

                foreach (var secenek in dto.secenekler)
                {
                    _secenekRepo.Insert(new t_frm_soru_secenek
                    {
                        TenantId = tenantId,
                        SoruId = entity.Id,
                        Deger = secenek.deger,
                        EtiketTr = secenek.etiketTr,
                        EtiketEn = secenek.etiketEn,
                        SiraNo = secenek.siraNo,
                        AktifMi = secenek.aktifMi
                    });
                }
            }

            scope.Complete();
            return dto;
        }

        public void SoruSil(long soruId)
        {
            var entity = _soruRepo.Get(soruId)
                ?? throw new AppException(404, "Soru bulunamadı");
            _soruRepo.Delete(entity);
        }

        public void SoruSiraGuncelle(List<SiraGuncelleDTO> req)
        {
            foreach (var item in req)
            {
                var id = CryptoHelper.DecryptLong(item.eid);
                _soruRepo.UpdateSqlToplu(
                    "UPDATE t_frm_soru SET \"SiraNo\" = @sira WHERE \"Id\" = @id",
                    new { sira = item.siraNo, id });
            }
        }
    }
}
