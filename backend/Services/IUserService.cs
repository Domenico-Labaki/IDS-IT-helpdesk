using HelpdeskApi.DTOs;

namespace HelpdeskApi.Services
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllAsync();
        Task<UserDto?> GetByIdAsync(Guid id);
        Task<UserDto> CreateAsync(CreateUserDto dto, Guid createdBy);
        Task<bool> ToggleActiveAsync(Guid id);
    }
}