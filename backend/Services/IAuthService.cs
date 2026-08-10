using HelpdeskApi.DTOs;

namespace HelpdeskApi.Services
{
    public interface IAuthService
    {
        Task<LoginResultDto?> LoginAsync(LoginRequestDto dto);
        Task<ForgotPasswordResultDto> ForgotPasswordAsync(string email, string resetBaseUrl);
        Task<bool> ResetPasswordAsync(string token, string newPassword);
        Task<LoginResultDto?> RefreshAsync(string refreshToken);
        Task<bool> RevokeRefreshTokenAsync(string refreshToken);
        Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword);
        Task<TwoFactorSetupResponse> SetupTwoFactorAsync(Guid userId);
        Task<bool> VerifyTwoFactorSetupAsync(Guid userId, string code);
        Task<bool> DisableTwoFactorAsync(Guid userId, string code);
        Task<LoginResultDto?> CompleteTwoFactorLoginAsync(string twoFactorToken, string code);
    }
}
