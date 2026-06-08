namespace HelpdeskApi.Models
{
    public class TicketAttachment
    {
        public Guid Id { get; set; }
        public Guid TicketId { get; set; }
        public Guid UploadedBy { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public int? FileSizeBytes { get; set; }
        public string MimeType { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }

        // Navigation properties
        public Ticket Ticket { get; set; } = null!;
        public User UploadedByUser { get; set; } = null!;
    }
}
