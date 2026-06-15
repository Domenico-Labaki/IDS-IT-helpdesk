using AutoMapper;
using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using HelpdeskApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Services
{
    public class TicketCommentService : ITicketCommentService
    {
        private readonly AppDbContext _dbContext;
        private readonly IMapper _mapper;

        public TicketCommentService(AppDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<CommentResponse>?> GetCommentsAsync(Guid ticketId, Guid requestingUserId, string requestingUserRole)
        {
            var ticketExists = await _dbContext.Tickets.AnyAsync(t => t.Id == ticketId);
            if (!ticketExists)
            {
                return null;
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
            var ticketExists = await _dbContext.Tickets.AnyAsync(t => t.Id == ticketId);
            if (!ticketExists)
            {
                throw new InvalidOperationException("Ticket not found.");
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

            // Reload with Author navigation for mapping
            var savedComment = await _dbContext.TicketComments
                .Include(c => c.Author)
                .FirstAsync(c => c.Id == comment.Id);

            return _mapper.Map<CommentResponse>(savedComment);
        }

        public async Task<bool> DeleteCommentAsync(Guid commentId, Guid requestingUserId, string requestingUserRole)
        {
            var comment = await _dbContext.TicketComments.FindAsync(commentId);

            if (comment == null)
            {
                return false;
            }

            if (comment.AuthorId != requestingUserId && requestingUserRole != "Admin")
            {
                throw new UnauthorizedAccessException("Only the comment author or an Admin can delete this comment.");
            }

            _dbContext.TicketComments.Remove(comment);
            await _dbContext.SaveChangesAsync();

            return true;
        }
    }
}
