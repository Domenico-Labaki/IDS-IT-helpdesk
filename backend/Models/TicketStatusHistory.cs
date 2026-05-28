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
        public string Notes { get; set; }

        // Navigation properties
        public Ticket Ticket { get; set; }
        public User ChangedByUser { get; set; }
        public Status OldStatus { get; set; }
        public Status NewStatus { get; set; }
    }
}
