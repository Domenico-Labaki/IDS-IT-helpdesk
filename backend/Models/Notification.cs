namespace HelpdeskApi.Models
{
    public class Notification
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid? TicketId { get; set; }
        public string Message { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public User User { get; set; }
        public Ticket Ticket { get; set; }
    }
}
