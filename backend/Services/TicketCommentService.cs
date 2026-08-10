using AutoMapper;
using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using HelpdeskApi.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Services
{
    public class TicketCommentService : ITicketCommentService
    {
        private readonly AppDbContext _dbContext;
        private readonly IMapper _mapper;
        private readonly INotificationService _notificationService;
        private readonly IEmailService _emailService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public TicketCommentService(AppDbContext dbContext, IMapper mapper, INotificationService notificationService, IEmailService emailService, IHttpContextAccessor httpContextAccessor)
        {
            _dbContext = dbContext;
            _mapper = mapper;
            _notificationService = notificationService;
            _emailService = emailService;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<CommentResponse>?> GetCommentsAsync(Guid ticketId, Guid requestingUserId, string requestingUserRole)
        {
            var ticket = await _dbContext.Tickets
                .Where(t => t.Id == ticketId)
                .Select(t => new { t.CreatedBy })
                .FirstOrDefaultAsync();
            if (ticket == null)
            {
                return null;
            }

            if (requestingUserRole == "Employee" && ticket.CreatedBy != requestingUserId)
            {
                throw new UnauthorizedAccessException("You can only view comments on your own tickets.");
            }

            var query = _dbContext.TicketComments
                .Include(c => c.Author)
                .Where(c => c.TicketId == ticketId);

            if (requestingUserRole == "Employee")
            {
                query = query.Where(c => !c.IsInternal);
            }

            var comments = await query
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();

            return _mapper.Map<List<CommentResponse>>(comments);
        }

        public async Task<CommentResponse> AddCommentAsync(Guid ticketId, Guid authorId, string body, bool isInternal, string requestingUserRole)
        {
            var ticket = await _dbContext.Tickets
                .Where(t => t.Id == ticketId)
                .Select(t => new { t.ReferenceNumber, t.CreatedBy, t.AssignedTo })
                .FirstOrDefaultAsync();
            if (ticket == null)
            {
                throw new InvalidOperationException("Ticket not found.");
            }

            if (requestingUserRole is "Employee" or "Manager" && ticket.CreatedBy != authorId)
            {
                throw new UnauthorizedAccessException("You can only comment on tickets you created.");
            }

            if (isInternal && requestingUserRole != "Admin" && requestingUserRole != "Agent")
            {
                throw new UnauthorizedAccessException("Only Admins and Agents can add internal comments.");
            }

            var comment = new TicketComment
            {
                Id = Guid.NewGuid(),
                TicketId = ticketId,
                AuthorId = authorId,
                Body = body,
                IsInternal = isInternal,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.TicketComments.Add(comment);

            _dbContext.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = authorId,
                Action = "COMMENT_ADDED",
                EntityType = "Ticket",
                EntityId = ticketId,
                Metadata = $"{{\"isInternal\":{isInternal.ToString().ToLower()}}}",
                PerformedAt = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync();

            var author = await _dbContext.Users.FindAsync(authorId);

            // Parse @mentions and notify mentioned users
            var mentionedNames = System.Text.RegularExpressions.Regex.Matches(body, @"@(\w+)")
                .Select(m => m.Groups[1].Value)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (mentionedNames.Count > 0)
            {
                var agentRoleId = await _dbContext.Roles
                    .Where(r => r.Name == "Agent")
                    .Select(r => r.Id)
                    .FirstOrDefaultAsync();

                var mentionedUsers = await _dbContext.Users
                    .Where(u => mentionedNames.Contains(u.FullName) && u.IsActive)
                    .ToListAsync();

                foreach (var mentionedUser in mentionedUsers)
                {
                    if (mentionedUser.Id == authorId) continue;

                    await _notificationService.CreateNotificationAsync(mentionedUser.Id, ticketId,
                        $"You were mentioned by {author?.FullName ?? "Someone"} on ticket {ticket.ReferenceNumber}");
                }
            }

            // Notify ticket assignee (skip the comment author)
            if (ticket.AssignedTo.HasValue && ticket.AssignedTo.Value != authorId)
            {
                await _notificationService.CreateNotificationAsync(ticket.AssignedTo.Value, ticketId,
                    $"New comment on ticket {ticket.ReferenceNumber}");
                var assignee = await _dbContext.Users.FindAsync(ticket.AssignedTo.Value);
                if (assignee != null)
                {
                    await _emailService.SendNewCommentEmailAsync(
                        assignee.Email, assignee.FullName,
                        ticket.ReferenceNumber, string.Empty,
                        author?.FullName ?? "Someone",
                        GetTicketUrl(ticketId));
                }
            }

            // Notify ticket creator (skip the comment author, and skip if already notified as assignee)
            if (ticket.CreatedBy != authorId && (!ticket.AssignedTo.HasValue || ticket.AssignedTo.Value != ticket.CreatedBy))
            {
                await _notificationService.CreateNotificationAsync(ticket.CreatedBy, ticketId,
                    $"New comment on ticket {ticket.ReferenceNumber}");
                var creator = await _dbContext.Users.FindAsync(ticket.CreatedBy);
                if (creator != null)
                {
                    await _emailService.SendNewCommentEmailAsync(
                        creator.Email, creator.FullName,
                        ticket.ReferenceNumber, string.Empty,
                        author?.FullName ?? "Someone",
                        GetTicketUrl(ticketId));
                }
            }

            // Reload with Author navigation for mapping
            var savedComment = await _dbContext.TicketComments
                .Include(c => c.Author)
                .FirstAsync(c => c.Id == comment.Id);

            return _mapper.Map<CommentResponse>(savedComment);
        }

        public async Task<bool> DeleteCommentAsync(Guid ticketId, Guid commentId, Guid requestingUserId, string requestingUserRole)
        {
            var comment = await _dbContext.TicketComments
                .Include(c => c.Ticket)
                .FirstOrDefaultAsync(c => c.Id == commentId && c.TicketId == ticketId);

            if (comment == null)
            {
                return false;
            }

            if (comment.AuthorId != requestingUserId && requestingUserRole != "Admin")
            {
                throw new UnauthorizedAccessException("Only the comment author or an Admin can delete this comment.");
            }

            if (requestingUserRole == "Employee" && comment.Ticket.CreatedBy != requestingUserId)
            {
                throw new UnauthorizedAccessException("You can only access comments on your own tickets.");
            }

            _dbContext.TicketComments.Remove(comment);
            await _dbContext.SaveChangesAsync();

            return true;
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
