using AutoMapper;
using Lore.Basvuru.Bal.Managers.Form.Interfaces;
using Lore.Basvuru.Common.DTO.Form.FormBuild;
using Lore.Basvuru.Common.Helpers;
using Lore.Basvuru.Common.Models;
using Lore.Basvuru.Dal.Model;
using Lore.Basvuru.Dal.Repository;
using Newtonsoft.Json;

namespace Lore.Basvuru.Bal.Managers.Form
{
    public class KuralManager : IKuralManager
    {
        private readonly IGenericRepository<t_frm_kural> _kuralRepo;
        private readonly IMapper _mapper;

        public KuralManager(
            IGenericRepository<t_frm_kural> kuralRepo,
            IMapper mapper)
        {
            _kuralRepo = kuralRepo;
            _mapper = mapper;
        }

        public List<KuralDTO> FormKurallariniGetir(long formId)
        {
            var sql = @"
                SELECT k.""Id"", k.""BasvuruFormId"", k.""HedefSoruId"", k.""KuralTipi"",
                       k.""KosulJson"", k.""EylemJson"", k.""AktifMi""
                FROM t_frm_kural k
                WHERE k.""BasvuruFormId"" = @fid AND k.""IsDeleted"" = FALSE AND k.""AktifMi"" = TRUE
                ORDER BY k.""Id""";

            return _kuralRepo.Query<KuralDTO>(sql, new { fid = formId });
        }

        public KuralDTO KuralKaydet(KuralDTO dto)
        {
            // Kosul ve eylem JSON doğrulama
            if (!string.IsNullOrWhiteSpace(dto.kosulJson))
            {
                try { JsonConvert.DeserializeObject(dto.kosulJson); }
                catch { throw new AppException(400, "Geçersiz kosul JSON formatı"); }
            }
            if (!string.IsNullOrWhiteSpace(dto.eylemJson))
            {
                try { JsonConvert.DeserializeObject(dto.eylemJson); }
                catch { throw new AppException(400, "Geçersiz eylem JSON formatı"); }
            }

            if (!string.IsNullOrEmpty(dto.basvuruFormEid))
                dto.basvuruFormId = CryptoHelper.DecryptLong(dto.basvuruFormEid);

            var entity = _mapper.Map<t_frm_kural>(dto);
            entity.TenantId = HttpContextHelper.GetTenantId();
            _kuralRepo.Save(entity);
            dto.id = entity.Id;
            return dto;
        }

        public void KuralSil(long kuralId)
        {
            var entity = _kuralRepo.Get(kuralId)
                ?? throw new AppException(404, "Kural bulunamadı");
            _kuralRepo.Delete(entity);
        }

        public Dictionary<long, List<KuralDTO>> KuralHaritasiGetir(long formId)
        {
            var kurallar = FormKurallariniGetir(formId);
            var harita = new Dictionary<long, List<KuralDTO>>();

            foreach (var kural in kurallar)
            {
                var hedefId = kural.hedefSoruId;
                if (!harita.ContainsKey(hedefId))
                    harita[hedefId] = new List<KuralDTO>();
                harita[hedefId].Add(kural);
            }

            return harita;
        }
    }
}
