namespace HelpdeskApi.DTOs
{
    public class TicketStatusResponse
    {
        public Guid TicketId { get; set; }
        public int OldStatusId { get; set; }
        public int NewStatusId { get; set; }
        public string NewStatusName { get; set; } = string.Empty;
        public DateTime ChangedAt { get; set; }
    }
}
