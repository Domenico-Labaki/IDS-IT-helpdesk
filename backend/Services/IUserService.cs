using HelpdeskApi.DTOs;

namespace HelpdeskApi.Services
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllAsync();
        Task<UserDto?> GetByIdAsync(Guid id);
        Task<UserDto> CreateAsync(CreateUserDto dto, Guid createdBy);
        Task<bool> ToggleActiveAsync(Guid id);
        Task<UserDto?> UpdateRoleAsync(Guid id, int roleId);
        Task<UserDto?> UpdateUserAsync(Guid id, UpdateUserDto dto);
        Task<bool> DeleteUserAsync(Guid id);
        Task<bool> UnlockUserAsync(Guid id);
    }
}