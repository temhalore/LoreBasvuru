using Lore.Basvuru.Common.DTO.Security.Auth;

namespace Lore.Basvuru.Bal.Managers.Security.Interfaces
{
    public interface IAuthManager
    {
        KisiTokenDTO Login(LoginRequestDTO request);
        KisiTokenDTO TalendCallback(SSOLoginRequestDTO request);
        KisiTokenDTO TokenDogrula(string token);
        void Logout(string token);
    }
}
