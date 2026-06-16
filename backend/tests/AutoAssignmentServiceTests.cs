using HelpdeskApi.Data;
using HelpdeskApi.Models;
using HelpdeskApi.Services;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Tests;

public class AutoAssignmentServiceTests
{
    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetBestAgentAsync_ReturnsNull_WhenNoAgents()
    {
        using var db = CreateDbContext();
        var service = new AutoAssignmentService(db);

        var result = await service.GetBestAgentAsync();

        Assert.Null(result);
    }

    [Fact]
    public async Task GetBestAgentAsync_ReturnsAgent_WithLeastLoad()
    {
        using var db = CreateDbContext();

        db.Roles.AddRange(
            new Role { Id = 1, Name = "Admin" },
            new Role { Id = 2, Name = "Agent" }
        );
        db.Statuses.Add(new Status { Id = 1, Name = "Open" });

        db.Users.AddRange(
            new User { Id = Guid.NewGuid(), FullName = "Agent A", Email = "a@test.com", RoleId = 2, IsActive = true, PasswordHash = "hash", TokenVersion = 1 },
            new User { Id = Guid.NewGuid(), FullName = "Agent B", Email = "b@test.com", RoleId = 2, IsActive = true, PasswordHash = "hash", TokenVersion = 1 }
        );

        await db.SaveChangesAsync();

        var agents = await db.Users.Where(u => u.RoleId == 2).ToListAsync();
        // Give Agent A one more ticket
        db.Tickets.Add(new Ticket
        {
            Id = Guid.NewGuid(),
            ReferenceNumber = "TKT-001",
            Title = "Test ticket",
            Description = "Test",
            CategoryId = 1,
            PriorityId = 1,
            StatusId = 1,
            CreatedBy = agents[0].Id,
            AssignedTo = agents[0].Id,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = new AutoAssignmentService(db);
        var result = await service.GetBestAgentAsync();

        // Agent B should have lower load
        Assert.NotNull(result);
        Assert.Equal(agents[1].Id, result.Value);
    }
}
