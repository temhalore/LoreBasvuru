using AutoMapper;
using Lore.Basvuru.Common.DTO.Form.Common;
using Lore.Basvuru.Common.DTO.Form.FormBuild;
using Lore.Basvuru.Common.DTO.Security.Auth;
using Lore.Basvuru.Common.DTO.Security.Ekran;
using Lore.Basvuru.Common.DTO.Security.Rol;
using Lore.Basvuru.Common.DTO.Security.Widget;
using Lore.Basvuru.Common.DTO.Tenant;
using Lore.Basvuru.Common.DTO.Workflow;
using Lore.Basvuru.Dal.Model;

namespace Lore.Basvuru.Bal.AutoMapper
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // ── SİSTEM ─────────────────────────────────────────────

            CreateMap<t_sis_user, KisiDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id))
                .ForMember(d => d.tenantId, o => o.MapFrom(s => s.TenantId));

            // Tenant
            CreateMap<t_sis_tenant, TenantDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id))
                .ForMember(d => d.webSitesi, o => o.MapFrom(s => s.WebSiteUrl))
                .ForMember(d => d.temaRengi, o => o.Ignore())
                .ForMember(d => d.iletisimEmail, o => o.Ignore())
                .ForMember(d => d.iletisimTelefon, o => o.Ignore());
            CreateMap<TenantDTO, t_sis_tenant>()
                .ForMember(d => d.Id, o => o.MapFrom(s => s.id))
                .ForMember(d => d.WebSiteUrl, o => o.MapFrom(s => s.webSitesi));

            // Kullanıcı
            CreateMap<t_sis_user, KullaniciDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id))
                .ForMember(d => d.tenantId, o => o.MapFrom(s => s.TenantId))
                .ForMember(d => d.tenantEid, o => o.Ignore());

            // Rol
            CreateMap<t_sis_rol, RolDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id));
            CreateMap<RolDTO, t_sis_rol>()
                .ForMember(d => d.Id, o => o.MapFrom(s => s.id));

            // Ekran
            CreateMap<t_sis_ekran, EkranDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id))
                .ForMember(d => d.altEkranlar, o => o.Ignore());
            CreateMap<EkranDTO, t_sis_ekran>()
                .ForMember(d => d.Id, o => o.MapFrom(s => s.id));

            // Widget
            CreateMap<t_sis_widget, WidgetDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id))
                .ForMember(d => d.ekranEid, o => o.Ignore());
            CreateMap<WidgetDTO, t_sis_widget>()
                .ForMember(d => d.Id, o => o.MapFrom(s => s.id));

            // ControllerMethod
            CreateMap<t_sis_controller_method, ControllerMethodDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id));

            // ── FORM (Common — görüntüleme) ─────────────────────────

            CreateMap<t_frm_basvuru_form, BasvuruFormDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id));
            CreateMap<BasvuruFormDTO, t_frm_basvuru_form>()
                .ForMember(d => d.Id, o => o.MapFrom(s => s.id));

            CreateMap<t_frm_sayfa, BasvuruSayfaDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id));
            CreateMap<BasvuruSayfaDTO, t_frm_sayfa>()
                .ForMember(d => d.Id, o => o.MapFrom(s => s.id));

            CreateMap<t_frm_soru, BasvuruSoruDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id));
            CreateMap<BasvuruSoruDTO, t_frm_soru>()
                .ForMember(d => d.Id, o => o.MapFrom(s => s.id));

            CreateMap<t_frm_soru_secenek, BasvuruSecenekDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id));
            CreateMap<BasvuruSecenekDTO, t_frm_soru_secenek>()
                .ForMember(d => d.Id, o => o.MapFrom(s => s.id));

            // ── FORM (FormBuild — yönetim) ──────────────────────────

            CreateMap<t_frm_sayfa, SayfaDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id))
                .ForMember(d => d.basvuruFormId, o => o.MapFrom(s => s.BasvuruFormId))
                .ForMember(d => d.basvuruFormEid, o => o.Ignore())
                .ForMember(d => d.sorular, o => o.Ignore());
            CreateMap<SayfaDTO, t_frm_sayfa>()
                .ForMember(d => d.Id, o => o.MapFrom(s => s.id))
                .ForMember(d => d.BasvuruFormId, o => o.MapFrom(s => s.basvuruFormId));

            CreateMap<t_frm_soru, SoruDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id))
                .ForMember(d => d.sayfaId, o => o.MapFrom(s => s.SayfaId))
                .ForMember(d => d.basvuruFormId, o => o.MapFrom(s => s.BasvuruFormId))
                .ForMember(d => d.sayfaEid, o => o.Ignore())
                .ForMember(d => d.basvuruFormEid, o => o.Ignore())
                .ForMember(d => d.secenekler, o => o.Ignore());
            CreateMap<SoruDTO, t_frm_soru>()
                .ForMember(d => d.Id, o => o.MapFrom(s => s.id))
                .ForMember(d => d.SayfaId, o => o.MapFrom(s => s.sayfaId))
                .ForMember(d => d.BasvuruFormId, o => o.MapFrom(s => s.basvuruFormId));

            CreateMap<t_frm_soru_secenek, SecenekDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id))
                .ForMember(d => d.soruId, o => o.MapFrom(s => s.SoruId))
                .ForMember(d => d.soruEid, o => o.Ignore());
            CreateMap<SecenekDTO, t_frm_soru_secenek>()
                .ForMember(d => d.Id, o => o.MapFrom(s => s.id))
                .ForMember(d => d.SoruId, o => o.MapFrom(s => s.soruId));

            CreateMap<t_frm_kural, KuralDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id))
                .ForMember(d => d.basvuruFormId, o => o.MapFrom(s => s.BasvuruFormId))
                .ForMember(d => d.basvuruFormEid, o => o.Ignore());
            CreateMap<KuralDTO, t_frm_kural>()
                .ForMember(d => d.Id, o => o.MapFrom(s => s.id))
                .ForMember(d => d.BasvuruFormId, o => o.MapFrom(s => s.basvuruFormId));

            // ── WORKFLOW ────────────────────────────────────────────

            CreateMap<t_wf_workflow, WorkflowDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id))
                .ForMember(d => d.adimlar, o => o.Ignore())
                .ForMember(d => d.basvuruFormId, o => o.Ignore())
                .ForMember(d => d.basvuruFormEid, o => o.Ignore());
            CreateMap<WorkflowDTO, t_wf_workflow>()
                .ForMember(d => d.Id, o => o.MapFrom(s => s.id));

            CreateMap<t_wf_adim, WorkflowAdimDTO>()
                .ForMember(d => d.id, o => o.MapFrom(s => s.Id))
                .ForMember(d => d.workflowId, o => o.MapFrom(s => s.WorkflowId))
                .ForMember(d => d.roller, o => o.Ignore())
                .ForMember(d => d.workflowEid, o => o.Ignore());
            CreateMap<WorkflowAdimDTO, t_wf_adim>()
                .ForMember(d => d.Id, o => o.MapFrom(s => s.id))
                .ForMember(d => d.WorkflowId, o => o.MapFrom(s => s.workflowId));
        }
    }
}
