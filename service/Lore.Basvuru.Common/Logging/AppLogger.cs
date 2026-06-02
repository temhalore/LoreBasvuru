using Lore.Basvuru.Common.Logging.Interfaces;
using Lore.Basvuru.Common.Logging.Models;

namespace Lore.Basvuru.Common.Logging
{
    public class AppLogger : IAppLogger
    {
        private readonly AppLogConfig _config;
        private readonly object _lock = new();

        public AppLogger(AppLogConfig config)
        {
            _config = config;
        }

        private string GetLogDir()
        {
            try
            {
                var dir = Path.Combine(_config.LogDirectory, DateTime.Now.ToString("yyyy-MM"));
                if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                return dir;
            }
            catch
            {
                var fallback = Path.Combine(_config.FallbackDirectory, DateTime.Now.ToString("yyyy-MM"));
                if (!Directory.Exists(fallback)) Directory.CreateDirectory(fallback);
                return fallback;
            }
        }

        private void Write(string level, string message, Exception? ex = null)
        {
            try
            {
                var dir = GetLogDir();
                var file = Path.Combine(dir, $"{_config.ProjectName}_{level}_{DateTime.Now:yyyy-MM-dd}.log");
                var line = $"[{DateTime.Now:HH:mm:ss}] {message}";
                if (ex != null) line += $"\n  EX: {ex.Message}\n  ST: {ex.StackTrace}";
                lock (_lock)
                {
                    File.AppendAllText(file, line + "\n");
                }
            }
            catch { /* Log yazma hatası ignore */ }
        }

        public void Info(string message) { if (_config.IsActive && _config.Levels.Info) Write("Info", message); }
        public void Debug(string message) { if (_config.IsActive && _config.Levels.Debug) Write("Debug", message); }
        public void Warning(string message) { if (_config.IsActive && _config.Levels.Warning) Write("Warning", message); }
        public void Error(string message, Exception? ex = null) { if (_config.IsActive && _config.Levels.Error) Write("Error", message, ex); }
        public void RequestResponse(string message) { if (_config.IsActive && _config.Levels.RequestResponse) Write("ReqRes", message); }
    }
}
