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

            if (!string.IsNullOrEmpty(result.RawRefreshToken))
            {
                SetAuthenticationCookies(result);
            }

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

            SetAuthenticationCookies(result);

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
            await _authService.RevokeAllRefreshTokensAsync(user.Id);
            await _dbContext.SaveChangesAsync();

            Response.Cookies.Delete("refreshToken");
            Response.Cookies.Delete("token");
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
        public async Task<IActionResult> SetupTwoFactor([FromBody] TwoFactorSetupRequest request)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            try
            {
                var result = await _authService.SetupTwoFactorAsync(userId.Value, request.CurrentPassword, request.CurrentCode);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
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
        public async Task<IActionResult> DisableTwoFactor([FromBody] TwoFactorDisableRequest dto)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var success = await _authService.DisableTwoFactorAsync(userId.Value, dto.CurrentPassword, dto.Code);
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

            SetAuthenticationCookies(result);

            return Ok(result.Response);
        }

        private CookieOptions GetRefreshCookieOptions()
        {
            return new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(30),
                Path = "/"
            };
        }

        private void SetAuthenticationCookies(LoginResultDto result)
        {
            Response.Cookies.Append("refreshToken", result.RawRefreshToken, GetRefreshCookieOptions());
            Response.Cookies.Append("token", result.Response.Token, new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(1),
                Path = "/"
            });

            // The access token is intentionally available only through the HttpOnly cookie.
            result.Response.Token = string.Empty;
        }
    }
}
