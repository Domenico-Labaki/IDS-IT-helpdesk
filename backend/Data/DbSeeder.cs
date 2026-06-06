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

            context.Roles.AddRange(roles);

            await context.SaveChangesAsync();
        }
    }
}