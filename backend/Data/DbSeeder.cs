using HelpdeskApi.Helpers;
using HelpdeskApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Data
{
    public static class DbSeeder
    {
        // dotnet ef migrations add InitialCreate
        // dotnet ef database update
        public static async Task SeedAsync(AppDbContext context)
        {
            if (await context.Roles.AnyAsync())
            {
                return;
            }

            var roles = new[]
            {
                new Role { Id = 1, Name = "Admin", Description = "Full system access" },
                new Role { Id = 2, Name = "Agent", Description = "IT support agent, manages and resolves tickets" },
                new Role { Id = 3, Name = "Manager", Description = "Monitors team tickets and reports" },
                new Role { Id = 4, Name = "Employee", Description = "Creates and tracks tickets" }
            };

            var categories = new[]
            {
                new Category { Id = 1, Name = "Hardware", Description = "Hardware-related issues" },
                new Category { Id = 2, Name = "Software", Description = "Software-related issues" },
                new Category { Id = 3, Name = "Network", Description = "Network connectivity and infrastructure issues" },
                new Category { Id = 4, Name = "Access & Permissions", Description = "Access, permissions, and account issues" },
                new Category { Id = 5, Name = "Other", Description = "Other issues" }
            };

            var priorities = new[]
            {
                new Priority { Id = 1, Name = "Critical", Level = 1 },
                new Priority { Id = 2, Name = "High", Level = 2 },
                new Priority { Id = 3, Name = "Medium", Level = 3 },
                new Priority { Id = 4, Name = "Low", Level = 4 }
            };

            var statuses = new[]
            {
                new Status { Id = 1, Name = "Open" },
                new Status { Id = 2, Name = "In Progress" },
                new Status { Id = 3, Name = "On Hold" },
                new Status { Id = 4, Name = "Resolved" },
                new Status { Id = 5, Name = "Closed" }
            };

            var adminUser = new User
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                FullName = "System Admin",
                Email = "admin@helpdesk.local",
                PasswordHash = PasswordHelper.Hash("Admin@1234!"),
                RoleId = 1,
                Department = "",
                IsActive = true,
                CreatedBy = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null,
                PasswordResetToken = null,
                PasswordResetTokenExpiry = null
            };

            context.Roles.AddRange(roles);
            context.Categories.AddRange(categories);
            context.Priorities.AddRange(priorities);
            context.Statuses.AddRange(statuses);
            context.Users.Add(adminUser);

            await context.SaveChangesAsync();
        }
    }
}