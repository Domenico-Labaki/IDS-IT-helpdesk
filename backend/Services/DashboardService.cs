using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _dbContext;

        public DashboardService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<DashboardStatsDto> GetStatsAsync(Guid userId, string role)
        {
            var stats = new DashboardStatsDto();

            if (role == "Employee")
            {
                stats.TotalCreated = await _dbContext.Tickets.CountAsync(t => t.CreatedBy == userId);
                stats.OpenCount = await _dbContext.Tickets.CountAsync(t => t.CreatedBy == userId && t.StatusId == 1);
                stats.ResolvedCount = await _dbContext.Tickets.CountAsync(t => t.CreatedBy == userId && t.StatusId == 3);
            }
            else if (role == "Agent")
            {
                stats.TotalAssigned = await _dbContext.Tickets.CountAsync(t => t.AssignedTo == userId);
                stats.OpenCount = await _dbContext.Tickets.CountAsync(t => t.AssignedTo == userId && t.StatusId == 1);
                stats.InProgressCount = await _dbContext.Tickets.CountAsync(t => t.AssignedTo == userId && t.StatusId == 2);
                stats.ResolvedCount = await _dbContext.Tickets.CountAsync(t => t.AssignedTo == userId && t.StatusId == 3);
            }
            else
            {
                var today = DateTime.UtcNow.Date;

                stats.TotalTickets = await _dbContext.Tickets.CountAsync();
                stats.OpenCount = await _dbContext.Tickets.CountAsync(t => t.StatusId == 1);
                stats.InProgressCount = await _dbContext.Tickets.CountAsync(t => t.StatusId == 2);
                stats.ResolvedCount = await _dbContext.Tickets.CountAsync(t => t.StatusId == 3);
                stats.ClosedCount = await _dbContext.Tickets.CountAsync(t => t.StatusId == 4);
                stats.CancelledCount = await _dbContext.Tickets.CountAsync(t => t.StatusId == 5);
                stats.UnassignedCount = await _dbContext.Tickets.CountAsync(t => t.AssignedTo == null);
                stats.CreatedTodayCount = await _dbContext.Tickets.CountAsync(t => t.CreatedAt >= today);
            }

            return stats;
        }

        public async Task<List<ChartDataPoint>> GetTicketsByCategoryAsync()
        {
            return await _dbContext.Tickets
                .GroupBy(t => t.CategoryId)
                .Select(g => new { g.Key, Count = g.Count() })
                .Join(_dbContext.Categories,
                    t => t.Key,
                    c => c.Id,
                    (t, c) => new ChartDataPoint { Label = c.Name, Count = t.Count })
                .OrderByDescending(x => x.Count)
                .ToListAsync();
        }

        public async Task<List<PriorityCountDto>> GetTicketsByPriorityAsync()
        {
            return await _dbContext.Tickets
                .GroupBy(t => t.PriorityId)
                .Select(g => new { g.Key, Count = g.Count() })
                .Join(_dbContext.Priorities,
                    t => t.Key,
                    p => p.Id,
                    (t, p) => new PriorityCountDto { PriorityName = p.Name, Level = p.Level, Count = t.Count })
                .OrderBy(x => x.Level)
                .ToListAsync();
        }

        public async Task<List<ChartDataPoint>> GetTicketsByStatusAsync()
        {
            return await _dbContext.Tickets
                .GroupBy(t => t.StatusId)
                .Select(g => new { g.Key, Count = g.Count() })
                .Join(_dbContext.Statuses,
                    t => t.Key,
                    s => s.Id,
                    (t, s) => new ChartDataPoint { Label = s.Name, Count = t.Count })
                .ToListAsync();
        }

        public async Task<List<DailyTicketCountDto>> GetTicketsOverTimeAsync(int days)
        {
            var since = DateTime.UtcNow.Date.AddDays(-(days - 1));

            var created = await _dbContext.Tickets
                .Where(t => t.CreatedAt >= since)
                .GroupBy(t => t.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            var resolved = await _dbContext.Tickets
                .Where(t => t.ResolvedAt != null && t.ResolvedAt.Value >= since)
                .GroupBy(t => t.ResolvedAt!.Value.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            var createdLookup = created.ToDictionary(x => x.Date, x => x.Count);
            var resolvedLookup = resolved.ToDictionary(x => x.Date, x => x.Count);

            var result = new List<DailyTicketCountDto>();
            for (var date = since; date <= DateTime.UtcNow.Date; date = date.AddDays(1))
            {
                result.Add(new DailyTicketCountDto
                {
                    Date = date.ToString("yyyy-MM-dd"),
                    Created = createdLookup.GetValueOrDefault(date, 0),
                    Resolved = resolvedLookup.GetValueOrDefault(date, 0)
                });
            }

            return result;
        }

        public async Task<List<AgentPerformanceDto>> GetAgentPerformanceAsync()
        {
            var agentRole = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Name == "Agent");
            if (agentRole == null)
                return new List<AgentPerformanceDto>();

            var agents = await _dbContext.Users
                .Where(u => u.RoleId == agentRole.Id && u.IsActive)
                .ToListAsync();

            var result = new List<AgentPerformanceDto>();
            foreach (var agent in agents)
            {
                var assignedCount = await _dbContext.Tickets
                    .CountAsync(t => t.AssignedTo == agent.Id);

                var resolvedTickets = await _dbContext.Tickets
                    .Where(t => t.AssignedTo == agent.Id && t.StatusId == 3)
                    .ToListAsync();

                var resolvedCount = resolvedTickets.Count;

                var avgHours = resolvedCount > 0
                    ? resolvedTickets
                        .Where(t => t.ResolvedAt.HasValue)
                        .Average(t => (t.ResolvedAt!.Value - t.CreatedAt).TotalHours)
                    : 0.0;

                result.Add(new AgentPerformanceDto
                {
                    AgentId = agent.Id,
                    AgentName = agent.FullName,
                    AssignedCount = assignedCount,
                    ResolvedCount = resolvedCount,
                    AvgResolutionHours = Math.Round(avgHours, 1)
                });
            }

            return result;
        }
    }
}
