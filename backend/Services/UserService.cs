using AutoMapper;
using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using HelpdeskApi.Helpers;
using HelpdeskApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _dbContext;
        private readonly IMapper _mapper;
        private readonly IPasswordHelper _passwordHelper;

        public UserService(AppDbContext dbContext, IMapper mapper, IPasswordHelper passwordHelper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
            _passwordHelper = passwordHelper;
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            var users = await _dbContext.Users
                .Include(user => user.Role)
                .OrderBy(user => user.FullName)
                .ToListAsync();

            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public async Task<UserDto?> GetByIdAsync(Guid id)
        {
            var user = await _dbContext.Users.FindAsync(id);
            if (user == null) return null;

            await _dbContext.Entry(user).Reference(u => u.Role).LoadAsync();
            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto> CreateAsync(CreateUserDto dto, Guid createdBy)
        {
            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            var emailExists = await _dbContext.Users.AnyAsync(user => user.Email == normalizedEmail);
            if (emailExists)
            {
                throw new InvalidOperationException("Email already in use.");
            }

            if (!_passwordHelper.IsPasswordValid(dto.Password))
            {
                throw new ArgumentException("Password does not meet complexity requirements.");
            }

            var role = await _dbContext.Roles.FirstOrDefaultAsync(existingRole => existingRole.Id == dto.RoleId);
            if (role == null)
            {
                throw new ArgumentException("Invalid role.");
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = dto.FullName.Trim(),
                Email = normalizedEmail,
                PasswordHash = _passwordHelper.Hash(dto.Password),
                RoleId = dto.RoleId,
                Department = dto.Department?.Trim() ?? string.Empty,
                IsActive = true,
                CreatedBy = createdBy,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.Users.Add(user);
            _dbContext.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = createdBy,
                Action = "UserCreated",
                EntityType = "User",
                EntityId = user.Id,
                Metadata = "{}",
                PerformedAt = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync();

            user.Role = role;
            return _mapper.Map<UserDto>(user);
        }

        public async Task<bool> ToggleActiveAsync(Guid id, Guid performedByUserId)
        {
            var user = await _dbContext.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return false;
            }

            if (user.IsActive && user.Role.Name == "Admin" && await ActiveAdminCountAsync() <= 1)
                throw new InvalidOperationException("The last active Admin cannot be deactivated.");

            user.IsActive = !user.IsActive;
            user.UpdatedAt = DateTime.UtcNow;
            await RevokeAllSessionsAsync(user);

            _dbContext.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = performedByUserId,
                Action = user.IsActive ? "UserActivated" : "UserDeactivated",
                EntityType = "User",
                EntityId = id,
                Metadata = "{}",
                PerformedAt = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<UserDto?> UpdateRoleAsync(Guid id, int roleId, Guid performedByUserId)
        {
            var user = await _dbContext.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return null;

            var role = await _dbContext.Roles.FindAsync(roleId);
            if (role == null) throw new ArgumentException("Invalid role.");

            if (user.Role.Name == "Admin" && role.Name != "Admin" && user.IsActive && await ActiveAdminCountAsync() <= 1)
                throw new InvalidOperationException("The last active Admin cannot be demoted.");

            user.RoleId = roleId;
            user.UpdatedAt = DateTime.UtcNow;
            await RevokeAllSessionsAsync(user);

            _dbContext.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = performedByUserId,
                Action = "UserRoleChanged",
                EntityType = "User",
                EntityId = id,
                Metadata = $"{{\"newRole\":\"{role.Name}\"}}",
                PerformedAt = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync();
            user.Role = role;
            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto?> UpdateUserAsync(Guid id, UpdateUserDto dto, Guid performedByUserId)
        {
            var user = await _dbContext.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return null;

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            if (await _dbContext.Users.AnyAsync(u => u.Id != id && u.Email.ToLower() == normalizedEmail))
                throw new InvalidOperationException("Email already in use.");

            user.FullName = dto.FullName;
            user.Email = normalizedEmail;
            user.Department = dto.Department ?? string.Empty;
            user.UpdatedAt = DateTime.UtcNow;
            await RevokeAllSessionsAsync(user);

            _dbContext.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = performedByUserId,
                Action = "UserUpdated",
                EntityType = "User",
                EntityId = id,
                Metadata = "{}",
                PerformedAt = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync();
            return _mapper.Map<UserDto>(user);
        }

        public async Task<bool> DeleteUserAsync(Guid id, Guid performedByUserId)
        {
            if (id == performedByUserId)
                throw new InvalidOperationException("You cannot delete your own account.");

            var user = await _dbContext.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return false;
            if (user.Role.Name == "Admin" && user.IsActive && await ActiveAdminCountAsync() <= 1)
                throw new InvalidOperationException("The last active Admin cannot be deleted.");

            _dbContext.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(), UserId = performedByUserId, Action = "UserDeleted",
                EntityType = "User", EntityId = id, Metadata = "{}", PerformedAt = DateTime.UtcNow
            });
            _dbContext.Users.Remove(user);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UnlockUserAsync(Guid id, Guid performedByUserId)
        {
            var user = await _dbContext.Users.FindAsync(id);
            if (user == null) return false;

            user.FailedLoginAttempts = 0;
            user.LockedUntil = null;
            user.UpdatedAt = DateTime.UtcNow;
            _dbContext.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(), UserId = performedByUserId, Action = "UserUnlocked",
                EntityType = "User", EntityId = id, Metadata = "{}", PerformedAt = DateTime.UtcNow
            });
            await _dbContext.SaveChangesAsync();
            return true;
        }

        private Task<int> ActiveAdminCountAsync() => _dbContext.Users
            .CountAsync(u => u.IsActive && u.Role.Name == "Admin");

        private async Task RevokeAllSessionsAsync(User user)
        {
            user.TokenVersion++;
            var now = DateTime.UtcNow;
            await _dbContext.RefreshTokens
                .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
                .ExecuteUpdateAsync(setters => setters.SetProperty(rt => rt.RevokedAt, now));
        }
    }
}
