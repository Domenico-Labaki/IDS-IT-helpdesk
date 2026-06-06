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

            // User.Email unique index
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // User - Role relationship
            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // User self-reference (CreatedBy)
            modelBuilder.Entity<User>()
                .HasOne(u => u.CreatedByUser)
                .WithMany(u => u.CreatedUsers)
                .HasForeignKey(u => u.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            // Ticket - Category
            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.Category)
                .WithMany(c => c.Tickets)
                .HasForeignKey(t => t.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // Ticket - Priority
            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.Priority)
                .WithMany(p => p.Tickets)
                .HasForeignKey(t => t.PriorityId)
                .OnDelete(DeleteBehavior.Restrict);

            // Ticket - Status
            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.Status)
                .WithMany(s => s.Tickets)
                .HasForeignKey(t => t.StatusId)
                .OnDelete(DeleteBehavior.Restrict);

            // Ticket - User (CreatedBy)
            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.CreatedByUser)
                .WithMany(u => u.CreatedTickets)
                .HasForeignKey(t => t.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // Ticket - User (AssignedTo)
            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.AssignedToUser)
                .WithMany(u => u.AssignedTickets)
                .HasForeignKey(t => t.AssignedTo)
                .OnDelete(DeleteBehavior.SetNull);

            // Ticket.ReferenceNumber unique index
            modelBuilder.Entity<Ticket>()
                .HasIndex(t => t.ReferenceNumber)
                .IsUnique();

            // TicketComment - Ticket
            modelBuilder.Entity<TicketComment>()
                .HasOne(tc => tc.Ticket)
                .WithMany(t => t.Comments)
                .HasForeignKey(tc => tc.TicketId)
                .OnDelete(DeleteBehavior.Restrict);

            // TicketComment - User (Author)
            modelBuilder.Entity<TicketComment>()
                .HasOne(tc => tc.Author)
                .WithMany(u => u.Comments)
                .HasForeignKey(tc => tc.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            // TicketAttachment - Ticket
            modelBuilder.Entity<TicketAttachment>()
                .HasOne(ta => ta.Ticket)
                .WithMany(t => t.Attachments)
                .HasForeignKey(ta => ta.TicketId)
                .OnDelete(DeleteBehavior.Restrict);

            // TicketAttachment - User (UploadedBy)
            modelBuilder.Entity<TicketAttachment>()
                .HasOne(ta => ta.UploadedByUser)
                .WithMany(u => u.Attachments)
                .HasForeignKey(ta => ta.UploadedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // TicketStatusHistory - Ticket
            modelBuilder.Entity<TicketStatusHistory>()
                .HasOne(tsh => tsh.Ticket)
                .WithMany(t => t.StatusHistories)
                .HasForeignKey(tsh => tsh.TicketId)
                .OnDelete(DeleteBehavior.Restrict);

            // TicketStatusHistory - User (ChangedBy)
            modelBuilder.Entity<TicketStatusHistory>()
                .HasOne(tsh => tsh.ChangedByUser)
                .WithMany(u => u.StatusHistories)
                .HasForeignKey(tsh => tsh.ChangedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // TicketStatusHistory - Status (OldStatus)
            modelBuilder.Entity<TicketStatusHistory>()
                .HasOne(tsh => tsh.OldStatus)
                .WithMany(s => s.OldStatusHistories)
                .HasForeignKey(tsh => tsh.OldStatusId)
                .OnDelete(DeleteBehavior.Restrict);

            // TicketStatusHistory - Status (NewStatus)
            modelBuilder.Entity<TicketStatusHistory>()
                .HasOne(tsh => tsh.NewStatus)
                .WithMany(s => s.NewStatusHistories)
                .HasForeignKey(tsh => tsh.NewStatusId)
                .OnDelete(DeleteBehavior.Restrict);

            // TicketAssignmentHistory - Ticket
            modelBuilder.Entity<TicketAssignmentHistory>()
                .HasOne(tah => tah.Ticket)
                .WithMany(t => t.AssignmentHistories)
                .HasForeignKey(tah => tah.TicketId)
                .OnDelete(DeleteBehavior.Restrict);

            // TicketAssignmentHistory - User (AssignedBy)
            modelBuilder.Entity<TicketAssignmentHistory>()
                .HasOne(tah => tah.AssignedByUser)
                .WithMany()
                .HasForeignKey(tah => tah.AssignedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // TicketAssignmentHistory - User (AssignedTo)
            modelBuilder.Entity<TicketAssignmentHistory>()
                .HasOne(tah => tah.AssignedToUser)
                .WithMany(u => u.AssignmentHistories)
                .HasForeignKey(tah => tah.AssignedTo)
                .OnDelete(DeleteBehavior.Restrict);

            // Notification - User
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Notification - Ticket
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Ticket)
                .WithMany(t => t.Notifications)
                .HasForeignKey(n => n.TicketId)
                .OnDelete(DeleteBehavior.Restrict);

            // ActivityLog - User
            modelBuilder.Entity<ActivityLog>()
                .HasOne(al => al.User)
                .WithMany(u => u.ActivityLogs)
                .HasForeignKey(al => al.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ActivityLog.Metadata as JSONB
            modelBuilder.Entity<ActivityLog>()
                .Property(al => al.Metadata)
                .HasColumnType("jsonb");

            // DateTime columns with timestamp with time zone
            modelBuilder.Entity<User>()
                .Property(u => u.CreatedAt)
                .HasColumnType("timestamp with time zone");

            modelBuilder.Entity<User>()
                .Property(u => u.UpdatedAt)
                .HasColumnType("timestamp with time zone");

            modelBuilder.Entity<User>()
                .Property(u => u.PasswordResetTokenExpiry)
                .HasColumnType("timestamp with time zone");

            modelBuilder.Entity<Ticket>()
                .Property(t => t.ResolvedAt)
                .HasColumnType("timestamp with time zone");

            modelBuilder.Entity<Ticket>()
                .Property(t => t.ClosedAt)
                .HasColumnType("timestamp with time zone");

            modelBuilder.Entity<Ticket>()
                .Property(t => t.CreatedAt)
                .HasColumnType("timestamp with time zone");

            modelBuilder.Entity<Ticket>()
                .Property(t => t.UpdatedAt)
                .HasColumnType("timestamp with time zone");

            modelBuilder.Entity<TicketComment>()
                .Property(tc => tc.CreatedAt)
                .HasColumnType("timestamp with time zone");

            modelBuilder.Entity<TicketAttachment>()
                .Property(ta => ta.UploadedAt)
                .HasColumnType("timestamp with time zone");

            modelBuilder.Entity<TicketStatusHistory>()
                .Property(tsh => tsh.ChangedAt)
                .HasColumnType("timestamp with time zone");

            modelBuilder.Entity<TicketAssignmentHistory>()
                .Property(tah => tah.AssignedAt)
                .HasColumnType("timestamp with time zone");

            modelBuilder.Entity<Notification>()
                .Property(n => n.CreatedAt)
                .HasColumnType("timestamp with time zone");

            modelBuilder.Entity<ActivityLog>()
                .Property(al => al.PerformedAt)
                .HasColumnType("timestamp with time zone");

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
                new Status { Id = 5, Name = "Cancelled" }
            );
        }
    }
}
