using HelpdeskApi.DTOs;

namespace HelpdeskApi.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto);
        Task<bool> ForgotPasswordAsync(string email, string resetBaseUrl);
        Task<bool> ResetPasswordAsync(string token, string newPassword);
    }
}