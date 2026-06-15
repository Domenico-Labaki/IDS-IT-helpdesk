using HelpdeskApi.DTOs;
using HelpdeskApi.Helpers;
using HelpdeskApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/tickets/{ticketId:guid}/comments")]
    public class TicketCommentsController : ControllerBase
    {
        private readonly ITicketCommentService _ticketCommentService;
        private readonly JwtHelper _jwtHelper;

        public TicketCommentsController(ITicketCommentService ticketCommentService, JwtHelper jwtHelper)
        {
            _ticketCommentService = ticketCommentService;
            _jwtHelper = jwtHelper;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll(Guid ticketId)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
            var comments = await _ticketCommentService.GetCommentsAsync(ticketId, userId.Value, role);

            return comments == null ? NotFound() : Ok(comments);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create(Guid ticketId, [FromBody] AddCommentRequest dto)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

            try
            {
                var comment = await _ticketCommentService.AddCommentAsync(ticketId, userId.Value, dto.Body, dto.IsInternal, role);
                return CreatedAtAction(nameof(GetAll), new { ticketId }, comment);
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

        [HttpDelete("{commentId:guid}")]
        [Authorize]
        public async Task<IActionResult> Delete(Guid ticketId, Guid commentId)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

            try
            {
                var deleted = await _ticketCommentService.DeleteCommentAsync(commentId, userId.Value, role);
                return deleted ? NoContent() : NotFound();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }
    }
}
