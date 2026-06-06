using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using HelpdeskApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Services
{
    public class TicketService : ITicketService
    {
        private readonly AppDbContext _dbContext;

        public TicketService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<TicketResponseDto>> GetAllTicketsAsync(Guid requestingUserId, string role)
        {
            var query = _dbContext.Tickets
                .Include(t => t.Category)
                .Include(t => t.Priority)
                .Include(t => t.Status)
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedToUser)
                .AsQueryable();

            if (role == "Employee")
            {
                query = query.Where(t => t.CreatedBy == requestingUserId);
            }

            var tickets = await query
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return tickets.Select(MapToDto).ToList();
        }

        public async Task<TicketResponseDto?> GetTicketByIdAsync(Guid ticketId, Guid requestingUserId, string role)
        {
            var ticket = await _dbContext.Tickets
                .Include(t => t.Category)
                .Include(t => t.Priority)
                .Include(t => t.Status)
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedToUser)
                .FirstOrDefaultAsync(t => t.Id == ticketId);

            if (ticket == null)
            {
                return null;
            }

            if (role == "Employee" && ticket.CreatedBy != requestingUserId)
            {
                throw new UnauthorizedAccessException("You can only view your own tickets.");
            }

            return MapToDto(ticket);
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
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.Tickets.Add(ticket);
            _dbContext.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = createdByUserId,
                Action = "TicketCreated",
                EntityType = "Ticket",
                EntityId = ticket.Id,
                Metadata = "{}",
                PerformedAt = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync();

            ticket.Status = openStatus;
            ticket.Category = category;
            ticket.Priority = priority;

            var createdByUser = await _dbContext.Users.FindAsync(createdByUserId);
            ticket.CreatedByUser = createdByUser;

            return MapToDto(ticket);
        }

        public async Task<TicketResponseDto?> UpdateTicketAsync(Guid ticketId, TicketUpdateDto dto, Guid requestingUserId, string role)
        {
            var ticket = await _dbContext.Tickets
                .Include(t => t.Category)
                .Include(t => t.Priority)
                .Include(t => t.Status)
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedToUser)
                .FirstOrDefaultAsync(t => t.Id == ticketId);

            if (ticket == null)
            {
                return null;
            }

            if (role == "Employee")
            {
                if (ticket.CreatedBy != requestingUserId)
                {
                    throw new UnauthorizedAccessException("You can only update your own tickets.");
                }

                var openStatus = await _dbContext.Statuses.FirstOrDefaultAsync(s => s.Name == "Open")
                    ?? throw new InvalidOperationException("Open status not found. Ensure seed data is applied.");

                if (ticket.StatusId != openStatus.Id)
                {
                    throw new InvalidOperationException("You can only update tickets with Open status.");
                }

                ticket.Title = dto.Title;
                ticket.Description = dto.Description;
                ticket.CategoryId = dto.CategoryId;
                ticket.PriorityId = dto.PriorityId;
            }
            else
            {
                var oldStatusId = ticket.StatusId;
                var oldAssignedTo = ticket.AssignedTo;

                ticket.Title = dto.Title;
                ticket.Description = dto.Description;
                ticket.CategoryId = dto.CategoryId;
                ticket.PriorityId = dto.PriorityId;
                ticket.StatusId = dto.StatusId;
                ticket.AssignedTo = dto.AssignedTo;

                var resolvedStatus = await _dbContext.Statuses.FirstOrDefaultAsync(s => s.Name == "Resolved");
                if (resolvedStatus != null && dto.StatusId == resolvedStatus.Id && oldStatusId != dto.StatusId)
                {
                    ticket.ResolvedAt = DateTime.UtcNow;
                }

                var closedStatus = await _dbContext.Statuses.FirstOrDefaultAsync(s => s.Name == "Closed");
                if (closedStatus != null && dto.StatusId == closedStatus.Id && oldStatusId != dto.StatusId)
                {
                    ticket.ClosedAt = DateTime.UtcNow;
                }

                if (dto.StatusId != oldStatusId)
                {
                    _dbContext.TicketStatusHistories.Add(new TicketStatusHistory
                    {
                        Id = Guid.NewGuid(),
                        TicketId = ticketId,
                        ChangedBy = requestingUserId,
                        OldStatusId = oldStatusId,
                        NewStatusId = dto.StatusId,
                        ChangedAt = DateTime.UtcNow,
                        Notes = string.Empty
                    });
                }

                if (dto.AssignedTo != oldAssignedTo)
                {
                    _dbContext.TicketAssignmentHistories.Add(new TicketAssignmentHistory
                    {
                        Id = Guid.NewGuid(),
                        TicketId = ticketId,
                        AssignedBy = requestingUserId,
                        AssignedTo = dto.AssignedTo ?? Guid.Empty,
                        AssignedAt = DateTime.UtcNow
                    });
                }


            }

            ticket.UpdatedAt = DateTime.UtcNow;

            _dbContext.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = requestingUserId,
                Action = "TicketUpdated",
                EntityType = "Ticket",
                EntityId = ticketId,
                Metadata = "{}",
                PerformedAt = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync();

            var updated = await _dbContext.Tickets
                .Include(t => t.Category)
                .Include(t => t.Priority)
                .Include(t => t.Status)
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedToUser)
                .FirstAsync(t => t.Id == ticketId);

            return MapToDto(updated);
        }

        public async Task<bool> DeleteTicketAsync(Guid ticketId)
        {
            var ticket = await _dbContext.Tickets.FindAsync(ticketId);

            if (ticket == null)
            {
                return false;
            }

            _dbContext.Tickets.Remove(ticket);

            _dbContext.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = ticket.CreatedBy,
                Action = "TicketDeleted",
                EntityType = "Ticket",
                EntityId = ticketId,
                Metadata = "{}",
                PerformedAt = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync();

            return true;
        }

        public async Task<List<CategoryDto>> GetCategoriesAsync()
        {
            return await _dbContext.Categories
                .OrderBy(c => c.Name)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description
                })
                .ToListAsync();
        }

        public async Task<List<PriorityDto>> GetPrioritiesAsync()
        {
            return await _dbContext.Priorities
                .OrderBy(p => p.Level)
                .Select(p => new PriorityDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Level = p.Level
                })
                .ToListAsync();
        }

        public async Task<List<StatusDto>> GetStatusesAsync()
        {
            return await _dbContext.Statuses
                .OrderBy(s => s.Id)
                .Select(s => new StatusDto
                {
                    Id = s.Id,
                    Name = s.Name
                })
                .ToListAsync();
        }

        private async Task<string> GenerateUniqueReferenceNumberAsync()
        {
            var maxAttempts = 10;
            for (var attempt = 0; attempt < maxAttempts; attempt++)
            {
                var refNumber = "TKT-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-" + Random.Shared.Next(1000, 10000);
                var exists = await _dbContext.Tickets.AnyAsync(t => t.ReferenceNumber == refNumber);
                if (!exists)
                {
                    return refNumber;
                }
            }

            throw new InvalidOperationException("Unable to generate a unique reference number. Please try again.");
        }

        private static TicketResponseDto MapToDto(Ticket ticket)
        {
            return new TicketResponseDto
            {
                Id = ticket.Id,
                ReferenceNumber = ticket.ReferenceNumber,
                Title = ticket.Title,
                Description = ticket.Description,
                CategoryId = ticket.CategoryId,
                CategoryName = ticket.Category?.Name ?? string.Empty,
                PriorityId = ticket.PriorityId,
                PriorityName = ticket.Priority?.Name ?? string.Empty,
                StatusId = ticket.StatusId,
                StatusName = ticket.Status?.Name ?? string.Empty,
                CreatedBy = ticket.CreatedBy,
                CreatedByName = ticket.CreatedByUser?.FullName ?? string.Empty,
                AssignedTo = ticket.AssignedTo,
                AssignedToName = ticket.AssignedToUser?.FullName,
                ResolvedAt = ticket.ResolvedAt,
                ClosedAt = ticket.ClosedAt,
                CreatedAt = ticket.CreatedAt,
                UpdatedAt = ticket.UpdatedAt
            };
        }
    }
}
