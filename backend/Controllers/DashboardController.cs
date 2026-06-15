using HelpdeskApi.DTOs;
using HelpdeskApi.Helpers;
using HelpdeskApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;
        private readonly JwtHelper _jwtHelper;

        public DashboardController(IDashboardService dashboardService, JwtHelper jwtHelper)
        {
            _dashboardService = dashboardService;
            _jwtHelper = jwtHelper;
        }

        [HttpGet("stats")]
        [Authorize]
        public async Task<IActionResult> GetStats()
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
                return Unauthorized();

            var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
            var stats = await _dashboardService.GetStatsAsync(userId.Value, role);
            return Ok(stats);
        }

        [HttpGet("tickets-by-category")]
        [Authorize(Roles = "Admin,Manager,Agent")]
        public async Task<IActionResult> GetTicketsByCategory()
        {
            var data = await _dashboardService.GetTicketsByCategoryAsync();
            return Ok(data);
        }

        [HttpGet("tickets-by-priority")]
        [Authorize(Roles = "Admin,Manager,Agent")]
        public async Task<IActionResult> GetTicketsByPriority()
        {
            var data = await _dashboardService.GetTicketsByPriorityAsync();
            return Ok(data);
        }

        [HttpGet("tickets-by-status")]
        [Authorize(Roles = "Admin,Manager,Agent")]
        public async Task<IActionResult> GetTicketsByStatus()
        {
            var data = await _dashboardService.GetTicketsByStatusAsync();
            return Ok(data);
        }

        [HttpGet("tickets-over-time")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetTicketsOverTime([FromQuery] int days = 30)
        {
            if (days < 1) days = 1;
            if (days > 365) days = 365;

            var data = await _dashboardService.GetTicketsOverTimeAsync(days);
            return Ok(data);
        }

        [HttpGet("agent-performance")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetAgentPerformance()
        {
            var data = await _dashboardService.GetAgentPerformanceAsync();
            return Ok(data);
        }
    }
}
