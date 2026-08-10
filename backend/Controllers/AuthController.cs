using HelpdeskApi.DTOs;
using HelpdeskApi.Helpers;
using HelpdeskApi.Services;
using HelpdeskApi.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/auth")]
    [EnableRateLimiting("AuthPolicy")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly AppDbContext _dbContext;
        private readonly JwtHelper _jwtHelper;
        private readonly IConfiguration _configuration;

        public AuthController(IAuthService authService, AppDbContext dbContext, JwtHelper jwtHelper, IConfiguration configuration)
        {
            _authService = authService;
            _dbContext = dbContext;
            _jwtHelper = jwtHelper;
            _configuration = configuration;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            var result = await _authService.LoginAsync(dto);
            if (result == null)
            {
                return Unauthorized();
            }

            var cookieOptions = GetRefreshCookieOptions();
            Response.Cookies.Append("refreshToken", result.RawRefreshToken, cookieOptions);

            return Ok(result.Response);
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> Refresh()
        {
            if (!Request.Cookies.TryGetValue("refreshToken", out var refreshToken) || string.IsNullOrEmpty(refreshToken))
            {
                return Unauthorized();
            }

            var result = await _authService.RefreshAsync(refreshToken);
            if (result == null)
            {
                return Unauthorized();
            }

            var cookieOptions = GetRefreshCookieOptions();
            Response.Cookies.Append("refreshToken", result.RawRefreshToken, cookieOptions);

            return Ok(result.Response);
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var user = await _dbContext.Users.FindAsync(userId.Value);
            if (user == null)
            {
                return Unauthorized();
            }

            user.TokenVersion++;
            user.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            if (Request.Cookies.TryGetValue("refreshToken", out var refreshToken) && !string.IsNullOrEmpty(refreshToken))
            {
                await _authService.RevokeRefreshTokenAsync(refreshToken);
            }

            Response.Cookies.Delete("refreshToken");
            return Ok();
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto dto)
        {
            var frontendBase = _configuration["Frontend:BaseUrl"]?.TrimEnd('/') ?? $"{Request.Scheme}://{Request.Host}";
            var resetBaseUrl = $"{frontendBase}/reset-password";

            var result = await _authService.ForgotPasswordAsync(dto.Email, resetBaseUrl);

            return Ok(new { message = result.Message });
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto dto)
        {
            try
            {
                await _authService.ResetPasswordAsync(dto.Token, dto.NewPassword);
                return Ok(new { message = "Password reset successful." });
            }
            catch (ArgumentException ex) when (ex.Message == "Password does not meet complexity requirements.")
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex) when (ex.Message == "Invalid or expired reset token.")
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto dto)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            try
            {
                await _authService.ChangePasswordAsync(userId.Value, dto.CurrentPassword, dto.NewPassword);
                return Ok(new { message = "Password changed successfully." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("2fa/setup")]
        [Authorize]
        public async Task<IActionResult> SetupTwoFactor()
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var result = await _authService.SetupTwoFactorAsync(userId.Value);
            return Ok(result);
        }

        [HttpPost("2fa/verify")]
        [Authorize]
        public async Task<IActionResult> VerifyTwoFactorSetup([FromBody] TwoFactorVerifyRequest dto)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var success = await _authService.VerifyTwoFactorSetupAsync(userId.Value, dto.Code);
            if (!success)
            {
                return BadRequest(new { message = "Invalid verification code." });
            }

            return Ok(new { message = "Two-factor authentication enabled." });
        }

        [HttpPost("2fa/disable")]
        [Authorize]
        public async Task<IActionResult> DisableTwoFactor([FromBody] TwoFactorVerifyRequest dto)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var success = await _authService.DisableTwoFactorAsync(userId.Value, dto.Code);
            if (!success)
            {
                return BadRequest(new { message = "Invalid verification code." });
            }

            return Ok(new { message = "Two-factor authentication disabled." });
        }

        [HttpPost("2fa/login")]
        [AllowAnonymous]
        public async Task<IActionResult> CompleteTwoFactorLogin([FromBody] TwoFactorLoginRequest dto)
        {
            var result = await _authService.CompleteTwoFactorLoginAsync(dto.TwoFactorToken, dto.Code);
            if (result == null)
            {
                return Unauthorized();
            }

            var cookieOptions = GetRefreshCookieOptions();
            Response.Cookies.Append("refreshToken", result.RawRefreshToken, cookieOptions);

            return Ok(result.Response);
        }

        private CookieOptions GetRefreshCookieOptions()
        {
            return new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = Request.IsHttps ? SameSiteMode.None : SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(30),
                Path = "/"
            };
        }
    }
}
