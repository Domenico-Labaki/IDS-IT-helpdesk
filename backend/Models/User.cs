namespace HelpdeskApi.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        // Incrementing this invalidates previously issued JWTs when compared during validation
        public int TokenVersion { get; set; } = 0;
        public int RoleId { get; set; }
        public string Department { get; set; }
        public bool IsActive { get; set; } = true;
        public Guid? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }

        // Navigation properties
        public Role Role { get; set; }
        public User CreatedByUser { get; set; }
        public ICollection<User> CreatedUsers { get; set; } = new List<User>();
        public ICollection<Ticket> CreatedTickets { get; set; } = new List<Ticket>();
        public ICollection<Ticket> AssignedTickets { get; set; } = new List<Ticket>();
        public ICollection<TicketComment> Comments { get; set; } = new List<TicketComment>();
        public ICollection<TicketAttachment> Attachments { get; set; } = new List<TicketAttachment>();
        public ICollection<TicketStatusHistory> StatusHistories { get; set; } = new List<TicketStatusHistory>();
        public ICollection<TicketAssignmentHistory> AssignmentHistories { get; set; } = new List<TicketAssignmentHistory>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
    }
}
