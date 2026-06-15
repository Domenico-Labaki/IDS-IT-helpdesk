using HelpdeskApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ITicketService _ticketService;

        public AdminController(ITicketService ticketService)
        {
            _ticketService = ticketService;
        }

        [HttpGet("activity-logs")]
        public async Task<IActionResult> GetActivityLogs(
            [FromQuery] Guid? userId,
            [FromQuery] string? entityType,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var result = await _ticketService.GetActivityLogsAsync(userId, entityType, from, to, page, pageSize);
            return Ok(result);
        }
    }
}
