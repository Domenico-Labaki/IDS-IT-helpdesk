using System.ComponentModel.DataAnnotations;

namespace HelpdeskApi.Helpers
{
    public class JwtSettings
    {
        public string Secret { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;

        [Range(1, 1440)]
        public int ExpiryMinutes { get; set; }
    }
}
