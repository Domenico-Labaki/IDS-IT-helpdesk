using System.Reflection;
using Microsoft.EntityFrameworkCore;
using HelpdeskApi.Models;

namespace HelpdeskApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Priority> Priorities { get; set; }
        public DbSet<Status> Statuses { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<TicketComment> TicketComments { get; set; }
        public DbSet<TicketAttachment> TicketAttachments { get; set; }
        public DbSet<TicketStatusHistory> TicketStatusHistories { get; set; }
        public DbSet<TicketAssignmentHistory> TicketAssignmentHistories { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Hardware", Description = "Hardware-related issues" },
                new Category { Id = 2, Name = "Software", Description = "Software-related issues" },
                new Category { Id = 3, Name = "Network", Description = "Network connectivity and infrastructure issues" },
                new Category { Id = 4, Name = "Account Access", Description = "Account access, permissions, and authentication issues" },
                new Category { Id = 5, Name = "Other", Description = "Other issues" }
            );

            modelBuilder.Entity<Priority>().HasData(
                new Priority { Id = 1, Name = "Low", Level = 1 },
                new Priority { Id = 2, Name = "Medium", Level = 2 },
                new Priority { Id = 3, Name = "High", Level = 3 },
                new Priority { Id = 4, Name = "Critical", Level = 4 }
            );

            modelBuilder.Entity<Status>().HasData(
                new Status { Id = 1, Name = "Open" },
                new Status { Id = 2, Name = "In Progress" },
                new Status { Id = 3, Name = "Resolved" },
                new Status { Id = 4, Name = "Closed" },
                new Status { Id = 5, Name = "Cancelled" },
                new Status { Id = 6, Name = "Pending" }
            );
        }
    }
}
