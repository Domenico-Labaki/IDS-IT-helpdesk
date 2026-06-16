using System.Security.Cryptography;
using AutoMapper;
using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using HelpdeskApi.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Services
{
    public class TicketService : ITicketService
    {
        private readonly AppDbContext _dbContext;
        private readonly IMapper _mapper;
        private readonly INotificationService _notificationService;
        private readonly IEmailService _emailService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IAutoAssignmentService _autoAssignmentService;

        public TicketService(AppDbContext dbContext, IMapper mapper, INotificationService notificationService, IEmailService emailService, IHttpContextAccessor httpContextAccessor, IAutoAssignmentService autoAssignmentService)
        {
            _dbContext = dbContext;
            _mapper = mapper;
            _notificationService = notificationService;
            _emailService = emailService;
            _httpContextAccessor = httpContextAccessor;
            _autoAssignmentService = autoAssignmentService;
        }

        public async Task<PagedResult<TicketResponseDto>> GetAllTicketsAsync(Guid requestingUserId, string role, int page = 1, int pageSize = 50, string? searchText = null, int? categoryId = null, int? priorityId = null, int? statusId = null, Guid? assignedTo = null, DateTime? dateFrom = null, DateTime? dateTo = null, string? sortBy = null, string? sortOrder = null)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 50;
            if (pageSize > 200) pageSize = 200;

            var query = IncludeNavigations(_dbContext.Tickets);

            if (role == "Employee")
            {
                query = query.Where(t => t.CreatedBy == requestingUserId);
            }

            if (!string.IsNullOrWhiteSpace(searchText))
            {
                var q = searchText.ToLower();
                query = query.Where(t => t.Title.ToLower().Contains(q) || t.Description.ToLower().Contains(q) || t.ReferenceNumber.ToLower().Contains(q));
            }

            if (categoryId.HasValue)
                query = query.Where(t => t.CategoryId == categoryId.Value);

            if (priorityId.HasValue)
                query = query.Where(t => t.PriorityId == priorityId.Value);

            if (statusId.HasValue)
                query = query.Where(t => t.StatusId == statusId.Value);

            if (assignedTo.HasValue)
                query = query.Where(t => t.AssignedTo == assignedTo.Value);

            if (dateFrom.HasValue)
                query = query.Where(t => t.CreatedAt >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(t => t.CreatedAt <= dateTo.Value);

            var totalCount = await query.CountAsync();

            query = (sortBy?.ToLower(), sortOrder?.ToLower()) switch
            {
                ("title", "asc") => query.OrderBy(t => t.Title),
                ("title", "desc") => query.OrderByDescending(t => t.Title),
                ("priority", "asc") => query.OrderBy(t => t.Priority.Level),
                ("priority", "desc") => query.OrderByDescending(t => t.Priority.Level),
                ("status", "asc") => query.OrderBy(t => t.Status.Name),
                ("status", "desc") => query.OrderByDescending(t => t.Status.Name),
                ("createdat", "asc") => query.OrderBy(t => t.CreatedAt),
                ("updatedat", "asc") => query.OrderBy(t => t.UpdatedAt),
                ("updatedat", "desc") => query.OrderByDescending(t => t.UpdatedAt),
                _ => query.OrderByDescending(t => t.CreatedAt),
            };

            var tickets = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<TicketResponseDto>
            {
                Items = _mapper.Map<List<TicketResponseDto>>(tickets),
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }

        public async Task<TicketResponseDto?> GetTicketByIdAsync(Guid ticketId, Guid requestingUserId, string role)
        {
            var ticket = await IncludeNavigations(_dbContext.Tickets)
                .FirstOrDefaultAsync(t => t.Id == ticketId);

            if (ticket == null)
            {
                return null;
            }

            if (role == "Employee" && ticket.CreatedBy != requestingUserId)
            {
                throw new UnauthorizedAccessException("You can only view your own tickets.");
            }

            return _mapper.Map<TicketResponseDto>(ticket);
        }

        public async Task<TicketResponseDto> CreateTicketAsync(TicketCreateDto dto, Guid createdByUserId)
        {
            var referenceNumber = await GenerateUniqueReferenceNumberAsync();

            var openStatus = await _dbContext.Statuses.FirstOrDefaultAsync(s => s.Name == "Open")
                ?? throw new InvalidOperationException("Open status not found. Ensure seed data is applied.");

            var category = await _dbContext.Categories.FindAsync(dto.CategoryId)
                ?? throw new ArgumentException($"Category with ID {dto.CategoryId} not found.");

            var priority = await _dbContext.Priorities.FindAsync(dto.PriorityId)
                ?? throw new ArgumentException($"Priority with ID {dto.PriorityId} not found.");

            var createdByUser = await _dbContext.Users.FindAsync(createdByUserId);

            // Compute SLA deadline
            DateTime? slaDeadline = null;
            var slaSetting = await _dbContext.SystemSettings.FirstOrDefaultAsync(s => s.Key == "slaEnabled");
            if (slaSetting?.Value == "true")
            {
                var slaTarget = await _dbContext.SlaTargets
                    .FirstOrDefaultAsync(st => st.PriorityId == dto.PriorityId);
                if (slaTarget != null)
                {
                    slaDeadline = DateTime.UtcNow.AddHours(slaTarget.TargetHours);
                }
            }

            var ticket = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = referenceNumber,
                Title = dto.Title,
                Description = dto.Description,
                CategoryId = dto.CategoryId,
                PriorityId = dto.PriorityId,
                StatusId = openStatus.Id,
                CreatedBy = createdByUserId,
                CreatedAt = DateTime.UtcNow,
                SlaDeadline = slaDeadline,
                Status = openStatus,
                Category = category,
                Priority = priority,
                CreatedByUser = createdByUser
            };

            _dbContext.Tickets.Add(ticket);
            _dbContext.ActivityLogs.Add(ActivityLogEntry(createdByUserId, "TicketCreated", "Ticket", ticket.Id));

            await _dbContext.SaveChangesAsync();

            // Auto-assign if enabled
            var autoAssignSetting = await _dbContext.SystemSettings
                .FirstOrDefaultAsync(s => s.Key == "autoAssign");
            if (autoAssignSetting?.Value == "true" && ticket.AssignedTo == null)
            {
                var bestAgentId = await _autoAssignmentService.GetBestAgentAsync();
                if (bestAgentId.HasValue)
                {
                    ticket.AssignedTo = bestAgentId.Value;
                    ticket.UpdatedAt = DateTime.UtcNow;
                    _dbContext.TicketAssignmentHistories.Add(new TicketAssignmentHistory
                    {
                        Id = Guid.NewGuid(),
                        TicketId = ticket.Id,
                        AssignedBy = createdByUserId,
                        AssignedTo = bestAgentId.Value,
                        AssignedAt = DateTime.UtcNow
                    });
                    _dbContext.ActivityLogs.Add(ActivityLogEntry(createdByUserId, "TICKET_AUTO_ASSIGNED", "Ticket", ticket.Id));
                    await _dbContext.SaveChangesAsync();
                    await _notificationService.CreateNotificationAsync(bestAgentId.Value, ticket.Id,
                        $"You have been auto-assigned ticket {ticket.ReferenceNumber}: {ticket.Title}");
                }
            }

            await _emailService.SendTicketCreatedEmailAsync(
                createdByUser?.Email ?? string.Empty,
                createdByUser?.FullName ?? string.Empty,
                ticket.ReferenceNumber,
                ticket.Title,
                GetTicketUrl(ticket.Id));

            return _mapper.Map<TicketResponseDto>(ticket);
        }

        public async Task<TicketResponseDto?> UpdateTicketAsync(Guid ticketId, TicketUpdateDto dto, Guid requestingUserId, string role)
        {
            var ticket = await IncludeNavigations(_dbContext.Tickets)
                .FirstOrDefaultAsync(t => t.Id == ticketId);

            if (ticket == null)
            {
                return null;
            }

            if (role == "Employee")
            {
                ValidateEmployeeUpdate(ticket, requestingUserId);
                ApplyBasicFields(ticket, dto);
            }
            else
            {
                var oldStatusId = ticket.StatusId;
                var oldAssignedTo = ticket.AssignedTo;
                ApplyBasicFields(ticket, dto);
                ticket.StatusId = dto.StatusId;
                ticket.AssignedTo = dto.AssignedTo;

                RecordStatusChange(ticketId, oldStatusId, dto.StatusId, requestingUserId);
                RecordResolvedOrClosed(ticket, oldStatusId, dto.StatusId);
                RecordAssignmentChange(ticketId, oldAssignedTo, dto.AssignedTo, requestingUserId);
            }

            ticket.UpdatedAt = DateTime.UtcNow;
            _dbContext.ActivityLogs.Add(ActivityLogEntry(requestingUserId, "TicketUpdated", "Ticket", ticketId));

            await _dbContext.SaveChangesAsync();
            return _mapper.Map<TicketResponseDto>(ticket);
        }

        public async Task<bool> DeleteTicketAsync(Guid ticketId)
        {
            var ticket = await _dbContext.Tickets.FindAsync(ticketId);

            if (ticket == null)
            {
                return false;
            }

            _dbContext.Tickets.Remove(ticket);
            _dbContext.ActivityLogs.Add(ActivityLogEntry(ticket.CreatedBy, "TicketDeleted", "Ticket", ticketId));
            await _dbContext.SaveChangesAsync();

            return true;
        }

        public async Task<AssignTicketResponse?> AssignTicketAsync(Guid ticketId, Guid assignedToUserId, Guid assignedByUserId)
        {
            var ticket = await IncludeNavigations(_dbContext.Tickets)
                .FirstOrDefaultAsync(t => t.Id == ticketId);

            if (ticket == null)
            {
                return null;
            }

            var assignedToUser = await _dbContext.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == assignedToUserId);

            if (assignedToUser == null || !assignedToUser.IsActive)
            {
                throw new InvalidOperationException("Assigned user not found or is inactive.");
            }

            if (assignedToUser.Role.Name != "Agent")
            {
                throw new InvalidOperationException("Assigned user must have the Agent role.");
            }

            ticket.AssignedTo = assignedToUserId;
            ticket.UpdatedAt = DateTime.UtcNow;

            _dbContext.TicketAssignmentHistories.Add(new TicketAssignmentHistory
            {
                Id = Guid.NewGuid(),
                TicketId = ticketId,
                AssignedBy = assignedByUserId,
                AssignedTo = assignedToUserId,
                AssignedAt = DateTime.UtcNow
            });

            _dbContext.ActivityLogs.Add(ActivityLogEntry(assignedByUserId, "TICKET_ASSIGNED", "Ticket", ticketId));

            await _dbContext.SaveChangesAsync();

            await _notificationService.CreateNotificationAsync(assignedToUserId, ticketId,
                $"You have been assigned ticket {ticket.ReferenceNumber}: {ticket.Title}");

            await _emailService.SendTicketAssignedEmailAsync(
                assignedToUser.Email,
                assignedToUser.FullName,
                ticket.ReferenceNumber,
                ticket.Title,
                GetTicketUrl(ticketId));

            return new AssignTicketResponse
            {
                TicketId = ticketId,
                AssignedTo = assignedToUserId,
                AssignedAt = DateTime.UtcNow
            };
        }

        public async Task<bool> UnassignTicketAsync(Guid ticketId, Guid performedByUserId)
        {
            var ticket = await _dbContext.Tickets.FirstOrDefaultAsync(t => t.Id == ticketId);

            if (ticket == null)
            {
                return false;
            }

            ticket.AssignedTo = null;
            ticket.UpdatedAt = DateTime.UtcNow;

            _dbContext.ActivityLogs.Add(ActivityLogEntry(performedByUserId, "TICKET_UNASSIGNED", "Ticket", ticketId));

            await _dbContext.SaveChangesAsync();

            return true;
        }

        private static readonly Dictionary<int, HashSet<int>> AllowedTransitions = new()
        {
            { 1, new HashSet<int> { 2, 5 } },   // Open → In Progress, Cancelled
            { 2, new HashSet<int> { 6, 3 } },   // In Progress → Pending, Resolved
            { 6, new HashSet<int> { 2, 3 } },   // Pending → In Progress, Resolved
            { 3, new HashSet<int> { 4, 2 } },   // Resolved → Closed, In Progress
            { 4, new HashSet<int>() },           // Closed → (none)
            { 5, new HashSet<int>() },           // Cancelled → (none)
        };

        public async Task<TicketStatusResponse?> UpdateTicketStatusAsync(Guid ticketId, int newStatusId, Guid changedByUserId, string? notes)
        {
            var ticket = await _dbContext.Tickets.FirstOrDefaultAsync(t => t.Id == ticketId);

            if (ticket == null)
            {
                return null;
            }

            var oldStatusId = ticket.StatusId;

            if (newStatusId == oldStatusId)
            {
                throw new InvalidOperationException("Ticket is already in this status.");
            }

            if (!AllowedTransitions.TryGetValue(oldStatusId, out var allowed) || !allowed.Contains(newStatusId))
            {
                var oldStatusName = (await _dbContext.Statuses.FindAsync(oldStatusId))?.Name ?? oldStatusId.ToString();
                var newStatusName = (await _dbContext.Statuses.FindAsync(newStatusId))?.Name ?? newStatusId.ToString();
                throw new InvalidOperationException($"Transition from '{oldStatusName}' to '{newStatusName}' is not allowed.");
            }

            ticket.StatusId = newStatusId;
            ticket.UpdatedAt = DateTime.UtcNow;

            _dbContext.TicketStatusHistories.Add(new TicketStatusHistory
            {
                Id = Guid.NewGuid(),
                TicketId = ticketId,
                ChangedBy = changedByUserId,
                OldStatusId = oldStatusId,
                NewStatusId = newStatusId,
                ChangedAt = DateTime.UtcNow,
                Notes = notes ?? string.Empty
            });

            RecordResolvedOrClosed(ticket, oldStatusId, newStatusId);

            _dbContext.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = changedByUserId,
                Action = "STATUS_CHANGED",
                EntityType = "Ticket",
                EntityId = ticketId,
                Metadata = $"{{\"from\":{oldStatusId},\"to\":{newStatusId}}}",
                PerformedAt = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync();

            var newStatus = await _dbContext.Statuses.FindAsync(newStatusId);

            await _notificationService.CreateNotificationAsync(ticket.CreatedBy, ticketId,
                $"Your ticket {ticket.ReferenceNumber} status changed to {newStatus?.Name ?? "Unknown"}");

            var creator = await _dbContext.Users.FindAsync(ticket.CreatedBy);
            if (creator != null)
            {
                await _emailService.SendTicketStatusChangedEmailAsync(
                    creator.Email,
                    creator.FullName,
                    ticket.ReferenceNumber,
                    ticket.Title,
                    newStatus?.Name ?? "Unknown",
                    GetTicketUrl(ticketId));
            }

            return new TicketStatusResponse
            {
                TicketId = ticketId,
                OldStatusId = oldStatusId,
                NewStatusId = newStatusId,
                NewStatusName = newStatus?.Name ?? string.Empty,
                ChangedAt = DateTime.UtcNow
            };
        }

        public async Task<List<StatusHistoryEntry>> GetStatusHistoryAsync(Guid ticketId)
        {
            return await _dbContext.TicketStatusHistories
                .Include(h => h.ChangedByUser)
                .Include(h => h.OldStatus)
                .Include(h => h.NewStatus)
                .Where(h => h.TicketId == ticketId)
                .OrderBy(h => h.ChangedAt)
                .Select(h => new StatusHistoryEntry
                {
                    Id = h.Id,
                    TicketId = h.TicketId,
                    ChangedBy = h.ChangedBy,
                    ChangedByName = h.ChangedByUser.FullName,
                    OldStatusId = h.OldStatusId,
                    OldStatusName = h.OldStatus.Name,
                    NewStatusId = h.NewStatusId,
                    NewStatusName = h.NewStatus.Name,
                    ChangedAt = h.ChangedAt,
                    Notes = h.Notes
                })
                .ToListAsync();
        }

        public async Task<List<AssignmentHistoryEntry>> GetAssignmentHistoryAsync(Guid ticketId)
        {
            return await _dbContext.TicketAssignmentHistories
                .Include(h => h.AssignedByUser)
                .Include(h => h.AssignedToUser)
                .Where(h => h.TicketId == ticketId)
                .OrderBy(h => h.AssignedAt)
                .Select(h => new AssignmentHistoryEntry
                {
                    Id = h.Id,
                    TicketId = h.TicketId,
                    AssignedBy = h.AssignedBy,
                    AssignedByName = h.AssignedByUser.FullName,
                    AssignedTo = h.AssignedTo,
                    AssignedToName = h.AssignedToUser != null ? h.AssignedToUser.FullName : null,
                    AssignedAt = h.AssignedAt
                })
                .ToListAsync();
        }

        public async Task<List<ActivityLogEntryDto>> GetTicketActivityLogsAsync(Guid ticketId)
        {
            return await _dbContext.ActivityLogs
                .Include(l => l.User)
                .Where(l => l.EntityType == "Ticket" && l.EntityId == ticketId)
                .OrderByDescending(l => l.PerformedAt)
                .Select(l => new ActivityLogEntryDto
                {
                    Id = l.Id,
                    UserId = l.UserId,
                    UserName = l.User.FullName,
                    Action = l.Action,
                    EntityType = l.EntityType,
                    EntityId = l.EntityId,
                    Metadata = l.Metadata,
                    PerformedAt = l.PerformedAt
                })
                .ToListAsync();
        }

        public async Task<PagedResult<ActivityLogEntryDto>> GetActivityLogsAsync(Guid? userId, string? entityType, DateTime? from, DateTime? to, int page, int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 50;
            if (pageSize > 200) pageSize = 200;

            var query = _dbContext.ActivityLogs
                .Include(l => l.User)
                .AsQueryable();

            if (userId.HasValue)
            {
                query = query.Where(l => l.UserId == userId.Value);
            }

            if (!string.IsNullOrEmpty(entityType))
            {
                query = query.Where(l => l.EntityType == entityType);
            }

            if (from.HasValue)
            {
                query = query.Where(l => l.PerformedAt >= from.Value);
            }

            if (to.HasValue)
            {
                query = query.Where(l => l.PerformedAt <= to.Value);
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(l => l.PerformedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new ActivityLogEntryDto
                {
                    Id = l.Id,
                    UserId = l.UserId,
                    UserName = l.User.FullName,
                    Action = l.Action,
                    EntityType = l.EntityType,
                    EntityId = l.EntityId,
                    Metadata = l.Metadata,
                    PerformedAt = l.PerformedAt
                })
                .ToListAsync();

            return new PagedResult<ActivityLogEntryDto>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }

        public async Task<List<CategoryDto>> GetCategoriesAsync()
        {
            return await _dbContext.Categories
                .OrderBy(c => c.Name)
                .Select(c => new CategoryDto { Id = c.Id, Name = c.Name, Description = c.Description })
                .ToListAsync();
        }

        public async Task<CategoryDto> CreateCategoryAsync(string name, string? description)
        {
            var category = new Category { Name = name, Description = description ?? string.Empty };
            _dbContext.Categories.Add(category);
            await _dbContext.SaveChangesAsync();
            return new CategoryDto { Id = category.Id, Name = category.Name, Description = category.Description };
        }

        public async Task<CategoryDto?> UpdateCategoryAsync(int id, string name, string? description)
        {
            var category = await _dbContext.Categories.FindAsync(id);
            if (category == null) return null;
            category.Name = name;
            category.Description = description ?? string.Empty;
            await _dbContext.SaveChangesAsync();
            return new CategoryDto { Id = category.Id, Name = category.Name, Description = category.Description };
        }

        public async Task<bool> DeleteCategoryAsync(int id)
        {
            var category = await _dbContext.Categories.FindAsync(id);
            if (category == null) return false;
            var inUse = await _dbContext.Tickets.AnyAsync(t => t.CategoryId == id);
            if (inUse) throw new InvalidOperationException("Cannot delete category that is in use by tickets.");
            _dbContext.Categories.Remove(category);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<List<PriorityDto>> GetPrioritiesAsync()
        {
            return await _dbContext.Priorities
                .OrderBy(p => p.Level)
                .Select(p => new PriorityDto { Id = p.Id, Name = p.Name, Level = p.Level })
                .ToListAsync();
        }

        public async Task<PriorityDto> CreatePriorityAsync(string name, int level)
        {
            var priority = new Priority { Name = name, Level = level };
            _dbContext.Priorities.Add(priority);
            await _dbContext.SaveChangesAsync();
            return new PriorityDto { Id = priority.Id, Name = priority.Name, Level = priority.Level };
        }

        public async Task<PriorityDto?> UpdatePriorityAsync(int id, string name, int level)
        {
            var priority = await _dbContext.Priorities.FindAsync(id);
            if (priority == null) return null;
            priority.Name = name;
            priority.Level = level;
            await _dbContext.SaveChangesAsync();
            return new PriorityDto { Id = priority.Id, Name = priority.Name, Level = priority.Level };
        }

        public async Task<bool> DeletePriorityAsync(int id)
        {
            var priority = await _dbContext.Priorities.FindAsync(id);
            if (priority == null) return false;
            var inUse = await _dbContext.Tickets.AnyAsync(t => t.PriorityId == id);
            if (inUse) throw new InvalidOperationException("Cannot delete priority that is in use by tickets.");
            _dbContext.Priorities.Remove(priority);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<List<StatusDto>> GetStatusesAsync()
        {
            return await _dbContext.Statuses
                .OrderBy(s => s.Id)
                .Select(s => new StatusDto { Id = s.Id, Name = s.Name })
                .ToListAsync();
        }

        public async Task<StatusDto> CreateStatusAsync(string name)
        {
            var status = new Status { Name = name };
            _dbContext.Statuses.Add(status);
            await _dbContext.SaveChangesAsync();
            return new StatusDto { Id = status.Id, Name = status.Name };
        }

        public async Task<StatusDto?> UpdateStatusAsync(int id, string name)
        {
            var status = await _dbContext.Statuses.FindAsync(id);
            if (status == null) return null;
            status.Name = name;
            await _dbContext.SaveChangesAsync();
            return new StatusDto { Id = status.Id, Name = status.Name };
        }

        public async Task<bool> DeleteStatusAsync(int id)
        {
            var status = await _dbContext.Statuses.FindAsync(id);
            if (status == null) return false;
            var inUse = await _dbContext.Tickets.AnyAsync(t => t.StatusId == id);
            if (inUse) throw new InvalidOperationException("Cannot delete status that is in use by tickets.");
            _dbContext.Statuses.Remove(status);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        private static IQueryable<Ticket> IncludeNavigations(IQueryable<Ticket> query)
        {
            return query
                .Include(t => t.Category)
                .Include(t => t.Priority)
                .Include(t => t.Status)
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedToUser);
        }

        private static ActivityLog ActivityLogEntry(Guid userId, string action, string entityType, Guid? entityId)
        {
            return new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Metadata = "{}",
                PerformedAt = DateTime.UtcNow
            };
        }

        private static void ApplyBasicFields(Ticket ticket, TicketUpdateDto dto)
        {
            ticket.Title = dto.Title;
            ticket.Description = dto.Description;
            ticket.CategoryId = dto.CategoryId;
            ticket.PriorityId = dto.PriorityId;
        }

        private static void ValidateEmployeeUpdate(Ticket ticket, Guid requestingUserId)
        {
            if (ticket.CreatedBy != requestingUserId)
            {
                throw new UnauthorizedAccessException("You can only update your own tickets.");
            }
        }

        private void RecordStatusChange(Guid ticketId, int oldStatusId, int newStatusId, Guid changedBy)
        {
            if (newStatusId == oldStatusId) return;

            _dbContext.TicketStatusHistories.Add(new TicketStatusHistory
            {
                Id = Guid.NewGuid(),
                TicketId = ticketId,
                ChangedBy = changedBy,
                OldStatusId = oldStatusId,
                NewStatusId = newStatusId,
                ChangedAt = DateTime.UtcNow,
                Notes = string.Empty
            });
        }

        private void RecordResolvedOrClosed(Ticket ticket, int oldStatusId, int newStatusId)
        {
            if (newStatusId == oldStatusId) return;

            var resolvedStatus = _dbContext.Statuses.Local.FirstOrDefault(s => s.Name == "Resolved")
                ?? _dbContext.Statuses.FirstOrDefault(s => s.Name == "Resolved");
            if (resolvedStatus != null && newStatusId == resolvedStatus.Id)
            {
                ticket.ResolvedAt = DateTime.UtcNow;
            }

            var closedStatus = _dbContext.Statuses.Local.FirstOrDefault(s => s.Name == "Closed")
                ?? _dbContext.Statuses.FirstOrDefault(s => s.Name == "Closed");
            if (closedStatus != null && newStatusId == closedStatus.Id)
            {
                ticket.ClosedAt = DateTime.UtcNow;
            }
        }

        private void RecordAssignmentChange(Guid ticketId, Guid? oldAssignedTo, Guid? newAssignedTo, Guid assignedBy)
        {
            if (newAssignedTo == oldAssignedTo) return;

            _dbContext.TicketAssignmentHistories.Add(new TicketAssignmentHistory
            {
                Id = Guid.NewGuid(),
                TicketId = ticketId,
                AssignedBy = assignedBy,
                AssignedTo = newAssignedTo,
                AssignedAt = DateTime.UtcNow
            });
        }

        private async Task<string> GenerateUniqueReferenceNumberAsync()
        {
            var maxAttempts = 10;
            for (var attempt = 0; attempt < maxAttempts; attempt++)
            {
                var refNumber = "TKT-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-" + RandomNumberGenerator.GetInt32(1000, 10000);
                var exists = await _dbContext.Tickets.AnyAsync(t => t.ReferenceNumber == refNumber);
                if (!exists)
                {
                    return refNumber;
                }
            }

            throw new InvalidOperationException("Unable to generate a unique reference number. Please try again.");
        }

        private string GetTicketUrl(Guid ticketId)
        {
            var request = _httpContextAccessor.HttpContext?.Request;
            if (request == null) return "#";

            var baseUrl = $"{request.Scheme}://{request.Host}";
            return $"{baseUrl}/tickets/{ticketId}";
        }
    }
}
