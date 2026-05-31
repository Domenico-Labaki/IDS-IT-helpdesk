using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using HelpdeskApi.Helpers;
using HelpdeskApi.Models;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;

namespace HelpdeskApi.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _dbContext;
        private readonly JwtHelper _jwtHelper;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthService> _logger;

        public AuthService(AppDbContext dbContext, JwtHelper jwtHelper, IEmailService emailService, ILogger<AuthService> logger)
        {
            _dbContext = dbContext;
            _jwtHelper = jwtHelper;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<LoginResultDto?> LoginAsync(LoginRequestDto dto)
        {
            var user = await _dbContext.Users
                .Include(user => user.Role)
                .FirstOrDefaultAsync(user => user.Email == dto.Email);
            if (user == null || !user.IsActive || string.IsNullOrWhiteSpace(user.PasswordHash) || !PasswordHelper.Verify(dto.Password, user.PasswordHash))
            {
                return null;
            }

            var response = new LoginResponseDto
            {
                Token = _jwtHelper.GenerateToken(user),
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role?.Name ?? string.Empty
            };

            // Create refresh token and persist a hash
            var rawRefresh = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            var refreshHash = HashToken(rawRefresh);

            var refreshEntity = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = refreshHash,
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.RefreshTokens.Add(refreshEntity);
            await _dbContext.SaveChangesAsync();

            return new LoginResultDto { Response = response, RawRefreshToken = rawRefresh };
        }

        public async Task<ForgotPasswordResultDto> ForgotPasswordAsync(string email, string resetBaseUrl, bool exposeResetLink = false)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(user => user.Email == email);
            if (user == null)
            {
                return new ForgotPasswordResultDto
                {
                    Message = "If that email exists, a reset link has been sent."
                };
            }
            var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            var urlEncodedToken = WebUtility.UrlEncode(rawToken);

            // Store only a hash of the token in the database to protect against DB leaks
            var tokenHash = HashToken(rawToken);

            user.PasswordResetToken = tokenHash;
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);

            await _dbContext.SaveChangesAsync();

            var resetLink = $"{resetBaseUrl}?token={urlEncodedToken}";

            try
            {
                await _emailService.SendPasswordResetEmailAsync(user.Email, user.FullName, resetLink);
            }
            catch (Exception ex)
            {
                // Log the failure for operators, but still return a generic response to the caller
                // TODO remove this dev-focused logging/response bridge once SMTP is configured everywhere.
                _logger.LogError(ex, "Failed to send password reset email to {Email}", user.Email);
            }

            return new ForgotPasswordResultDto
            {
                Message = "If that email exists, a reset link has been sent.",
                DevResetLink = exposeResetLink ? resetLink : null
            };
        }

        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            if (!PasswordHelper.IsPasswordValid(newPassword))
            {
                throw new ArgumentException("Password does not meet complexity requirements.");
            }
            // TODO: keep this tolerant token matching only until the reset-link handling is fully normalized.
            // Query-string values can arrive already decoded, partially decoded, or with spaces where '+' existed.
            var tokenCandidates = GetResetTokenCandidates(token);
            var tokenHashes = tokenCandidates
                .Select(HashToken)
                .Distinct()
                .ToArray();

            var user = await _dbContext.Users.FirstOrDefaultAsync(user =>
                user.PasswordResetToken != null &&
                user.PasswordResetTokenExpiry != null &&
                user.PasswordResetTokenExpiry > DateTime.UtcNow &&
                tokenHashes.Contains(user.PasswordResetToken));

            if (user == null)
            {
                throw new InvalidOperationException("Invalid or expired reset token.");
            }

            user.PasswordHash = PasswordHelper.Hash(newPassword);
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiry = null;
            user.UpdatedAt = DateTime.UtcNow;

            // Invalidate previously issued tokens by bumping the TokenVersion
            user.TokenVersion++;

            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<LoginResultDto?> RefreshAsync(string refreshToken)
        {
            if (string.IsNullOrEmpty(refreshToken)) return null;

            var tokenHash = HashToken(refreshToken);
            var existing = await _dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);
            if (existing == null || existing.RevokedAt != null || existing.ExpiresAt <= DateTime.UtcNow)
            {
                return null;
            }

            var user = await _dbContext.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == existing.UserId);
            if (user == null || !user.IsActive)
            {
                return null;
            }

            // rotate refresh token: revoke existing and create a new one
            existing.RevokedAt = DateTime.UtcNow;

            var newRaw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            var newHash = HashToken(newRaw);

            existing.ReplacedByHash = newHash;

            var newEntity = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = newHash,
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.RefreshTokens.Add(newEntity);
            await _dbContext.SaveChangesAsync();

            var response = new LoginResponseDto
            {
                Token = _jwtHelper.GenerateToken(user),
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role?.Name ?? string.Empty
            };

            return new LoginResultDto { Response = response, RawRefreshToken = newRaw };
        }

        public async Task<bool> RevokeRefreshTokenAsync(string refreshToken)
        {
            if (string.IsNullOrEmpty(refreshToken)) return false;

            var tokenHash = HashToken(refreshToken);
            var existing = await _dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);
            if (existing == null || existing.RevokedAt != null)
            {
                return false;
            }

            existing.RevokedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        private static string HashToken(string token)
        {
            using var sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(token ?? string.Empty);
            var hashed = sha.ComputeHash(bytes);
            return Convert.ToBase64String(hashed);
        }

        private static IEnumerable<string> GetResetTokenCandidates(string? token)
        {
            var raw = (token ?? string.Empty).Trim();
            if (raw.Length == 0)
            {
                yield break;
            }

            yield return raw;

            var spacesNormalized = raw.Replace(" ", "+");
            if (!string.Equals(spacesNormalized, raw, StringComparison.Ordinal))
            {
                yield return spacesNormalized;
            }

            var urlDecoded = WebUtility.UrlDecode(raw).Trim();
            if (!string.Equals(urlDecoded, raw, StringComparison.Ordinal))
            {
                yield return urlDecoded;
            }

            var urlDecodedSpacesNormalized = urlDecoded.Replace(" ", "+");
            if (!string.Equals(urlDecodedSpacesNormalized, urlDecoded, StringComparison.Ordinal))
            {
                yield return urlDecodedSpacesNormalized;
            }
        }
    }
}
