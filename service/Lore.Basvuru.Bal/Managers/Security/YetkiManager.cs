using AutoMapper;
using Lore.Basvuru.Bal.Managers.Security.Interfaces;
using Lore.Basvuru.Common.DTO.Security.Ekran;
using Lore.Basvuru.Common.DTO.Security.Rol;
using Lore.Basvuru.Common.DTO.Security.Widget;
using Lore.Basvuru.Common.Logging;
using Lore.Basvuru.Common.Models;
using Lore.Basvuru.Dal.Model;
using Lore.Basvuru.Dal.Repository;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using System.Reflection;

namespace Lore.Basvuru.Bal.Managers.Security
{
    public class YetkiManager : IYetkiManager
    {
        private readonly IGenericRepository<t_sis_ekran> _ekranRepo;
        private readonly IGenericRepository<t_sis_widget> _widgetRepo;
        private readonly IGenericRepository<t_sis_controller_method> _cmRepo;
        private readonly IGenericRepository<t_sis_widget_controller_method> _wcmRepo;
        private readonly IGenericRepository<t_sis_rol> _rolRepo;
        private readonly IGenericRepository<t_sis_rol_ekran> _rolEkranRepo;
        private readonly IGenericRepository<t_sis_rol_widget> _rolWidgetRepo;
        private readonly IGenericRepository<t_sis_user_rol> _userRolRepo;
        private readonly IMapper _mapper;

        public YetkiManager(
            IGenericRepository<t_sis_ekran> ekranRepo,
            IGenericRepository<t_sis_widget> widgetRepo,
            IGenericRepository<t_sis_controller_method> cmRepo,
            IGenericRepository<t_sis_widget_controller_method> wcmRepo,
            IGenericRepository<t_sis_rol> rolRepo,
            IGenericRepository<t_sis_rol_ekran> rolEkranRepo,
            IGenericRepository<t_sis_rol_widget> rolWidgetRepo,
            IGenericRepository<t_sis_user_rol> userRolRepo,
            IMapper mapper)
        {
            _ekranRepo = ekranRepo;
            _widgetRepo = widgetRepo;
            _cmRepo = cmRepo;
            _wcmRepo = wcmRepo;
            _rolRepo = rolRepo;
            _rolEkranRepo = rolEkranRepo;
            _rolWidgetRepo = rolWidgetRepo;
            _userRolRepo = userRolRepo;
            _mapper = mapper;
        }

        // ── EKRAN ─────────────────────────────────────────────

        public List<EkranDTO> TumEkranlariGetir()
        {
            var ekranlar = _ekranRepo.GetList("\"AktifMi\" = TRUE AND \"IsDeleted\" = FALSE",
                orderOption: OrderOption.asc, orderProp: t_sis_ekran_properties.SiraNo);
            var dtos = _mapper.Map<List<EkranDTO>>(ekranlar);
            return EkranHiyerarsiOlustur(dtos);
        }

        public EkranDTO EkranKaydet(EkranDTO dto)
        {
            var entity = _mapper.Map<t_sis_ekran>(dto);
            _ekranRepo.Save(entity);
            dto.id = entity.Id;
            return dto;
        }

        public void EkranSil(long ekranId)
        {
            var entity = _ekranRepo.Get(ekranId)
                ?? throw new AppException(404, "Ekran bulunamadı");
            _ekranRepo.Delete(entity);
        }

        // ── WIDGET ────────────────────────────────────────────

        public List<WidgetDTO> EkranWidgetlariniGetir(long ekranId)
        {
            var widgets = _widgetRepo.GetList($"\"EkranId\" = @eid AND \"AktifMi\" = TRUE AND \"IsDeleted\" = FALSE",
                new { eid = ekranId }, OrderOption.asc, t_sis_widget_properties.SiraNo);
            return _mapper.Map<List<WidgetDTO>>(widgets);
        }

        public WidgetDTO WidgetKaydet(WidgetDTO dto)
        {
            var entity = _mapper.Map<t_sis_widget>(dto);
            _widgetRepo.Save(entity);
            dto.id = entity.Id;
            return dto;
        }

        public void WidgetSil(long widgetId)
        {
            var entity = _widgetRepo.Get(widgetId)
                ?? throw new AppException(404, "Widget bulunamadı");
            _widgetRepo.Delete(entity);
        }

        // ── CONTROLLER METHOD ─────────────────────────────────

        public List<ControllerMethodDTO> ControllerMethodleriGetir()
        {
            var liste = _cmRepo.GetList("\"AktifMi\" = TRUE AND \"IsDeleted\" = FALSE");
            return _mapper.Map<List<ControllerMethodDTO>>(liste);
        }

