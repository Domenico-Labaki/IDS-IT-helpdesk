using HelpdeskApi.DTOs;

namespace HelpdeskApi.Services
{
    public interface IAttachmentService
    {
        Task<List<AttachmentDto>> GetAttachmentsAsync(Guid ticketId, Guid requestingUserId, string requestingRole);
        Task<AttachmentDto> UploadAttachmentAsync(Guid ticketId, Guid uploadedByUserId, string requestingRole, IFormFile file);
        Task<bool> DeleteAttachmentAsync(Guid ticketId, Guid attachmentId, Guid requestingUserId, string requestingRole);
        Task<(string PhysicalPath, string MimeType, string FileName)?> GetDownloadInfoAsync(Guid ticketId, Guid attachmentId, Guid requestingUserId, string requestingRole);
    }
}
