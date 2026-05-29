using System;
using HelpdeskApi.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace HelpdeskApi.Migrations
{
    [DbContext(typeof(AppDbContext))]
    partial class AppDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
            modelBuilder
                .HasAnnotation("ProductVersion", "8.0.0")
                .HasAnnotation("Relational:MaxIdentifierLength", 63)
                .HasAnnotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            modelBuilder.Entity("HelpdeskApi.Models.ActivityLog", b =>
            {
                b.Property<Guid>("Id");
                b.Property<string>("Action").IsRequired();
                b.Property<Guid?>("EntityId");
                b.Property<string>("EntityType").IsRequired();
                b.Property<string>("Metadata").HasColumnType("jsonb").IsRequired();
                b.Property<DateTime>("PerformedAt").HasColumnType("timestamp with time zone");
                b.Property<Guid>("UserId");
                b.HasKey("Id");
                b.HasIndex("UserId");
                b.ToTable("ActivityLogs");
            });

            modelBuilder.Entity("HelpdeskApi.Models.Category", b =>
            {
                b.Property<int>("Id");
                b.Property<string>("Description").IsRequired();
                b.Property<string>("Name").IsRequired();
                b.HasKey("Id");
                b.ToTable("Categories");
            });

            modelBuilder.Entity("HelpdeskApi.Models.Notification", b =>
            {
                b.Property<Guid>("Id");
                b.Property<DateTime>("CreatedAt").HasColumnType("timestamp with time zone");
                b.Property<bool>("IsRead");
                b.Property<Guid?>("TicketId");
                b.Property<string>("Message").IsRequired();
                b.Property<Guid>("UserId");
                b.HasKey("Id");
                b.HasIndex("TicketId");
                b.HasIndex("UserId");
                b.ToTable("Notifications");
            });

            modelBuilder.Entity("HelpdeskApi.Models.Priority", b =>
            {
                b.Property<int>("Id");
                b.Property<int>("Level");
                b.Property<string>("Name").IsRequired();
                b.HasKey("Id");
                b.ToTable("Priorities");
            });

            modelBuilder.Entity("HelpdeskApi.Models.Role", b =>
            {
                b.Property<int>("Id");
                b.Property<string>("Description").IsRequired();
                b.Property<string>("Name").IsRequired();
                b.HasKey("Id");
                b.ToTable("Roles");
            });

            modelBuilder.Entity("HelpdeskApi.Models.Status", b =>
            {
                b.Property<int>("Id");
                b.Property<string>("Name").IsRequired();
                b.HasKey("Id");
                b.ToTable("Statuses");
            });

            modelBuilder.Entity("HelpdeskApi.Models.Ticket", b =>
            {
                b.Property<Guid>("Id");
                b.Property<int>("CategoryId");
                b.Property<DateTime?>("ClosedAt").HasColumnType("timestamp with time zone");
                b.Property<Guid>("CreatedBy");
                b.Property<DateTime>("CreatedAt").HasColumnType("timestamp with time zone");
                b.Property<string>("Description").IsRequired();
                b.Property<Guid?>("AssignedTo");
                b.Property<string>("ReferenceNumber").IsRequired();
                b.Property<DateTime?>("ResolvedAt").HasColumnType("timestamp with time zone");
                b.Property<int>("PriorityId");
                b.Property<string>("Title").IsRequired();
                b.Property<DateTime?>("UpdatedAt").HasColumnType("timestamp with time zone");
                b.Property<int>("StatusId");
                b.HasKey("Id");
                b.HasIndex("AssignedTo");
                b.HasIndex("CategoryId");
                b.HasIndex("CreatedBy");
                b.HasIndex("PriorityId");
                b.HasIndex("StatusId");
                b.ToTable("Tickets");
            });

            modelBuilder.Entity("HelpdeskApi.Models.TicketAttachment", b =>
            {
                b.Property<Guid>("Id");
                b.Property<string>("FileName").IsRequired();
                b.Property<int?>("FileSizeBytes");
                b.Property<string>("FilePath").IsRequired();
                b.Property<string>("MimeType").IsRequired();
                b.Property<DateTime>("UploadedAt").HasColumnType("timestamp with time zone");
                b.Property<Guid>("TicketId");
                b.Property<Guid>("UploadedBy");
                b.HasKey("Id");
                b.HasIndex("TicketId");
                b.HasIndex("UploadedBy");
                b.ToTable("TicketAttachments");
            });

            modelBuilder.Entity("HelpdeskApi.Models.TicketAssignmentHistory", b =>
            {
                b.Property<Guid>("Id");
                b.Property<Guid>("AssignedBy");
                b.Property<Guid>("AssignedTo");
                b.Property<DateTime>("AssignedAt").HasColumnType("timestamp with time zone");
                b.Property<Guid>("TicketId");
                b.HasKey("Id");
                b.HasIndex("AssignedBy");
                b.HasIndex("AssignedTo");
                b.HasIndex("TicketId");
                b.ToTable("TicketAssignmentHistories");
            });

            modelBuilder.Entity("HelpdeskApi.Models.TicketComment", b =>
            {
                b.Property<Guid>("Id");
                b.Property<Guid>("AuthorId");
                b.Property<DateTime>("CreatedAt").HasColumnType("timestamp with time zone");
                b.Property<string>("Body").IsRequired();
                b.Property<bool>("IsInternal");
                b.Property<Guid>("TicketId");
                b.HasKey("Id");
                b.HasIndex("AuthorId");
                b.HasIndex("TicketId");
                b.ToTable("TicketComments");
            });

            modelBuilder.Entity("HelpdeskApi.Models.TicketStatusHistory", b =>
            {
                b.Property<Guid>("Id");
                b.Property<Guid>("ChangedBy");
                b.Property<DateTime>("ChangedAt").HasColumnType("timestamp with time zone");
                b.Property<string>("Notes").IsRequired();
                b.Property<int>("NewStatusId");
                b.Property<int>("OldStatusId");
                b.Property<Guid>("TicketId");
                b.HasKey("Id");
                b.HasIndex("ChangedBy");
                b.HasIndex("NewStatusId");
                b.HasIndex("OldStatusId");
                b.HasIndex("TicketId");
                b.ToTable("TicketStatusHistories");
            });

            modelBuilder.Entity("HelpdeskApi.Models.User", b =>
            {
                b.Property<Guid>("Id");
                b.Property<DateTime>("CreatedAt").HasColumnType("timestamp with time zone");
                b.Property<Guid?>("CreatedBy");
                b.Property<string>("Department").IsRequired();
                b.Property<string>("Email").IsRequired();
                b.Property<bool>("IsActive");
                b.Property<string>("FullName").IsRequired();
                b.Property<string>("PasswordHash").IsRequired();
                b.Property<string>("PasswordResetToken").IsRequired();
                b.Property<DateTime?>("PasswordResetTokenExpiry").HasColumnType("timestamp with time zone");
                b.Property<int>("RoleId");
                b.Property<DateTime?>("UpdatedAt").HasColumnType("timestamp with time zone");
                b.HasKey("Id");
                b.HasIndex("CreatedBy");
                b.HasIndex("Email").IsUnique();
                b.HasIndex("RoleId");
                b.ToTable("Users");
            });
        }
    }
}