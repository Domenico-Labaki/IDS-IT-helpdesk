using HelpdeskApi.DTOs;

namespace HelpdeskApi.Services
{
    public interface IAiService
    {
        Task<SuggestCategoryResponse> SuggestCategoryAsync(SuggestCategoryRequest request);

        Task<SuggestPriorityResponse> SuggestPriorityAsync(SuggestPriorityRequest request);

        Task<SuggestReplyResponse> SuggestReplyAsync(SuggestReplyRequest request);

        Task<ScanAttachmentResponse> ScanAttachmentAsync(Guid attachmentId);

        IAsyncEnumerable<string> ChatStreamAsync(AiChatRequest request, Guid userId, CancellationToken cancellationToken = default);
    }
}
