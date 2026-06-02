namespace Lore.Basvuru.Common.Logging.Interfaces
{
    public interface IAppLogger
    {
        void Info(string message);
        void Debug(string message);
        void Warning(string message);
        void Error(string message, Exception? ex = null);
        void RequestResponse(string message);
    }
}
