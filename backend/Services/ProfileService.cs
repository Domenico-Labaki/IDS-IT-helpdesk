using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using HelpdeskApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Services
{
    public class ProfileService : IProfileService
    {
        private readonly AppDbContext _dbContext;

        public ProfileService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<UserProfileDto?> GetProfileAsync(Guid userId)
        {
            var user = await _dbContext.Users
                .Include(existingUser => existingUser.Role)
                .FirstOrDefaultAsync(existingUser => existingUser.Id == userId);

            if (user == null)
            {
                return null;
            }

            return MapToDto(user);
        }

        public async Task<UserProfileDto?> UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
        {
            var user = await _dbContext.Users
                .Include(existingUser => existingUser.Role)
                .FirstOrDefaultAsync(existingUser => existingUser.Id == userId);

            if (user == null)
            {
                return null;
            }

            user.FullName = dto.FullName;
            user.Department = dto.Department;
            user.UpdatedAt = DateTime.UtcNow;

            _dbContext.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = "ProfileUpdated",
                EntityType = "User",
                EntityId = userId,
                Metadata = string.Empty,
                PerformedAt = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync();

            return MapToDto(user);
        }

        private static UserProfileDto MapToDto(User user)
        {
            return new UserProfileDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role?.Name ?? string.Empty,
                Department = user.Department,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            };
        }
    }
}