using Lore.Basvuru.Common.DTO.Enums;

namespace Lore.Basvuru.Common.Models
{
    public class AppException : Exception
    {
        public string header { get; set; } = "Hata";
        public int code { get; set; }
        public new string message { get; set; } = string.Empty;

        public AppException(string mesaj)
        {
            message = mesaj;
            code = (int)MessageCode.ERROR_500_BIR_HATA_OLUSTU;
        }

        public AppException(int kod, string mesaj)
        {
            code = kod;
            message = mesaj;
        }

        public AppException(MessageCode kod, string mesaj)
        {
            code = Convert.ToInt16(kod);
            message = mesaj;
        }

        public AppException(MessageCode messageCode, string messageHeader, Exception exp)
        {
            header = messageHeader;
            code = Convert.ToInt16(messageCode);
            message = exp.Message;
        }
    }
}
