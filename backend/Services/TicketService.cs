using System.Security.Cryptography;
using AutoMapper;
using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using HelpdeskApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Services
{
    public class TicketService : ITicketService
    {
        private readonly AppDbContext _dbContext;
        private readonly IMapper _mapper;

        public TicketService(AppDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<TicketResponseDto>> GetAllTicketsAsync(Guid requestingUserId, string role, int page = 1, int pageSize = 50)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 50;
            if (pageSize > 200) pageSize = 200;

            var query = IncludeNavigations(_dbContext.Tickets);

            if (role == "Employee")
            {
                query = query.Where(t => t.CreatedBy == requestingUserId);
            }

            var tickets = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return _mapper.Map<List<TicketResponseDto>>(tickets);
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
                Status = openStatus,
                Category = category,
                Priority = priority,
                CreatedByUser = createdByUser
            };

            _dbContext.Tickets.Add(ticket);
            _dbContext.ActivityLogs.Add(ActivityLogEntry(createdByUserId, "TicketCreated", "Ticket", ticket.Id));

            await _dbContext.SaveChangesAsync();

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

        public async Task<List<CategoryDto>> GetCategoriesAsync()
        {
            return await _dbContext.Categories
                .OrderBy(c => c.Name)
                .Select(c => new CategoryDto { Id = c.Id, Name = c.Name, Description = c.Description })
                .ToListAsync();
        }

        public async Task<List<PriorityDto>> GetPrioritiesAsync()
        {
            return await _dbContext.Priorities
                .OrderBy(p => p.Level)
                .Select(p => new PriorityDto { Id = p.Id, Name = p.Name, Level = p.Level })
                .ToListAsync();
        }

        public async Task<List<StatusDto>> GetStatusesAsync()
        {
            return await _dbContext.Statuses
                .OrderBy(s => s.Id)
                .Select(s => new StatusDto { Id = s.Id, Name = s.Name })
                .ToListAsync();
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
    }
}
