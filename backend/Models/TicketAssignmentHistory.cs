namespace HelpdeskApi.Models
{
    public class TicketAssignmentHistory
    {
        public Guid Id { get; set; }
        public Guid TicketId { get; set; }
        public Guid AssignedBy { get; set; }
        public Guid? AssignedTo { get; set; }
        public DateTime AssignedAt { get; set; }

        // Navigation properties
        public Ticket Ticket { get; set; } = null!;
        public User AssignedByUser { get; set; } = null!;
        public User? AssignedToUser { get; set; }
    }
}
