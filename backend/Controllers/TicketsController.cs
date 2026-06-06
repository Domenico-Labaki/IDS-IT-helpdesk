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
        public async Task<IActionResult> GetAll()
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
            var tickets = await _ticketService.GetAllTicketsAsync(userId.Value, role);
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
    }
}
