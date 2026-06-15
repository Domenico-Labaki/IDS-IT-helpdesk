using HelpdeskApi.DTOs;
using HelpdeskApi.Helpers;
using HelpdeskApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/tickets/{ticketId:guid}/attachments")]
    public class TicketAttachmentsController : ControllerBase
    {
        private readonly IAttachmentService _attachmentService;
        private readonly JwtHelper _jwtHelper;

        public TicketAttachmentsController(IAttachmentService attachmentService, JwtHelper jwtHelper)
        {
            _attachmentService = attachmentService;
            _jwtHelper = jwtHelper;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll(Guid ticketId)
        {
            var attachments = await _attachmentService.GetAttachmentsAsync(ticketId);
            return Ok(attachments);
        }

        [HttpPost]
        [Authorize]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> Upload(Guid ticketId, IFormFile file)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            try
            {
                var attachment = await _attachmentService.UploadAttachmentAsync(ticketId, userId.Value, file);
                return CreatedAtAction(nameof(GetAll), new { ticketId }, attachment);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{attachId:guid}")]
        [Authorize]
        public async Task<IActionResult> Delete(Guid ticketId, Guid attachId)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

            try
            {
                var deleted = await _attachmentService.DeleteAttachmentAsync(attachId, userId.Value, role);
                return deleted ? NoContent() : NotFound();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpGet("{attachId:guid}/download")]
        [Authorize]
        public async Task<IActionResult> Download(Guid ticketId, Guid attachId)
        {
            var info = await _attachmentService.GetDownloadInfoAsync(attachId);
            if (info == null)
            {
                return NotFound();
            }

            return PhysicalFile(info.Value.PhysicalPath, info.Value.MimeType, info.Value.FileName);
        }
    }
}
