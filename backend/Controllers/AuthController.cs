using HelpdeskApi.DTOs;
using HelpdeskApi.Helpers;
using HelpdeskApi.Services;
using HelpdeskApi.Data;
using HelpdeskApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using System.Security.Claims;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly AppDbContext _dbContext;
        private readonly JwtHelper _jwtHelper;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;

        public AuthController(IAuthService authService, AppDbContext dbContext, JwtHelper jwtHelper, IConfiguration configuration, IWebHostEnvironment environment)
        {
            _authService = authService;
            _dbContext = dbContext;
            _jwtHelper = jwtHelper;
            _configuration = configuration;
            _environment = environment;
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

            // Set refresh token as secure, HttpOnly cookie
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = Request.IsHttps ? SameSiteMode.None : SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(30),
                Path = "/"
            };

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

            // Set rotated refresh token in cookie
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = Request.IsHttps ? SameSiteMode.None : SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(30),
                Path = "/"
            };

            Response.Cookies.Append("refreshToken", result.RawRefreshToken, cookieOptions);

            return Ok(result.Response);
        }

        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            // Invalidate tokens by bumping the user's TokenVersion
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var user = _dbContext.Users.FirstOrDefault(existingUser => existingUser.Id == userId.Value);
            if (user == null)
            {
                return Unauthorized();
            }

            user.TokenVersion++;
            user.UpdatedAt = DateTime.UtcNow;
            _dbContext.SaveChanges();

            // Revoke refresh token cookie if present
            if (Request.Cookies.TryGetValue("refreshToken", out var refreshToken) && !string.IsNullOrEmpty(refreshToken))
            {
                _authService.RevokeRefreshTokenAsync(refreshToken).GetAwaiter().GetResult();
            }

            // Remove cookie from client
            Response.Cookies.Delete("refreshToken");

            return Ok();
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto dto)
        {
            // Use a configured, trusted frontend base URL rather than relying on the request host
            var frontendBase = _configuration["Frontend:BaseUrl"]?.TrimEnd('/') ?? $"{Request.Scheme}://{Request.Host}";
            var resetBaseUrl = $"{frontendBase}/reset-password";

            var result = await _authService.ForgotPasswordAsync(dto.Email, resetBaseUrl, exposeResetLink: _environment.IsDevelopment());

            // TODO remove dev reset link exposure before production release.
            return Ok(new
            {
                message = result.Message,
                devResetLink = _environment.IsDevelopment() ? result.DevResetLink : null
            });
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

            var user = await _dbContext.Users.FirstOrDefaultAsync(existingUser => existingUser.Id == userId.Value);
            if (user == null)
            {
                return Unauthorized();
            }

            if (!PasswordHelper.Verify(dto.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(new { message = "Current password is invalid." });
            }

            if (!PasswordHelper.IsPasswordValid(dto.NewPassword))
            {
                return BadRequest(new { message = "New password does not meet complexity requirements." });
            }

            user.PasswordHash = PasswordHelper.Hash(dto.NewPassword);
            // Bump token version so previously issued tokens are invalidated
            user.TokenVersion++;
            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully." });
        }
    }
}