        public void ControllerMethodleriTara()
        {
            // Service katmanının assembly'sini bul (çalışma zamanında yüklü)
            var assemblies = AppDomain.CurrentDomain.GetAssemblies();
            var serviceAssembly = assemblies.FirstOrDefault(a =>
                a.GetName().Name?.Contains("Lore.Basvuru.Service") == true);

            if (serviceAssembly == null)
            {
                AppLog.Warning("[YetkiManager] Service assembly bulunamadı, controller taraması yapılamadı");
                return;
            }

            var controllers = serviceAssembly.GetTypes()
                .Where(t => typeof(ControllerBase).IsAssignableFrom(t) && !t.IsAbstract)
                .ToList();

            int eklenen = 0;
            foreach (var controller in controllers)
            {
                var controllerAd = controller.Name.Replace("Controller", "");
                var methods = controller.GetMethods(BindingFlags.Public | BindingFlags.Instance)
                    .Where(m =>
                        m.GetCustomAttributes<HttpGetAttribute>().Any() ||
                        m.GetCustomAttributes<HttpPostAttribute>().Any() ||
                        m.GetCustomAttributes<HttpDeleteAttribute>().Any() ||
                        m.GetCustomAttributes<HttpPutAttribute>().Any())
                    .ToList();

                foreach (var method in methods)
                {
                    var httpTip = method.GetCustomAttributes<HttpGetAttribute>().Any() ? "GET"
                        : method.GetCustomAttributes<HttpPostAttribute>().Any() ? "POST"
                        : method.GetCustomAttributes<HttpDeleteAttribute>().Any() ? "DELETE"
                        : "PUT";

                    var existing = _cmRepo.Get(
                        $"\"ControllerAd\" = @c AND \"MethodAd\" = @m AND \"IsDeleted\" = FALSE",
                        new { c = controllerAd, m = method.Name });

                    if (existing == null)
                    {
                        _cmRepo.Insert(new t_sis_controller_method
                        {
                            ControllerAd = controllerAd,
                            MethodAd = method.Name,
                            HttpTip = httpTip,
                            AktifMi = true
                        });
                        eklenen++;
                    }
                }
            }
            AppLog.Info($"[YetkiManager] Controller taraması: {eklenen} yeni method eklendi");
        }

        public void WidgetControllerMethodBagla(long widgetId, List<long> methodIds)
        {
            // Mevcut bağlantıları sil
            _wcmRepo.UpdateSqlToplu(
                "UPDATE t_sis_widget_controller_method SET \"IsDeleted\" = TRUE WHERE \"WidgetId\" = @wid",
                new { wid = widgetId });

            // Yenilerini ekle
            foreach (var methodId in methodIds)
            {
                _wcmRepo.Insert(new t_sis_widget_controller_method
                {
                    WidgetId = widgetId,
                    ControllerMethodId = methodId
                });
            }
        }

        // ── ROL ───────────────────────────────────────────────

        public List<RolDTO> TenantRolleriniGetir(long tenantId)
        {
            var roller = _rolRepo.GetList($"\"TenantId\" = @tid AND \"AktifMi\" = TRUE AND \"IsDeleted\" = FALSE",
                new { tid = tenantId });
            return _mapper.Map<List<RolDTO>>(roller);
        }

        public RolDTO RolKaydet(RolDTO dto)
        {
            var entity = _mapper.Map<t_sis_rol>(dto);
            _rolRepo.Save(entity);
            dto.id = entity.Id;
            return dto;
        }

        public void RolSil(long rolId)
        {
            var entity = _rolRepo.Get(rolId)
                ?? throw new AppException(404, "Rol bulunamadı");
            _rolRepo.Delete(entity);
        }

        public void RolEkranYetkisiKaydet(long rolId, List<long> ekranIds)
        {
            using var scope = _rolEkranRepo.BeginTransaction();
            _rolEkranRepo.UpdateSqlToplu(
                "UPDATE t_sis_rol_ekran SET \"IsDeleted\" = TRUE WHERE \"RolId\" = @rid",
                new { rid = rolId });

            var rol = _rolRepo.Get(rolId);
            foreach (var ekranId in ekranIds)
            {
                _rolEkranRepo.Insert(new t_sis_rol_ekran
                {
                    TenantId = rol?.TenantId ?? 0,
                    RolId = rolId,
                    EkranId = ekranId
                });
            }
            scope.Complete();
        }

        public void RolWidgetYetkisiKaydet(long rolId, List<long> widgetIds)
        {
            using var scope = _rolWidgetRepo.BeginTransaction();
            _rolWidgetRepo.UpdateSqlToplu(
                "UPDATE t_sis_rol_widget SET \"IsDeleted\" = TRUE WHERE \"RolId\" = @rid",
                new { rid = rolId });

            var rol = _rolRepo.Get(rolId);
            foreach (var widgetId in widgetIds)
            {
                _rolWidgetRepo.Insert(new t_sis_rol_widget
                {
                    TenantId = rol?.TenantId ?? 0,
                    RolId = rolId,
                    WidgetId = widgetId
                });
            }
            scope.Complete();
        }

