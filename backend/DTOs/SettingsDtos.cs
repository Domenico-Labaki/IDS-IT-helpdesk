namespace HelpdeskApi.DTOs
{
    public class SystemSettingDto
    {
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }

    public class UpdateSettingsRequest
    {
        public List<SystemSettingDto> Settings { get; set; } = new();
    }

    public class EmailTemplateDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
    }

    public class UpdateEmailTemplateRequest
    {
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
    }

    public class SystemInfoDto
    {
        public string Version { get; set; } = string.Empty;
        public string LastUpdated { get; set; } = string.Empty;
        public string DatabaseStatus { get; set; } = string.Empty;
        public string StorageUsed { get; set; } = string.Empty;
        public string StorageLimit { get; set; } = string.Empty;
        public int TotalUsers { get; set; }
        public int TotalTickets { get; set; }
    }

    public class UpdateUserRoleRequest
    {
        public int RoleId { get; set; }
    }
}
