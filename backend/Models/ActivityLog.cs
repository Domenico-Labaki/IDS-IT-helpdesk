namespace HelpdeskApi.Models
{
    public class ActivityLog
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Action { get; set; }
        public string EntityType { get; set; }
        public Guid? EntityId { get; set; }
        public string Metadata { get; set; }
        public DateTime PerformedAt { get; set; }

        // Navigation properties
        public User User { get; set; }
    }
}
