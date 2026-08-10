using HelpdeskApi.Data;
using HelpdeskApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Services
{
    public interface IEscalationService
    {
        Task<List<EscalationRule>> GetAllRulesAsync();
        Task<EscalationRule> CreateRuleAsync(string name, int priorityId, int triggerHours, int? targetRoleId, int? escalateToRoleId);
        Task<EscalationRule?> UpdateRuleAsync(int id, string name, int priorityId, int triggerHours, int? targetRoleId, int? escalateToRoleId, bool isActive);
        Task<bool> DeleteRuleAsync(int id);
        Task ProcessEscalationsAsync();
    }

    public class EscalationService : IEscalationService
    {
        private readonly AppDbContext _dbContext;
        private readonly INotificationService _notificationService;

        public EscalationService(AppDbContext dbContext, INotificationService notificationService)
        {
            _dbContext = dbContext;
            _notificationService = notificationService;
        }

        public async Task<List<EscalationRule>> GetAllRulesAsync()
        {
            return await _dbContext.EscalationRules
                .Include(r => r.Priority)
                .Include(r => r.TargetRole)
                .Include(r => r.EscalateToRole)
                .OrderBy(r => r.Priority.Level)
                .ToListAsync();
        }

        public async Task<EscalationRule> CreateRuleAsync(string name, int priorityId, int triggerHours, int? targetRoleId, int? escalateToRoleId)
        {
            var rule = new EscalationRule
            {
                Name = name,
                PriorityId = priorityId,
                TriggerHours = triggerHours,
                TargetRoleId = targetRoleId,
                EscalateToRoleId = escalateToRoleId,
                IsActive = true
            };

            _dbContext.EscalationRules.Add(rule);
            await _dbContext.SaveChangesAsync();
            return rule;
        }

        public async Task<EscalationRule?> UpdateRuleAsync(int id, string name, int priorityId, int triggerHours, int? targetRoleId, int? escalateToRoleId, bool isActive)
        {
            var rule = await _dbContext.EscalationRules.FindAsync(id);
            if (rule == null) return null;

            rule.Name = name;
            rule.PriorityId = priorityId;
            rule.TriggerHours = triggerHours;
            rule.TargetRoleId = targetRoleId;
            rule.EscalateToRoleId = escalateToRoleId;
            rule.IsActive = isActive;

            await _dbContext.SaveChangesAsync();
            return rule;
        }

        public async Task<bool> DeleteRuleAsync(int id)
        {
            var rule = await _dbContext.EscalationRules.FindAsync(id);
            if (rule == null) return false;

            _dbContext.EscalationRules.Remove(rule);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task ProcessEscalationsAsync()
        {
            var activeRules = await _dbContext.EscalationRules
                .Where(r => r.IsActive)
                .Include(r => r.Priority)
                .Include(r => r.EscalateToRole)
                .ToListAsync();

            foreach (var rule in activeRules)
            {
                var deadline = DateTime.UtcNow.AddHours(-rule.TriggerHours);

                var overdueTickets = await _dbContext.Tickets
                    .Include(t => t.Status)
                    .Include(t => t.AssignedToUser)
                    .Where(t => t.PriorityId == rule.PriorityId
                        && t.CreatedAt <= deadline
                        && t.SlaBreachedAt == null
                        && (t.Status.Name == "Open" || t.Status.Name == "In Progress" || t.Status.Name == "Pending")
                        && (t.SlaDeadline == null || t.SlaDeadline <= DateTime.UtcNow))
                    .ToListAsync();

                foreach (var ticket in overdueTickets)
                {
                    // Try to find an agent with the escalate-to role to reassign
                    if (rule.EscalateToRoleId.HasValue && ticket.AssignedTo.HasValue)
                    {
                        var newAgent = await _dbContext.Users
                            .Where(u => u.RoleId == rule.EscalateToRoleId.Value && u.IsActive)
                            .OrderBy(u => Guid.NewGuid())
                            .FirstOrDefaultAsync();

                        if (newAgent != null)
                        {
                            var oldAssigneeId = ticket.AssignedTo.Value;
                            ticket.AssignedTo = newAgent.Id;
                            ticket.UpdatedAt = DateTime.UtcNow;

                            _dbContext.TicketAssignmentHistories.Add(new TicketAssignmentHistory
                            {
                                Id = Guid.NewGuid(),
                                TicketId = ticket.Id,
                                AssignedBy = ticket.CreatedBy,
                                AssignedTo = newAgent.Id,
                                AssignedAt = DateTime.UtcNow
                            });

                            _dbContext.ActivityLogs.Add(new ActivityLog
                            {
                                Id = Guid.NewGuid(),
                                UserId = newAgent.Id,
                                Action = "TICKET_ESCALATED",
                                EntityType = "Ticket",
                                EntityId = ticket.Id,
                                Metadata = $"{{\"rule\":\"{rule.Name}\",\"fromAgent\":\"{oldAssigneeId}\",\"toAgent\":\"{newAgent.Id}\"}}",
                                PerformedAt = DateTime.UtcNow
                            });

                            await _notificationService.CreateNotificationAsync(newAgent.Id, ticket.Id,
                                $"Ticket {ticket.ReferenceNumber} has been escalated to you per rule: {rule.Name}");

                            if (oldAssigneeId != Guid.Empty)
                            {
                                await _notificationService.CreateNotificationAsync(oldAssigneeId, ticket.Id,
                                    $"Ticket {ticket.ReferenceNumber} has been escalated to another agent per rule: {rule.Name}");
                            }
                        }
                    }

                    ticket.SlaBreachedAt = DateTime.UtcNow;
                }

                await _dbContext.SaveChangesAsync();
            }
        }
    }
}
