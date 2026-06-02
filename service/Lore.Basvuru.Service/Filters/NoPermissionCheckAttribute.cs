namespace Lore.Basvuru.Service.Filters
{
    /// <summary>
    /// Bu attribute ile işaretlenen action'lar token doğrulaması gerektirir,
    /// ancak controller-method yetki kontrolünden muaf tutulur.
    /// Kullanıcının kendi verilerine eriştiği endpointler için kullanılır.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class NoPermissionCheckAttribute : Attribute { }
}
