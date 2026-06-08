namespace HelpdeskApi.Models
{
    public class TicketStatusHistory
    {
        public Guid Id { get; set; }
        public Guid TicketId { get; set; }
        public Guid ChangedBy { get; set; }
        public int OldStatusId { get; set; }
        public int NewStatusId { get; set; }
        public DateTime ChangedAt { get; set; }
        public string Notes { get; set; } = string.Empty;

        // Navigation properties
        public Ticket Ticket { get; set; } = null!;
        public User ChangedByUser { get; set; } = null!;
        public Status OldStatus { get; set; } = null!;
        public Status NewStatus { get; set; } = null!;
    }
}
