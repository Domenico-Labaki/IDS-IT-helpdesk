using HelpdeskApi.DTOs;
using HelpdeskApi.Helpers;
using HelpdeskApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/tickets")]
    public class TicketsController : ControllerBase
    {
        private readonly ITicketService _ticketService;
        private readonly JwtHelper _jwtHelper;

        public TicketsController(ITicketService ticketService, JwtHelper jwtHelper)
        {
            _ticketService = ticketService;
            _jwtHelper = jwtHelper;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
            var tickets = await _ticketService.GetAllTicketsAsync(userId.Value, role, page, pageSize);
            return Ok(tickets);
        }

        [HttpGet("{id:guid}")]
        [Authorize]
        public async Task<IActionResult> GetById(Guid id)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

            try
            {
                var ticket = await _ticketService.GetTicketByIdAsync(id, userId.Value, role);
                return ticket == null ? NotFound() : Ok(ticket);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] TicketCreateDto dto)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var ticket = await _ticketService.CreateTicketAsync(dto, userId.Value);
            return CreatedAtAction(nameof(GetById), new { id = ticket.Id }, ticket);
        }

        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<IActionResult> Update(Guid id, [FromBody] TicketUpdateDto dto)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

            try
            {
                var ticket = await _ticketService.UpdateTicketAsync(id, dto, userId.Value, role);
                return ticket == null ? NotFound() : Ok(ticket);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _ticketService.DeleteTicketAsync(id);
            return deleted ? NoContent() : NotFound();
        }

        [HttpPut("{id:guid}/status")]
        [Authorize(Roles = "Admin,Agent")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest dto)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            try
            {
                var result = await _ticketService.UpdateTicketStatusAsync(id, dto.StatusId, userId.Value, dto.Notes);
                return result == null ? NotFound() : Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id:guid}/status-history")]
        [Authorize(Roles = "Admin,Agent,Manager")]
        public async Task<IActionResult> GetStatusHistory(Guid id)
        {
            var history = await _ticketService.GetStatusHistoryAsync(id);
            return Ok(history);
        }

        [HttpGet("{id:guid}/assignment-history")]
        [Authorize(Roles = "Admin,Agent,Manager")]
        public async Task<IActionResult> GetAssignmentHistory(Guid id)
        {
            var history = await _ticketService.GetAssignmentHistoryAsync(id);
            return Ok(history);
        }

        [HttpGet("{id:guid}/activity")]
        [Authorize(Roles = "Admin,Agent,Manager")]
        public async Task<IActionResult> GetActivity(Guid id)
        {
            var logs = await _ticketService.GetTicketActivityLogsAsync(id);
            return Ok(logs);
        }

        [HttpPut("{id:guid}/assign")]
        [Authorize(Roles = "Admin,Agent")]
        public async Task<IActionResult> Assign(Guid id, [FromBody] AssignTicketRequest dto)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            try
            {
                var result = await _ticketService.AssignTicketAsync(id, dto.AssignedToUserId, userId.Value);
                return result == null ? NotFound() : Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id:guid}/assign")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Unassign(Guid id)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var unassigned = await _ticketService.UnassignTicketAsync(id, userId.Value);
            return unassigned ? NoContent() : NotFound();
        }
    }
}
