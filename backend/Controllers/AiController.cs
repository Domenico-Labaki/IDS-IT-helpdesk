using System.Text.Json;
using HelpdeskApi.DTOs;
using HelpdeskApi.Helpers;
using HelpdeskApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/ai")]
    public class AiController : ControllerBase
    {
        private readonly IAiService _aiService;
        private readonly JwtHelper _jwtHelper;
        private readonly ILogger<AiController> _logger;
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public AiController(IAiService aiService, JwtHelper jwtHelper, ILogger<AiController> logger)
        {
            _aiService = aiService;
            _jwtHelper = jwtHelper;
            _logger = logger;
        }

        [HttpPost("suggest-category")]
        [Authorize]
        [EnableRateLimiting("AiPolicy")]
        public async Task<IActionResult> SuggestCategory([FromBody] SuggestCategoryRequest request)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
                return Unauthorized();

            try
            {
                var result = await _aiService.SuggestCategoryAsync(request);
                return Ok(result);
            }
            catch (GroqRateLimitException ex)
            {
                Response.Headers.Append("Retry-After", ex.RetryAfterSeconds.ToString());
                return StatusCode(429, new { message = ex.Message, retryAfterSeconds = ex.RetryAfterSeconds });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("suggest-priority")]
        [Authorize]
        [EnableRateLimiting("AiPolicy")]
        public async Task<IActionResult> SuggestPriority([FromBody] SuggestPriorityRequest request)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
                return Unauthorized();

            try
            {
                var result = await _aiService.SuggestPriorityAsync(request);
                return Ok(result);
            }
            catch (GroqRateLimitException ex)
            {
                Response.Headers.Append("Retry-After", ex.RetryAfterSeconds.ToString());
                return StatusCode(429, new { message = ex.Message, retryAfterSeconds = ex.RetryAfterSeconds });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("suggest-reply")]
        [Authorize(Roles = "Admin,Agent,Manager")]
        [EnableRateLimiting("AiPolicy")]
        public async Task<IActionResult> SuggestReply([FromBody] SuggestReplyRequest request)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
                return Unauthorized();

            try
            {
                var result = await _aiService.SuggestReplyAsync(request);
                return Ok(result);
            }
            catch (GroqRateLimitException ex)
            {
                Response.Headers.Append("Retry-After", ex.RetryAfterSeconds.ToString());
                return StatusCode(429, new { message = ex.Message, retryAfterSeconds = ex.RetryAfterSeconds });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("chat")]
        [Authorize]
        [EnableRateLimiting("AiPolicy")]
        public async Task Chat([FromBody] AiChatRequest request)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
                return;

            Response.Headers.Append("Content-Type", "text/event-stream");
            Response.Headers.Append("Cache-Control", "no-cache");
            Response.Headers.Append("Connection", "keep-alive");

            try
            {
                await foreach (var evt in _aiService.ChatStreamAsync(request, userId.Value, HttpContext.RequestAborted))
                {
                    var json = JsonSerializer.Serialize(evt, JsonOptions);
                    await Response.WriteAsync($"data: {json}\n\n", HttpContext.RequestAborted);
                    await Response.Body.FlushAsync(HttpContext.RequestAborted);
                }

                await Response.WriteAsync("data: [DONE]\n\n", HttpContext.RequestAborted);
                await Response.Body.FlushAsync(HttpContext.RequestAborted);
            }
            catch (GroqRateLimitException ex)
            {
                _logger.LogWarning("Groq rate limited HELIX chat for {RetryAfterSeconds}s", ex.RetryAfterSeconds);
                var errorEvent = JsonSerializer.Serialize(new AiStreamEvent
                {
                    Type = "text",
                    Content = $"HELIX is temporarily busy. Please retry in {ex.RetryAfterSeconds} seconds."
                }, JsonOptions);
                await Response.WriteAsync($"data: {errorEvent}\n\n", HttpContext.RequestAborted);
                await Response.Body.FlushAsync(HttpContext.RequestAborted);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "AI chat streaming error");
                var errorEvent = JsonSerializer.Serialize(new AiStreamEvent { Type = "text", Content = ex.Message }, JsonOptions);
                await Response.WriteAsync($"data: {errorEvent}\n\n", HttpContext.RequestAborted);
                await Response.Body.FlushAsync(HttpContext.RequestAborted);
            }
            catch (OperationCanceledException)
            {
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected HELIX chat error");
                var errorEvent = JsonSerializer.Serialize(new AiStreamEvent
                {
                    Type = "text",
                    Content = "HELIX could not complete this request. Please try again."
                }, JsonOptions);
                await Response.WriteAsync($"data: {errorEvent}\n\n", HttpContext.RequestAborted);
                await Response.Body.FlushAsync(HttpContext.RequestAborted);
            }
        }

        [HttpPost("scan-attachment/{attachmentId:guid}")]
        [Authorize(Roles = "Admin,Agent,Manager")]
        [EnableRateLimiting("AiPolicy")]
        public async Task<IActionResult> ScanAttachment(Guid attachmentId)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null) return Unauthorized();
            var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
            try
            {
                var result = await _aiService.ScanAttachmentAsync(attachmentId, userId.Value, role);
                return Ok(result);
            }
            catch (GroqRateLimitException ex)
            {
                Response.Headers.Append("Retry-After", ex.RetryAfterSeconds.ToString());
                return StatusCode(429, new { message = ex.Message, retryAfterSeconds = ex.RetryAfterSeconds });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpPost("actions/{actionId:guid}/confirm")]
        [Authorize]
        [EnableRateLimiting("AiPolicy")]
        public async Task<IActionResult> ConfirmAction(Guid actionId, CancellationToken cancellationToken)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null) return Unauthorized();
            try
            {
                return Ok(await _aiService.ConfirmActionAsync(actionId, userId.Value, cancellationToken));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (TimeoutException ex)
            {
                return StatusCode(StatusCodes.Status410Gone, new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpPost("actions/{actionId:guid}/reject")]
        [Authorize]
        [EnableRateLimiting("AiPolicy")]
        public async Task<IActionResult> RejectAction(Guid actionId, CancellationToken cancellationToken)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null) return Unauthorized();
            try
            {
                return Ok(await _aiService.RejectActionAsync(actionId, userId.Value, cancellationToken));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        // ───── Session management ─────

        [HttpGet("sessions")]
        [Authorize]
        public async Task<IActionResult> GetSessions()
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
                return Unauthorized();

            var sessions = await _aiService.GetSessionsAsync(userId.Value);
            return Ok(sessions);
        }

        [HttpPost("sessions")]
        [Authorize]
        [EnableRateLimiting("AiPolicy")]
        public async Task<IActionResult> CreateSession([FromBody] CreateSessionRequest request)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
                return Unauthorized();

            var session = await _aiService.CreateSessionAsync(userId.Value, request);
            return Ok(session);
        }

        [HttpPut("sessions/{sessionId:guid}")]
        [Authorize]
        [EnableRateLimiting("AiPolicy")]
        public async Task<IActionResult> UpdateSession(Guid sessionId, [FromBody] UpdateSessionRequest request)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
                return Unauthorized();

            try
            {
                var session = await _aiService.UpdateSessionAsync(sessionId, userId.Value, request);
                return Ok(session);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpDelete("sessions/{sessionId:guid}")]
        [Authorize]
        [EnableRateLimiting("AiPolicy")]
        public async Task<IActionResult> DeleteSession(Guid sessionId)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
                return Unauthorized();

            try
            {
                await _aiService.DeleteSessionAsync(sessionId, userId.Value);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("sessions/{sessionId:guid}/messages")]
        [Authorize]
        public async Task<IActionResult> GetSessionMessages(Guid sessionId)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
                return Unauthorized();

            try
            {
                var messages = await _aiService.GetSessionMessagesAsync(sessionId, userId.Value);
                return Ok(messages);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("sessions/{sessionId:guid}/actions")]
        [Authorize]
        public async Task<IActionResult> GetSessionActions(Guid sessionId)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null) return Unauthorized();
            try
            {
                return Ok(await _aiService.GetSessionActionsAsync(sessionId, userId.Value));
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
