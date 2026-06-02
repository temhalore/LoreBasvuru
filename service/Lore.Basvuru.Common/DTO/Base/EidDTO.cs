using Lore.Basvuru.Common.Helpers;
using Newtonsoft.Json;

namespace Lore.Basvuru.Common.DTO.Base
{
    /// <summary>
    /// Şifreli ID taşıyıcısı. Frontend ile backend arasında model bazlı çalışır.
    /// - eid set edilince → id otomatik decrypt edilir (request)
    /// - id set edilince  → eid otomatik encrypt edilir (response)
    /// - Sadece eid frontend'e serileştirilir; id backend-only.
    /// </summary>
    public class EidDTO
    {
        private string? _eid;
        private long _id;

        public string? eid
        {
            get => _eid;
            set
            {
                _eid = value;
                _id = string.IsNullOrWhiteSpace(value)
                    ? 0
                    : CryptoHelper.DecryptLong(value);
            }
        }

        [JsonIgnore]
        public long id
        {
            get => _id;
            set
            {
                _id = value;
                _eid = value > 0 ? CryptoHelper.EncryptLong(value) : null;
            }
        }

        // Kolaylık: implicit long dönüşümü → manager'da doğrudan long kullanımı
        public static implicit operator long(EidDTO? dto) => dto?._id ?? 0;

        // Kolaylık: long'dan EidDTO üret
        public static implicit operator EidDTO(long id) => new() { id = id };
    }
}
