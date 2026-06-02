using Lore.Basvuru.Common.Helpers;
using Newtonsoft.Json;

namespace Lore.Basvuru.Common.DTO.Base
{
    public abstract class BaseDTO
    {
        private string? _eid;
        private long _id;
        private bool _manualEidSet = false;

        [JsonIgnore]
        public long id
        {
            get => _id;
            set
            {
                _id = value;
                if (_id > 0 && !_manualEidSet)
                    _eid = CryptoHelper.EncryptString(_id.ToString());
            }
        }

        public string? eid
        {
            get => _eid;
            set
            {
                _eid = value;
                if (_eid != null) _manualEidSet = true;

                if (!string.IsNullOrWhiteSpace(_eid))
                {
                    try
                    {
                        _id = Convert.ToInt64(CryptoHelper.DecryptString(_eid));
                        _manualEidSet = false;
                    }
                    catch
                    {
                        _id = 0;
                    }
                }
            }
        }
    }
}
