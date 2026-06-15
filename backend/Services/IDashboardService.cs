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
    }
}
