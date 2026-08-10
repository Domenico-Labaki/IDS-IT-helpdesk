using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using HelpdeskApi.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;

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
        private readonly IConfiguration _configuration;

        public AttachmentService(AppDbContext dbContext, IWebHostEnvironment env, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _env = env;
            _configuration = configuration;
        }

        public async Task<List<AttachmentDto>> GetAttachmentsAsync(Guid ticketId, Guid requestingUserId, string requestingRole)
        {
            await EnsureCanViewTicketAsync(ticketId, requestingUserId, requestingRole);

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
                    PreviewUrl = a.MimeType.StartsWith("image/") || a.MimeType == "application/pdf"
                        ? $"/api/tickets/{a.TicketId}/attachments/{a.Id}/download?inline=true"
                        : null,
                    AiSummary = a.AiSummary,
                    AiSummaryGeneratedAt = a.AiSummaryGeneratedAt
                })
                .ToListAsync();
        }

        public async Task<AttachmentDto> UploadAttachmentAsync(Guid ticketId, Guid uploadedByUserId, string requestingRole, IFormFile file)
        {
            await EnsureCanMutateTicketAsync(ticketId, uploadedByUserId, requestingRole);

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

            var canonicalExtension = await ValidateFileContentAsync(file);

            // Enforce per-ticket attachment limit from SystemSettings
            var maxSetting = await _dbContext.SystemSettings.FirstOrDefaultAsync(s => s.Key == "maxAttachmentsPerTicket");
            var maxAttachments = maxSetting != null && int.TryParse(maxSetting.Value, out var parsed) ? parsed : 5;
            var currentCount = await _dbContext.TicketAttachments.CountAsync(a => a.TicketId == ticketId);
            if (currentCount >= maxAttachments)
            {
                throw new InvalidOperationException($"Maximum of {maxAttachments} attachments per ticket reached.");
            }

            var uploadsDir = Path.Combine(GetStorageRoot(), "uploads", ticketId.ToString());
            Directory.CreateDirectory(uploadsDir);

            var storedFileName = $"{Guid.NewGuid()}{canonicalExtension}";
            var relativePath = Path.Combine("uploads", ticketId.ToString(), storedFileName);
            var physicalPath = Path.Combine(GetStorageRoot(), relativePath);

            await using (var stream = new FileStream(physicalPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var attachment = new TicketAttachment
            {
                Id = Guid.NewGuid(),
                TicketId = ticketId,
                UploadedBy = uploadedByUserId,
                FileName = Path.GetFileName(file.FileName),
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
                PreviewUrl = savedAttachment.MimeType.StartsWith("image/") || savedAttachment.MimeType == "application/pdf"
                    ? $"/api/tickets/{savedAttachment.TicketId}/attachments/{savedAttachment.Id}/download?inline=true"
                    : null,
                AiSummary = savedAttachment.AiSummary,
                AiSummaryGeneratedAt = savedAttachment.AiSummaryGeneratedAt
            };
        }

        public async Task<bool> DeleteAttachmentAsync(Guid ticketId, Guid attachmentId, Guid requestingUserId, string requestingRole)
        {
            await EnsureCanMutateTicketAsync(ticketId, requestingUserId, requestingRole);

            var attachment = await _dbContext.TicketAttachments
                .FirstOrDefaultAsync(a => a.Id == attachmentId && a.TicketId == ticketId);
            if (attachment == null)
            {
                return false;
            }

            if (attachment.UploadedBy != requestingUserId && requestingRole != "Admin")
            {
                throw new UnauthorizedAccessException("Only the uploader or an Admin can delete this attachment.");
            }

            var physicalPath = ResolvePhysicalPath(attachment.FilePath);
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

        public async Task<(string PhysicalPath, string MimeType, string FileName)?> GetDownloadInfoAsync(Guid ticketId, Guid attachmentId, Guid requestingUserId, string requestingRole)
        {
            await EnsureCanViewTicketAsync(ticketId, requestingUserId, requestingRole);

            var attachment = await _dbContext.TicketAttachments
                .FirstOrDefaultAsync(a => a.Id == attachmentId && a.TicketId == ticketId);
            if (attachment == null)
            {
                return null;
            }

            var physicalPath = ResolvePhysicalPath(attachment.FilePath);
            if (!File.Exists(physicalPath))
            {
                return null;
            }

            return (physicalPath, attachment.MimeType, attachment.FileName);
        }

        private async Task EnsureCanViewTicketAsync(Guid ticketId, Guid userId, string role)
        {
            var ticket = await _dbContext.Tickets
                .Where(t => t.Id == ticketId)
                .Select(t => new { t.CreatedBy })
                .FirstOrDefaultAsync();

            if (ticket == null) throw new InvalidOperationException("Ticket not found.");
            if (role == "Employee" && ticket.CreatedBy != userId)
                throw new UnauthorizedAccessException("You can only access attachments on your own tickets.");
        }

        private async Task EnsureCanMutateTicketAsync(Guid ticketId, Guid userId, string role)
        {
            var ticket = await _dbContext.Tickets
                .Where(t => t.Id == ticketId)
                .Select(t => new { t.CreatedBy })
                .FirstOrDefaultAsync();

            if (ticket == null) throw new InvalidOperationException("Ticket not found.");
            if (role is "Employee" or "Manager" && ticket.CreatedBy != userId)
                throw new UnauthorizedAccessException("You can only modify attachments on tickets you created.");
        }

        private string GetStorageRoot()
        {
            var configured = _configuration["Storage:RootPath"];
            return string.IsNullOrWhiteSpace(configured)
                ? Path.Combine(_env.ContentRootPath, "App_Data")
                : Path.GetFullPath(configured);
        }

        private string ResolvePhysicalPath(string relativePath)
        {
            var protectedPath = Path.GetFullPath(Path.Combine(GetStorageRoot(), relativePath));
            var protectedRoot = Path.GetFullPath(GetStorageRoot()) + Path.DirectorySeparatorChar;
            if (!protectedPath.StartsWith(protectedRoot, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Invalid attachment path.");

            if (File.Exists(protectedPath)) return protectedPath;

            // Backward-compatible read path for files created before protected storage was introduced.
            var legacyPath = Path.GetFullPath(Path.Combine(_env.WebRootPath, relativePath));
            var webRoot = Path.GetFullPath(_env.WebRootPath) + Path.DirectorySeparatorChar;
            if (!legacyPath.StartsWith(webRoot, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Invalid attachment path.");
            return legacyPath;
        }

        private static async Task<string> ValidateFileContentAsync(IFormFile file)
        {
            var header = new byte[Math.Min(512, (int)file.Length)];
            await using var stream = file.OpenReadStream();
            var read = await stream.ReadAsync(header.AsMemory(0, header.Length));
            return file.ContentType.ToLowerInvariant() switch
            {
                "image/jpeg" when HasPrefix(header, read, 0xFF, 0xD8, 0xFF) => ".jpg",
                "image/png" when HasPrefix(header, read, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A) => ".png",
                "image/gif" when Encoding.ASCII.GetString(header, 0, Math.Min(6, read)) is "GIF87a" or "GIF89a" => ".gif",
                "application/pdf" when Encoding.ASCII.GetString(header, 0, Math.Min(4, read)) == "%PDF" => ".pdf",
                "application/msword" when HasPrefix(header, read, 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1) => ".doc",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" when HasPrefix(header, read, 0x50, 0x4B, 0x03, 0x04) => ".docx",
                "text/plain" when Array.IndexOf(header, (byte)0, 0, read) < 0 => ".txt",
                _ => throw new InvalidOperationException("File content does not match the declared file type.")
            };
        }

        private static bool HasPrefix(byte[] data, int length, params byte[] signature)
        {
            if (length < signature.Length) return false;
            for (var index = 0; index < signature.Length; index++)
            {
                if (data[index] != signature[index]) return false;
            }
            return true;
        }

        private static string EscapeJson(string value)
        {
            return value.Replace("\\", "\\\\").Replace("\"", "\\\"");
        }
    }
}
