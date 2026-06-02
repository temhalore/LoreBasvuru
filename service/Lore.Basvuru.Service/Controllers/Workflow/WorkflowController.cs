using Lore.Basvuru.Bal.Managers.Workflow.Interfaces;
using Lore.Basvuru.Common.DTO.Base.Datatable;
using Lore.Basvuru.Common.DTO.Workflow;
using Lore.Basvuru.Common.Helpers;
using Lore.Basvuru.Service.Filters;
using Microsoft.AspNetCore.Mvc;

namespace Lore.Basvuru.Service.Controllers.Workflow
{
    public class WorkflowController : BaseController
    {
        private readonly IWorkflowManager _workflowManager;

        public WorkflowController(IWorkflowManager workflowManager)
        {
            _workflowManager = workflowManager;
        }

        // ── TANIM ─────────────────────────────────────────────────

        [HttpGet]
        public IActionResult WorkflowListele()
            => Ok(_workflowManager.WorkflowListele(CurrentTenantId));

        [HttpGet]
        public IActionResult WorkflowGetir([FromQuery] string eid)
            => Ok(_workflowManager.WorkflowGetir(CryptoHelper.DecryptLong(eid)));

        [HttpPost]
        public IActionResult WorkflowKaydet([FromBody] WorkflowDTO dto)
            => Ok(_workflowManager.WorkflowKaydet(dto));

        [HttpDelete]
        public IActionResult WorkflowSil([FromQuery] string eid)
        {
            _workflowManager.WorkflowSil(CryptoHelper.DecryptLong(eid));
            return OkEmpty();
        }

        [HttpPost]
        public IActionResult AdimKaydet([FromBody] WorkflowAdimDTO dto)
            => Ok(_workflowManager.AdimKaydet(dto));

        [HttpDelete]
        public IActionResult AdimSil([FromQuery] string eid)
        {
            _workflowManager.AdimSil(CryptoHelper.DecryptLong(eid));
            return OkEmpty();
        }

        [HttpPost]
        public IActionResult AdimRolAta([FromBody] AdimRolAtaReqDTO req)
        {
            _workflowManager.AdimRolAta(req);
            return OkEmpty();
        }

        [HttpPost]
        public IActionResult AdimRolFiltresiKaydet([FromBody] AdimRolFiltreReqDTO req)
        {
            _workflowManager.AdimRolFiltresiKaydet(req);
            return OkEmpty();
        }

        // ── ONAY ──────────────────────────────────────────────────

        [HttpPost]
        [NoPermissionCheck]
        public IActionResult OnayBekleyenleriGetir([FromBody] DatatableRequestDTO<BasvuruOnayFiltrDTO> req)
            => Ok(_workflowManager.OnayBekleyenleriGetir(req));

        [HttpPost]
        [NoPermissionCheck]
        public IActionResult AdimIslemYap([FromBody] WorkflowAdimIslemReqDTO req)
        {
            _workflowManager.AdimIslemYap(req);
            return OkEmpty();
        }

        [HttpGet]
        [NoPermissionCheck]
        public IActionResult BasvuruAkisGecmisiniGetir([FromQuery] string basvuruEid)
            => Ok(_workflowManager.BasvuruAkisGecmisiniGetir(CryptoHelper.DecryptLong(basvuruEid)));
    }
}
