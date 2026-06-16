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
        public DbSet<SystemSetting> SystemSettings { get; set; }
        public DbSet<EmailTemplate> EmailTemplates { get; set; }
        public DbSet<SlaTarget> SlaTargets { get; set; }
        public DbSet<EscalationRule> EscalationRules { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Hardware", Description = "Hardware-related issues" },
                new Category { Id = 2, Name = "Software", Description = "Software-related issues" },
                new Category { Id = 3, Name = "Network", Description = "Network connectivity and infrastructure issues" },
                new Category { Id = 4, Name = "Access Request", Description = "Account access, permissions, and authentication issues" },
                new Category { Id = 5, Name = "Other", Description = "Other issues" },
                new Category { Id = 6, Name = "Email", Description = "Email-related issues" }
            );

            modelBuilder.Entity<Priority>().HasData(
                new Priority { Id = 1, Name = "Low", Level = 1 },
                new Priority { Id = 2, Name = "Medium", Level = 2 },
                new Priority { Id = 3, Name = "High", Level = 3 },
                new Priority { Id = 4, Name = "Critical", Level = 4 }
            );

            modelBuilder.Entity<EmailTemplate>().HasData(
                new EmailTemplate { Id = 1, Name = "New Ticket Created", Subject = "[{ReferenceNumber}] Ticket Created — IT Help Desk", Body = "<p>Hello {Name},</p><p>Your ticket has been created successfully.</p><p><strong>{ReferenceNumber}</strong> — {Title}</p><p><a href=\"{TicketUrl}\">View your ticket</a></p>", UpdatedAt = DateTime.UtcNow },
                new EmailTemplate { Id = 2, Name = "Ticket Assigned", Subject = "[{ReferenceNumber}] Ticket Assigned — IT Help Desk", Body = "<p>Hello {Name},</p><p>Ticket <strong>{ReferenceNumber}</strong> has been assigned to you.</p><p>{Title}</p><p><a href=\"{TicketUrl}\">View assigned ticket</a></p>", UpdatedAt = DateTime.UtcNow },
                new EmailTemplate { Id = 3, Name = "Ticket Updated", Subject = "[{ReferenceNumber}] Status Updated — IT Help Desk", Body = "<p>Hello {Name},</p><p>Your ticket <strong>{ReferenceNumber}</strong> status has changed to <strong>{NewStatus}</strong>.</p><p>{Title}</p><p><a href=\"{TicketUrl}\">View your ticket</a></p>", UpdatedAt = DateTime.UtcNow },
                new EmailTemplate { Id = 4, Name = "Ticket Resolved", Subject = "[{ReferenceNumber}] Ticket Resolved — IT Help Desk", Body = "<p>Hello {Name},</p><p>Your ticket <strong>{ReferenceNumber}</strong> has been resolved.</p><p>{Title}</p><p><a href=\"{TicketUrl}\">View your ticket</a></p>", UpdatedAt = DateTime.UtcNow }
            );

            modelBuilder.Entity<Status>().HasData(
                new Status { Id = 1, Name = "Open" },
                new Status { Id = 2, Name = "In Progress" },
                new Status { Id = 3, Name = "Resolved" },
                new Status { Id = 4, Name = "Closed" },
                new Status { Id = 5, Name = "Cancelled" },
                new Status { Id = 6, Name = "Pending" }
            );

            modelBuilder.Entity<SlaTarget>().HasData(
                new SlaTarget { Id = 1, PriorityId = 1, TargetHours = 72 },
                new SlaTarget { Id = 2, PriorityId = 2, TargetHours = 24 },
                new SlaTarget { Id = 3, PriorityId = 3, TargetHours = 8 },
                new SlaTarget { Id = 4, PriorityId = 4, TargetHours = 4 }
            );

            modelBuilder.Entity<SlaTarget>()
                .HasOne(st => st.Priority)
                .WithMany()
                .HasForeignKey(st => st.PriorityId);

            modelBuilder.Entity<EscalationRule>()
                .HasOne(er => er.Priority)
                .WithMany()
                .HasForeignKey(er => er.PriorityId);

            modelBuilder.Entity<EscalationRule>()
                .HasOne(er => er.TargetRole)
                .WithMany()
                .HasForeignKey(er => er.TargetRoleId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<EscalationRule>()
                .HasOne(er => er.EscalateToRole)
                .WithMany()
                .HasForeignKey(er => er.EscalateToRoleId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
