using HelpdeskApi.DTOs;

namespace HelpdeskApi.Services
{
    public interface IAttachmentService
    {
        Task<List<AttachmentDto>> GetAttachmentsAsync(Guid ticketId);
        Task<AttachmentDto> UploadAttachmentAsync(Guid ticketId, Guid uploadedByUserId, IFormFile file);
        Task<bool> DeleteAttachmentAsync(Guid attachmentId, Guid requestingUserId, string requestingRole);
        Task<(string PhysicalPath, string MimeType, string FileName)?> GetDownloadInfoAsync(Guid attachmentId);
    }
}
