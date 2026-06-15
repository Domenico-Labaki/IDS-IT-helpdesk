using HelpdeskApi.DTOs;
using HelpdeskApi.Helpers;
using HelpdeskApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly JwtHelper _jwtHelper;

        public NotificationsController(INotificationService notificationService, JwtHelper jwtHelper)
        {
            _notificationService = notificationService;
            _jwtHelper = jwtHelper;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetNotifications([FromQuery] bool unreadOnly = false)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
                return Unauthorized();

            var notifications = await _notificationService.GetNotificationsAsync(userId.Value, unreadOnly);
            return Ok(notifications);
        }

        [HttpPatch("{id:guid}/read")]
        [Authorize]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
                return Unauthorized();

            await _notificationService.MarkAsReadAsync(id, userId.Value);
            return NoContent();
        }

        [HttpPatch("read-all")]
        [Authorize]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
                return Unauthorized();

            await _notificationService.MarkAllAsReadAsync(userId.Value);
            return NoContent();
        }

        [HttpGet("unread-count")]
        [Authorize]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
                return Unauthorized();

            var count = await _notificationService.GetUnreadCountAsync(userId.Value);
            return Ok(new UnreadCountDto { Count = count });
        }
    }
}
