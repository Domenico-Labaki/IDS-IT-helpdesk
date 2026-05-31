using HelpdeskApi.DTOs;

namespace HelpdeskApi.Services
{
    public interface IAuthService
    {
        Task<LoginResultDto?> LoginAsync(LoginRequestDto dto);
        Task<ForgotPasswordResultDto> ForgotPasswordAsync(string email, string resetBaseUrl, bool exposeResetLink = false);
        Task<bool> ResetPasswordAsync(string token, string newPassword);
        Task<LoginResultDto?> RefreshAsync(string refreshToken);
        Task<bool> RevokeRefreshTokenAsync(string refreshToken);
    }
}