namespace HelpdeskApi.DTOs
{
    public class StatusHistoryEntry
    {
        public Guid Id { get; set; }
        public Guid TicketId { get; set; }
        public Guid ChangedBy { get; set; }
        public string ChangedByName { get; set; } = string.Empty;
        public int OldStatusId { get; set; }
        public string OldStatusName { get; set; } = string.Empty;
        public int NewStatusId { get; set; }
        public string NewStatusName { get; set; } = string.Empty;
        public DateTime ChangedAt { get; set; }
        public string Notes { get; set; } = string.Empty;
    }
}