        public void KullaniciRolAta(long userId, long rolId, long tenantId)
        {
            var existing = _userRolRepo.Get(
                $"\"UserId\" = @uid AND \"RolId\" = @rid AND \"IsDeleted\" = FALSE",
                new { uid = userId, rid = rolId });
            if (existing != null) return;

            _userRolRepo.Insert(new t_sis_user_rol
            {
                TenantId = tenantId,
                UserId = userId,
                RolId = rolId,
                AktifMi = true
            });
        }

        public void KullaniciRolKaldir(long userId, long rolId)
        {
            var entity = _userRolRepo.Get(
                $"\"UserId\" = @uid AND \"RolId\" = @rid AND \"IsDeleted\" = FALSE",
                new { uid = userId, rid = rolId });
            if (entity != null) _userRolRepo.Delete(entity);
        }

        // ── YETKİ KONTROL ─────────────────────────────────────

        public bool ControllerMethodYetkisiVarMi(long userId, string controller, string method)
        {
            var sql = @"
                SELECT COUNT(*)
                FROM t_sis_rol_widget rw
                INNER JOIN t_sis_widget_controller_method wcm ON wcm.""WidgetId"" = rw.""WidgetId""
                INNER JOIN t_sis_controller_method cm ON cm.""Id"" = wcm.""ControllerMethodId""
                INNER JOIN t_sis_user_rol ur ON ur.""RolId"" = rw.""RolId""
                WHERE ur.""UserId"" = @uid
                AND cm.""ControllerAd"" = @ctrl
                AND cm.""MethodAd"" = @mth
                AND ur.""AktifMi"" = TRUE AND ur.""IsDeleted"" = FALSE
                AND rw.""IsDeleted"" = FALSE
                AND wcm.""IsDeleted"" = FALSE
                AND cm.""AktifMi"" = TRUE AND cm.""IsDeleted"" = FALSE";

            var count = _cmRepo.Query<int>(sql, new { uid = userId, ctrl = controller, mth = method })
                .FirstOrDefault();
            return count > 0;
        }

        public List<EkranDTO> KullaniciEkranlariniGetir(long userId, long tenantId)
        {
            var sql = @"
                SELECT DISTINCT e.""Id"", e.""Ad"", e.""Yol"", e.""Kod"", e.""UstEkranId"", e.""SiraNo"", e.""Ikon"", e.""AktifMi""
                FROM t_sis_ekran e
                INNER JOIN t_sis_rol_ekran re ON re.""EkranId"" = e.""Id""
                INNER JOIN t_sis_user_rol ur ON ur.""RolId"" = re.""RolId""
                WHERE ur.""UserId"" = @uid
                AND ur.""TenantId"" = @tid
                AND ur.""AktifMi"" = TRUE AND ur.""IsDeleted"" = FALSE
                AND re.""IsDeleted"" = FALSE
                AND e.""AktifMi"" = TRUE AND e.""IsDeleted"" = FALSE
                ORDER BY e.""SiraNo""";

            var ekranlar = _ekranRepo.Query<EkranDTO>(sql, new { uid = userId, tid = tenantId });
            return EkranHiyerarsiOlustur(ekranlar);
        }

        public List<string> KullaniciWidgetKodlariniGetir(long userId, long tenantId)
        {
            var sql = @"
                SELECT DISTINCT w.""Kod""
                FROM t_sis_widget w
                INNER JOIN t_sis_rol_widget rw ON rw.""WidgetId"" = w.""Id""
                INNER JOIN t_sis_user_rol ur ON ur.""RolId"" = rw.""RolId""
                WHERE ur.""UserId"" = @uid
                AND ur.""TenantId"" = @tid
                AND ur.""AktifMi"" = TRUE AND ur.""IsDeleted"" = FALSE
                AND rw.""IsDeleted"" = FALSE
                AND w.""AktifMi"" = TRUE AND w.""IsDeleted"" = FALSE";

            return _widgetRepo.Query<string>(sql, new { uid = userId, tid = tenantId });
        }

        private static List<EkranDTO> EkranHiyerarsiOlustur(List<EkranDTO> tum)
        {
            var lookup = tum.ToDictionary(e => e.id);
            var roots = new List<EkranDTO>();
            foreach (var ekran in tum)
            {
                if (ekran.ustEkranId == null || ekran.ustEkranId == 0)
                {
                    roots.Add(ekran);
                }
                else if (lookup.TryGetValue(ekran.ustEkranId.Value, out var parent))
                {
                    parent.altEkranlar ??= new List<EkranDTO>();
                    parent.altEkranlar.Add(ekran);
                }
            }
            return roots.OrderBy(e => e.siraNo).ToList();
        }
    }
}
