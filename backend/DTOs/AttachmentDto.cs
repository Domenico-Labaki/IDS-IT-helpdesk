namespace HelpdeskApi.DTOs
{
    public class AttachmentDto
    {
        public Guid Id { get; set; }
        public Guid TicketId { get; set; }
        public Guid UploadedBy { get; set; }
        public string UploaderName { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public int? FileSizeBytes { get; set; }
        public string MimeType { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
        public string DownloadUrl { get; set; } = string.Empty;
    }
}
