using Lore.Basvuru.Common.DTO.Base.Datatable;
using Lore.Basvuru.Common.DTO.Workflow;

namespace Lore.Basvuru.Bal.Managers.Workflow.Interfaces
{
    public interface IWorkflowManager
    {
        // Tanımlama (admin)
        List<WorkflowDTO> WorkflowListele(long tenantId);
        WorkflowDTO WorkflowGetir(long workflowId);
        WorkflowDTO WorkflowKaydet(WorkflowDTO dto);
        void WorkflowSil(long workflowId);
        WorkflowAdimDTO AdimKaydet(WorkflowAdimDTO dto);
        void AdimSil(long adimId);
        void AdimRolAta(AdimRolAtaReqDTO req);
        void AdimRolFiltresiKaydet(AdimRolFiltreReqDTO req);

        // Onay işlemleri
        DatatableResponseDTO<BasvuruOnayListDTO> OnayBekleyenleriGetir(
            DatatableRequestDTO<BasvuruOnayFiltrDTO> req);
        void AdimIslemYap(WorkflowAdimIslemReqDTO req);
        List<WorkflowAdimDurumDTO> BasvuruAkisGecmisiniGetir(long basvuruId);

        // Dahili
        void WorkflowBaslat(long basvuruId, long workflowId);
    }
}
