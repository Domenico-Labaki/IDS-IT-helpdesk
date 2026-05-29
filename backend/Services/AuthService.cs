using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using HelpdeskApi.Helpers;
using HelpdeskApi.Models;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Security.Cryptography;

namespace HelpdeskApi.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _dbContext;
        private readonly JwtHelper _jwtHelper;
        private readonly IEmailService _emailService;

        public AuthService(AppDbContext dbContext, JwtHelper jwtHelper, IEmailService emailService)
        {
            _dbContext = dbContext;
            _jwtHelper = jwtHelper;
            _emailService = emailService;
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto)
        {
            var user = await _dbContext.Users
                .Include(user => user.Role)
                .FirstOrDefaultAsync(user => user.Email == dto.Email);

            if (user == null || !user.IsActive || string.IsNullOrWhiteSpace(user.PasswordHash) || !PasswordHelper.Verify(dto.Password, user.PasswordHash))
            {
                return null;
            }

            return new LoginResponseDto
            {
                Token = _jwtHelper.GenerateToken(user),
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role?.Name ?? string.Empty
            };
        }

        public async Task<bool> ForgotPasswordAsync(string email, string resetBaseUrl)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(user => user.Email == email);
            if (user == null)
            {
                return true;
            }

            var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            var urlEncodedToken = WebUtility.UrlEncode(rawToken);

            user.PasswordResetToken = rawToken;
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);

            await _dbContext.SaveChangesAsync();

            var resetLink = $"{resetBaseUrl}?token={urlEncodedToken}";

            try
            {
                await _emailService.SendPasswordResetEmailAsync(user.Email, user.FullName, resetLink);
            }
            catch
            {
                // Intentionally swallow email failures to avoid leaking account existence or SMTP issues.
            }

            return true;
        }

        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(user =>
                user.PasswordResetToken == token &&
                user.PasswordResetTokenExpiry != null &&
                user.PasswordResetTokenExpiry > DateTime.UtcNow);

            if (user == null)
            {
                var decodedToken = WebUtility.UrlDecode(token);
                if (!string.Equals(decodedToken, token, StringComparison.Ordinal))
                {
                    user = await _dbContext.Users.FirstOrDefaultAsync(user =>
                        user.PasswordResetToken == decodedToken &&
                        user.PasswordResetTokenExpiry != null &&
                        user.PasswordResetTokenExpiry > DateTime.UtcNow);
                }
            }

            if (user == null || !PasswordHelper.IsPasswordValid(newPassword))
            {
                return false;
            }

            user.PasswordHash = PasswordHelper.Hash(newPassword);
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiry = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            return true;
        }
    }
}