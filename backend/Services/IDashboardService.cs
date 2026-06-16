using HelpdeskApi.DTOs;

namespace HelpdeskApi.Services
{
    public interface IDashboardService
    {
        Task<DashboardStatsDto> GetStatsAsync(Guid userId, string role);
        Task<List<ChartDataPoint>> GetTicketsByCategoryAsync();
        Task<List<PriorityCountDto>> GetTicketsByPriorityAsync();
        Task<List<ChartDataPoint>> GetTicketsByStatusAsync();
        Task<List<DailyTicketCountDto>> GetTicketsOverTimeAsync(int days);
        Task<List<AgentPerformanceDto>> GetAgentPerformanceAsync();
        Task<SlaComplianceDto> GetSlaComplianceAsync(DateTime? from, DateTime? to);
    }

    public class SlaComplianceDto
    {
        public int TotalTickets { get; set; }
        public int BreachedCount { get; set; }
        public double CompliancePercentage { get; set; }
        public List<SlaBreachDetail> Breaches { get; set; } = new();
    }

    public class SlaBreachDetail
    {
        public Guid TicketId { get; set; }
        public string ReferenceNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string PriorityName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public DateTime? SlaDeadline { get; set; }
    }
}
