namespace HelpdeskApi.DTOs
{
    public class ActivityLogEntryDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public Guid? EntityId { get; set; }
        public string Metadata { get; set; } = string.Empty;
        public DateTime PerformedAt { get; set; }
    }
}
