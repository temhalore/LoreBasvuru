using Lore.Basvuru.Common.DTO.Form.FormBuild;

namespace Lore.Basvuru.Bal.Managers.DisServis.Interfaces
{
    public interface IDisServisManager
    {
        List<SelectItemDTO> SecenekleriGetir(
            long soruId,
            string? aramaMetni = null,
            Dictionary<string, string>? ekParametreler = null);
    }
}
