namespace HelpdeskApi.Models
{
    public class TicketComment
    {
        public Guid Id { get; set; }
        public Guid TicketId { get; set; }
        public Guid AuthorId { get; set; }
        public string Body { get; set; }
        public bool IsInternal { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public Ticket Ticket { get; set; }
        public User Author { get; set; }
    }
}
