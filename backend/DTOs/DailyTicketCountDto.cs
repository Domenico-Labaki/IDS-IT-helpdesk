namespace HelpdeskApi.DTOs
{
    public class DailyTicketCountDto
    {
        public string Date { get; set; } = string.Empty;
        public int Created { get; set; }
        public int Resolved { get; set; }
    }
}
