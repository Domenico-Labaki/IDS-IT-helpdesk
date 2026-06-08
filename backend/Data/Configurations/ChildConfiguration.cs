using HelpdeskApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HelpdeskApi.Data.Configurations
{
    public class TicketCommentConfiguration : IEntityTypeConfiguration<TicketComment>
    {
        public void Configure(EntityTypeBuilder<TicketComment> builder)
        {
            builder.HasOne(tc => tc.Ticket)
                .WithMany(t => t.Comments)
                .HasForeignKey(tc => tc.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(tc => tc.Author)
                .WithMany(u => u.Comments)
                .HasForeignKey(tc => tc.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Property(tc => tc.CreatedAt).HasColumnType("timestamp with time zone");
        }
    }

    public class TicketAttachmentConfiguration : IEntityTypeConfiguration<TicketAttachment>
    {
        public void Configure(EntityTypeBuilder<TicketAttachment> builder)
        {
            builder.HasOne(ta => ta.Ticket)
                .WithMany(t => t.Attachments)
                .HasForeignKey(ta => ta.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(ta => ta.UploadedByUser)
                .WithMany(u => u.Attachments)
                .HasForeignKey(ta => ta.UploadedBy)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Property(ta => ta.UploadedAt).HasColumnType("timestamp with time zone");
        }
    }

    public class TicketStatusHistoryConfiguration : IEntityTypeConfiguration<TicketStatusHistory>
    {
        public void Configure(EntityTypeBuilder<TicketStatusHistory> builder)
        {
            builder.HasOne(tsh => tsh.Ticket)
                .WithMany(t => t.StatusHistories)
                .HasForeignKey(tsh => tsh.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(tsh => tsh.ChangedByUser)
                .WithMany(u => u.StatusHistories)
                .HasForeignKey(tsh => tsh.ChangedBy)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(tsh => tsh.OldStatus)
                .WithMany(s => s.OldStatusHistories)
                .HasForeignKey(tsh => tsh.OldStatusId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(tsh => tsh.NewStatus)
                .WithMany(s => s.NewStatusHistories)
                .HasForeignKey(tsh => tsh.NewStatusId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Property(tsh => tsh.ChangedAt).HasColumnType("timestamp with time zone");
        }
    }

    public class TicketAssignmentHistoryConfiguration : IEntityTypeConfiguration<TicketAssignmentHistory>
    {
        public void Configure(EntityTypeBuilder<TicketAssignmentHistory> builder)
        {
            builder.HasOne(tah => tah.Ticket)
                .WithMany(t => t.AssignmentHistories)
                .HasForeignKey(tah => tah.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(tah => tah.AssignedByUser)
                .WithMany()
                .HasForeignKey(tah => tah.AssignedBy)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(tah => tah.AssignedToUser)
                .WithMany(u => u.AssignmentHistories)
                .HasForeignKey(tah => tah.AssignedTo)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Property(tah => tah.AssignedAt).HasColumnType("timestamp with time zone");
        }
    }

    public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
    {
        public void Configure(EntityTypeBuilder<Notification> builder)
        {
            builder.HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(n => n.Ticket)
                .WithMany(t => t.Notifications)
                .HasForeignKey(n => n.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Property(n => n.CreatedAt).HasColumnType("timestamp with time zone");
        }
    }

    public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLog>
    {
        public void Configure(EntityTypeBuilder<ActivityLog> builder)
        {
            builder.HasOne(al => al.User)
                .WithMany(u => u.ActivityLogs)
                .HasForeignKey(al => al.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Property(al => al.Metadata).HasColumnType("jsonb");
            builder.Property(al => al.PerformedAt).HasColumnType("timestamp with time zone");
        }
    }
}
