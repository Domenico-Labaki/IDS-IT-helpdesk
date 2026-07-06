using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using HelpdeskApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Services
{
    public class AttachmentService : IAttachmentService
    {
        private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "image/gif",
            "application/pdf",
            "text/plain",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        };

        private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

        private readonly AppDbContext _dbContext;
        private readonly IWebHostEnvironment _env;

        public AttachmentService(AppDbContext dbContext, IWebHostEnvironment env)
        {
            _dbContext = dbContext;
            _env = env;
        }

        public async Task<List<AttachmentDto>> GetAttachmentsAsync(Guid ticketId)
        {
            return await _dbContext.TicketAttachments
                .Include(a => a.UploadedByUser)
                .Where(a => a.TicketId == ticketId)
                .OrderByDescending(a => a.UploadedAt)
                .Select(a => new AttachmentDto
                {
                    Id = a.Id,
                    TicketId = a.TicketId,
                    UploadedBy = a.UploadedBy,
                    UploaderName = a.UploadedByUser.FullName,
                    FileName = a.FileName,
                    FileSizeBytes = a.FileSizeBytes,
                    MimeType = a.MimeType,
                    UploadedAt = a.UploadedAt,
                    DownloadUrl = $"/api/tickets/{a.TicketId}/attachments/{a.Id}/download",
                    AiSummary = a.AiSummary,
                    AiSummaryGeneratedAt = a.AiSummaryGeneratedAt
                })
                .ToListAsync();
        }

        public async Task<AttachmentDto> UploadAttachmentAsync(Guid ticketId, Guid uploadedByUserId, IFormFile file)
        {
            var ticketExists = await _dbContext.Tickets.AnyAsync(t => t.Id == ticketId);
            if (!ticketExists)
            {
                throw new InvalidOperationException("Ticket not found.");
            }

            if (file == null || file.Length == 0)
            {
                throw new InvalidOperationException("No file provided.");
            }

            if (file.Length > MaxFileSize)
            {
                throw new InvalidOperationException("File exceeds the maximum allowed size of 10 MB.");
            }

            if (!AllowedMimeTypes.Contains(file.ContentType))
            {
                throw new InvalidOperationException($"File type '{file.ContentType}' is not allowed.");
            }

            // Enforce per-ticket attachment limit from SystemSettings
            var maxSetting = await _dbContext.SystemSettings.FirstOrDefaultAsync(s => s.Key == "maxAttachmentsPerTicket");
            var maxAttachments = maxSetting != null && int.TryParse(maxSetting.Value, out var parsed) ? parsed : 5;
            var currentCount = await _dbContext.TicketAttachments.CountAsync(a => a.TicketId == ticketId);
            if (currentCount >= maxAttachments)
            {
                throw new InvalidOperationException($"Maximum of {maxAttachments} attachments per ticket reached.");
            }

            var uploadsDir = Path.Combine(_env.WebRootPath, "uploads", ticketId.ToString());
            Directory.CreateDirectory(uploadsDir);

            var fileExtension = Path.GetExtension(file.FileName);
            var storedFileName = $"{Guid.NewGuid()}{fileExtension}";
            var relativePath = Path.Combine("uploads", ticketId.ToString(), storedFileName);
            var physicalPath = Path.Combine(_env.WebRootPath, relativePath);

            await using (var stream = new FileStream(physicalPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var attachment = new TicketAttachment
            {
                Id = Guid.NewGuid(),
                TicketId = ticketId,
                UploadedBy = uploadedByUserId,
                FileName = file.FileName,
                FilePath = relativePath,
                FileSizeBytes = (int)file.Length,
                MimeType = file.ContentType,
                UploadedAt = DateTime.UtcNow
            };

            _dbContext.TicketAttachments.Add(attachment);

            _dbContext.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = uploadedByUserId,
                Action = "ATTACHMENT_UPLOADED",
                EntityType = "Ticket",
                EntityId = ticketId,
                Metadata = $"{{\"fileName\":\"{EscapeJson(file.FileName)}\",\"fileSize\":{file.Length},\"mimeType\":\"{file.ContentType}\"}}",
                PerformedAt = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync();

            // Reload with navigation for uploader name
            var savedAttachment = await _dbContext.TicketAttachments
                .Include(a => a.UploadedByUser)
                .FirstAsync(a => a.Id == attachment.Id);

            return new AttachmentDto
            {
                Id = savedAttachment.Id,
                TicketId = savedAttachment.TicketId,
                UploadedBy = savedAttachment.UploadedBy,
                UploaderName = savedAttachment.UploadedByUser.FullName,
                FileName = savedAttachment.FileName,
                FileSizeBytes = savedAttachment.FileSizeBytes,
                MimeType = savedAttachment.MimeType,
                UploadedAt = savedAttachment.UploadedAt,
                DownloadUrl = $"/api/tickets/{savedAttachment.TicketId}/attachments/{savedAttachment.Id}/download",
                AiSummary = savedAttachment.AiSummary,
                AiSummaryGeneratedAt = savedAttachment.AiSummaryGeneratedAt
            };
        }

        public async Task<bool> DeleteAttachmentAsync(Guid attachmentId, Guid requestingUserId, string requestingRole)
        {
            var attachment = await _dbContext.TicketAttachments.FindAsync(attachmentId);
            if (attachment == null)
            {
                return false;
            }

            if (attachment.UploadedBy != requestingUserId && requestingRole != "Admin")
            {
                throw new UnauthorizedAccessException("Only the uploader or an Admin can delete this attachment.");
            }

            var physicalPath = Path.Combine(_env.WebRootPath, attachment.FilePath);
            if (File.Exists(physicalPath))
            {
                File.Delete(physicalPath);
            }

            _dbContext.TicketAttachments.Remove(attachment);

            _dbContext.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = requestingUserId,
                Action = "ATTACHMENT_DELETED",
                EntityType = "Ticket",
                EntityId = attachment.TicketId,
                Metadata = $"{{\"fileName\":\"{EscapeJson(attachment.FileName)}\"}}",
                PerformedAt = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync();

            // Clean up empty ticket folder
            var dir = Path.GetDirectoryName(physicalPath);
            if (dir != null && !Directory.EnumerateFileSystemEntries(dir).Any())
            {
                Directory.Delete(dir);
            }

            return true;
        }

        public async Task<(string PhysicalPath, string MimeType, string FileName)?> GetDownloadInfoAsync(Guid attachmentId)
        {
            var attachment = await _dbContext.TicketAttachments.FindAsync(attachmentId);
            if (attachment == null)
            {
                return null;
            }

            var physicalPath = Path.Combine(_env.WebRootPath, attachment.FilePath);
            if (!File.Exists(physicalPath))
            {
                return null;
            }

            return (physicalPath, attachment.MimeType, attachment.FileName);
        }

        private static string EscapeJson(string value)
        {
            return value.Replace("\\", "\\\\").Replace("\"", "\\\"");
        }
    }
}
