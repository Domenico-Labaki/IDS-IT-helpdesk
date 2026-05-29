using HelpdeskApi.DTOs;

namespace HelpdeskApi.Services
{
    public interface IProfileService
    {
        Task<UserProfileDto?> GetProfileAsync(Guid userId);
        Task<UserProfileDto?> UpdateProfileAsync(Guid userId, UpdateProfileDto dto);
    }
}