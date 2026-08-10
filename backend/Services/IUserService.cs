using HelpdeskApi.DTOs;

namespace HelpdeskApi.Services
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllAsync();
        Task<UserDto?> GetByIdAsync(Guid id);
        Task<UserDto> CreateAsync(CreateUserDto dto, Guid createdBy);
        Task<bool> ToggleActiveAsync(Guid id, Guid performedByUserId);
        Task<UserDto?> UpdateRoleAsync(Guid id, int roleId, Guid performedByUserId);
        Task<UserDto?> UpdateUserAsync(Guid id, UpdateUserDto dto, Guid performedByUserId);
        Task<bool> DeleteUserAsync(Guid id, Guid performedByUserId);
        Task<bool> UnlockUserAsync(Guid id, Guid performedByUserId);
    }
}
