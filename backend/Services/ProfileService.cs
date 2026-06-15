using AutoMapper;
using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using HelpdeskApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Services
{
    public class ProfileService : IProfileService
    {
        private readonly AppDbContext _dbContext;
        private readonly IMapper _mapper;

        public ProfileService(AppDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<UserProfileDto?> GetProfileAsync(Guid userId)
        {
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null)
            {
                return null;
            }

            await _dbContext.Entry(user).Reference(u => u.Role).LoadAsync();
            return _mapper.Map<UserProfileDto>(user);
        }

        public async Task<UserProfileDto?> UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
        {
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null)
            {
                return null;
            }

            user.FullName = dto.FullName;
            user.Department = dto.Department;
            user.UpdatedAt = DateTime.UtcNow;

            _dbContext.ActivityLogs.Add(ActivityLogEntry(userId, "ProfileUpdated", "User", userId));
            await _dbContext.SaveChangesAsync();

            await _dbContext.Entry(user).Reference(u => u.Role).LoadAsync();
            return _mapper.Map<UserProfileDto>(user);
        }

        public async Task UpdateAvatarAsync(Guid userId, string? avatarUrl)
        {
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null) return;

            user.AvatarUrl = avatarUrl;
            user.UpdatedAt = DateTime.UtcNow;

            _dbContext.ActivityLogs.Add(ActivityLogEntry(userId, "AvatarUpdated", "User", userId));
            await _dbContext.SaveChangesAsync();
        }

        public async Task<string?> GetAvatarPathAsync(Guid userId)
        {
            var user = await _dbContext.Users.FindAsync(userId);
            return user?.AvatarUrl;
        }

        private static ActivityLog ActivityLogEntry(Guid userId, string action, string entityType, Guid? entityId)
        {
            return new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Metadata = "{}",
                PerformedAt = DateTime.UtcNow
            };
        }


    }
}