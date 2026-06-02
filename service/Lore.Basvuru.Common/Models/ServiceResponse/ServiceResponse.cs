using Lore.Basvuru.Common.DTO.Enums;

namespace Lore.Basvuru.Common.Models.ServiceResponse
{
    public class ServiceResponse<T>
    {
        public bool isSuccess { get; set; } = true;
        public string message { get; set; } = string.Empty;
        public AppExceptionModel? error_message { get; set; }
        public AppExceptionModel? dev_message { get; set; }
        public T? data { get; set; }
        public int? pageNumber { get; set; }
        public int? itemsPerPage { get; set; }
        public int? totalItems { get; set; }

        public ServiceResponse() { }

        public ServiceResponse(T entity)
        {
            isSuccess = true;
            data = entity;
            message = ServiceResponseMessageType.Success;
        }

        public ServiceResponse(AppException appEx)
        {
            isSuccess = false;
            dev_message = new AppExceptionModel
            {
                messageHeader = appEx.header,
                code = appEx.code,
                message = $"{appEx.message} ST:{appEx.StackTrace}"
            };
            error_message = new AppExceptionModel
            {
                messageHeader = appEx.header,
                code = appEx.code,
                message = appEx.message
            };
            message = ServiceResponseMessageType.Error;
        }

        public ServiceResponse(Exception ex)
        {
            isSuccess = false;
            dev_message = new AppExceptionModel
            {
                messageHeader = "Beklenmedik hata",
                code = (int)MessageCode.ERROR_500_BIR_HATA_OLUSTU,
                message = $"{ex.Message} ST:{ex.StackTrace}"
            };
            error_message = new AppExceptionModel
            {
                messageHeader = "Beklenmedik hata",
                code = (int)MessageCode.ERROR_500_BIR_HATA_OLUSTU,
                message = ex.Message
            };
            message = ServiceResponseMessageType.Error;
        }
    }

    public class AppExceptionModel
    {
        public string messageHeader { get; set; } = string.Empty;
        public int code { get; set; }
        public string message { get; set; } = string.Empty;
    }

    public static class ServiceResponseMessageType
    {
        public static string Error = "error";
        public static string Success = "success";
        public static string Warning = "warning";
        public static string Info = "info";
    }
}
