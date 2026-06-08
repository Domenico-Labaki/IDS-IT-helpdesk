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
            var emailExists = await _dbContext.Users.AnyAsync(user => user.Email == dto.Email);
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
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = _passwordHelper.Hash(dto.Password),
                RoleId = dto.RoleId,
                Department = dto.Department,
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

        public async Task<bool> ToggleActiveAsync(Guid id)
        {
            var user = await _dbContext.Users.FindAsync(id);

            if (user == null)
            {
                return false;
            }

            user.IsActive = !user.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            // TODO: pass performedByUserId from controller for proper audit trail
            _dbContext.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = id,
                Action = user.IsActive ? "UserActivated" : "UserDeactivated",
                EntityType = "User",
                EntityId = id,
                Metadata = "{}",
                PerformedAt = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync();
            return true;
        }


    }
}