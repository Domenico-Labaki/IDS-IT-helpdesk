using HelpdeskApi.Data;
using HelpdeskApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Services
{
    public interface IAutoAssignmentService
    {
        Task<Guid?> GetBestAgentAsync();
    }

    public class AutoAssignmentService : IAutoAssignmentService
    {
        private readonly AppDbContext _dbContext;

        public AutoAssignmentService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Guid?> GetBestAgentAsync()
        {
            var agentRoleId = await _dbContext.Roles
                .Where(r => r.Name == "Agent")
                .Select(r => r.Id)
                .FirstOrDefaultAsync();

            if (agentRoleId == 0) return null;

            var activeAgentIds = await _dbContext.Users
                .Where(u => u.RoleId == agentRoleId && u.IsActive)
                .Select(u => u.Id)
                .ToListAsync();

            if (activeAgentIds.Count == 0) return null;

            var openStatusIds = await _dbContext.Statuses
                .Where(s => s.Name == "Open" || s.Name == "In Progress" || s.Name == "Pending")
                .Select(s => s.Id)
                .ToListAsync();

            var loadCounts = new Dictionary<Guid, int>();

            foreach (var agentId in activeAgentIds)
            {
                var count = await _dbContext.Tickets
                    .CountAsync(t => t.AssignedTo == agentId && openStatusIds.Contains(t.StatusId));
                loadCounts[agentId] = count;
            }

            var minLoad = loadCounts.Values.Min();
            var bestAgent = loadCounts.First(kv => kv.Value == minLoad).Key;
            return bestAgent;
        }
    }
}
