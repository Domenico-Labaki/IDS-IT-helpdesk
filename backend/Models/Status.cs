namespace HelpdeskApi.Models
{
    public class Status
    {
        public int Id { get; set; }
        public string Name { get; set; }

        // Navigation properties
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
        public ICollection<TicketStatusHistory> OldStatusHistories { get; set; } = new List<TicketStatusHistory>();
        public ICollection<TicketStatusHistory> NewStatusHistories { get; set; } = new List<TicketStatusHistory>();
    }
}
