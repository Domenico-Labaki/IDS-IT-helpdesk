using HelpdeskApi.DTOs;

namespace HelpdeskApi.Services
{
    public interface INotificationService
    {
        Task<List<NotificationDto>> GetNotificationsAsync(Guid userId, bool unreadOnly = false);
        Task MarkAsReadAsync(Guid notificationId, Guid userId);
        Task MarkAllAsReadAsync(Guid userId);
        Task CreateNotificationAsync(Guid userId, Guid? ticketId, string message);
        Task<int> GetUnreadCountAsync(Guid userId);
    }
}
