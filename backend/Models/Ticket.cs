using System.ComponentModel.DataAnnotations;

namespace HelpdeskApi.Models
{
    public class Ticket
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(20)]
        public string ReferenceNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        public int CategoryId { get; set; }
        public int PriorityId { get; set; }
        public int StatusId { get; set; }
        public Guid CreatedBy { get; set; }
        public Guid? AssignedTo { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public Category Category { get; set; }
        public Priority Priority { get; set; }
        public Status Status { get; set; }
        public User CreatedByUser { get; set; }
        public User? AssignedToUser { get; set; }
        public ICollection<TicketComment> Comments { get; set; } = new List<TicketComment>();
        public ICollection<TicketAttachment> Attachments { get; set; } = new List<TicketAttachment>();
        public ICollection<TicketStatusHistory> StatusHistories { get; set; } = new List<TicketStatusHistory>();
        public ICollection<TicketAssignmentHistory> AssignmentHistories { get; set; } = new List<TicketAssignmentHistory>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}
