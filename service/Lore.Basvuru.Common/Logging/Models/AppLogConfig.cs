namespace Lore.Basvuru.Common.Logging.Models
{
    public class AppLogConfig
    {
        public bool IsActive { get; set; } = true;
        public string ProjectName { get; set; } = "LoreBasvuru";
        public string LogDirectory { get; set; } = "Logs";
        public string FallbackDirectory { get; set; } = "C:\\Logs\\LoreBasvuru";
        public bool EnableRequestResponseLogging { get; set; } = true;
        public bool EnableExceptionDetailLogging { get; set; } = true;
        public LogLevelConfig Levels { get; set; } = new();
    }

    public class LogLevelConfig
    {
        public bool Debug { get; set; } = false;
        public bool Info { get; set; } = true;
        public bool Warning { get; set; } = true;
        public bool Error { get; set; } = true;
        public bool RequestResponse { get; set; } = true;
    }
}
