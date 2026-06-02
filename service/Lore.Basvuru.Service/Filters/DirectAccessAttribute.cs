namespace Lore.Basvuru.Service.Filters
{
    /// <summary>
    /// Bu attribute ile işaretlenen action'lar token doğrulamasından muaf tutulur.
    /// Anonim erişime açık endpointler (Login, Public Form vb.) için kullanılır.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class DirectAccessAttribute : Attribute { }
}
