using Lore.Basvuru.Common.Logging.Interfaces;

namespace Lore.Basvuru.Common.Logging
{
    /// <summary>
    /// Tüm katmanlardan static olarak erişilebilen log noktası.
    /// </summary>
    public static class AppLog
    {
        private static IAppLogger? _logger;

        public static void Configure(IAppLogger logger)
        {
            _logger = logger;
        }

        public static void Info(string message) => _logger?.Info(message);
        public static void Debug(string message) => _logger?.Debug(message);
        public static void Warning(string message) => _logger?.Warning(message);
        public static void Error(string message, Exception? ex = null) => _logger?.Error(message, ex);
        public static void RequestResponse(string message) => _logger?.RequestResponse(message);
    }
}
