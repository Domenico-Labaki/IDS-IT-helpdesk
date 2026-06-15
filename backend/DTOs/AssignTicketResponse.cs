namespace HelpdeskApi.DTOs
{
    public class AssignTicketResponse
    {
        public Guid TicketId { get; set; }
        public Guid? AssignedTo { get; set; }
        public DateTime AssignedAt { get; set; }
    }
}
