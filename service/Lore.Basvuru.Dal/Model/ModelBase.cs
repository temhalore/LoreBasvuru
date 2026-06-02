using Lore.Basvuru.Common.Configuration;

namespace Lore.Basvuru.Dal.Model
{
    public class ModelBase
    {
        public bool IsNull()
        {
            var prop = GetType().GetProperty(CoreConfig.IDProperty);
            if (prop == null) return true;
            var val = prop.GetValue(this);
            return val == null || (long)val == 0;
        }
    }
}
