using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using HelpdeskApi.Hubs;
using HelpdeskApi.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _dbContext;
        private readonly IHubContext<NotificationsHub> _hubContext;

        public NotificationService(AppDbContext dbContext, IHubContext<NotificationsHub> hubContext)
        {
            _dbContext = dbContext;
            _hubContext = hubContext;
        }

        public async Task<List<NotificationDto>> GetNotificationsAsync(Guid userId, bool unreadOnly = false)
        {
            var query = _dbContext.Notifications
                .Include(n => n.Ticket)
                .Where(n => n.UserId == userId);

            if (unreadOnly)
            {
                query = query.Where(n => !n.IsRead);
            }

            return await query
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    UserId = n.UserId,
                    TicketId = n.TicketId,
                    TicketReferenceNumber = n.Ticket != null ? n.Ticket.ReferenceNumber : null,
                    TicketTitle = n.Ticket != null ? n.Ticket.Title : null,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                })
                .ToListAsync();
        }

        public async Task MarkAsReadAsync(Guid notificationId, Guid userId)
        {
            var notification = await _dbContext.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification != null)
            {
                notification.IsRead = true;
                await _dbContext.SaveChangesAsync();
            }
        }

        public async Task MarkAllAsReadAsync(Guid userId)
        {
            var unread = await _dbContext.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            if (unread.Count > 0)
            {
                foreach (var n in unread)
                {
                    n.IsRead = true;
                }
                await _dbContext.SaveChangesAsync();
            }
        }

        public async Task CreateNotificationAsync(Guid userId, Guid? ticketId, string message)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                TicketId = ticketId,
                Message = message,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.Notifications.Add(notification);
            await _dbContext.SaveChangesAsync();

            var ticketTitle = ticketId.HasValue
                ? await _dbContext.Tickets.Where(t => t.Id == ticketId.Value).Select(t => t.Title).FirstOrDefaultAsync()
                : null;

            try
            {
                await _hubContext.Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", new
                {
                    notification.Id,
                    notification.UserId,
                    notification.TicketId,
                    ticketTitle,
                    notification.Message,
                    notification.IsRead,
                    notification.CreatedAt
                });

                var unreadCount = await _dbContext.Notifications
                    .CountAsync(n => n.UserId == userId && !n.IsRead);
                await _hubContext.Clients.Group($"user_{userId}").SendAsync("UnreadCount", new { count = unreadCount });
            }
            catch
            {
                // SignalR send is best-effort
            }
        }

        public async Task<int> GetUnreadCountAsync(Guid userId)
        {
            return await _dbContext.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }
    }
}
