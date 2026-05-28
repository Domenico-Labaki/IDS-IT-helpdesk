namespace HelpdeskApi.Models
{
    public class TicketAttachment
    {
        public Guid Id { get; set; }
        public Guid TicketId { get; set; }
        public Guid UploadedBy { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public int? FileSizeBytes { get; set; }
        public string MimeType { get; set; }
        public DateTime UploadedAt { get; set; }

        // Navigation properties
        public Ticket Ticket { get; set; }
        public User UploadedByUser { get; set; }
    }
}
