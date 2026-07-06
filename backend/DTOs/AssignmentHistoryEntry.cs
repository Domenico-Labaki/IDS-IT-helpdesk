namespace HelpdeskApi.DTOs
{
    public class AssignmentHistoryEntry
    {
        public Guid Id { get; set; }
        public Guid TicketId { get; set; }
        public Guid AssignedBy { get; set; }
        public string AssignedByName { get; set; } = string.Empty;
        public string? AssignedByAvatarUrl { get; set; }
        public Guid? AssignedTo { get; set; }
        public string? AssignedToName { get; set; }
        public string? AssignedToAvatarUrl { get; set; }
        public DateTime AssignedAt { get; set; }
    }
}
