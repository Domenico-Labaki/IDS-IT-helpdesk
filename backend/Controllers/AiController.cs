using HelpdeskApi.DTOs;
using HelpdeskApi.Helpers;
using HelpdeskApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/ai")]
    public class AiController : ControllerBase
    {
        private readonly IAiService _aiService;
        private readonly JwtHelper _jwtHelper;

        public AiController(IAiService aiService, JwtHelper jwtHelper)
        {
            _aiService = aiService;
            _jwtHelper = jwtHelper;
        }

        [HttpPost("suggest-category")]
        [Authorize]
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
                await foreach (var chunk in _aiService.ChatStreamAsync(request, userId.Value, HttpContext.RequestAborted))
                {
                    await Response.WriteAsync($"data: {chunk}\n\n", HttpContext.RequestAborted);
                    await Response.Body.FlushAsync(HttpContext.RequestAborted);
                }

                await Response.WriteAsync("data: [DONE]\n\n", HttpContext.RequestAborted);
                await Response.Body.FlushAsync(HttpContext.RequestAborted);
            }
            catch (OperationCanceledException)
            {
            }
        }

        [HttpPost("scan-attachment/{attachmentId:guid}")]
        [Authorize(Roles = "Admin,Agent,Manager")]
        public async Task<IActionResult> ScanAttachment(Guid attachmentId)
        {
            try
            {
                var result = await _aiService.ScanAttachmentAsync(attachmentId);
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
    }
}
