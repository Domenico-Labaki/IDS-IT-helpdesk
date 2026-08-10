using HelpdeskApi.DTOs;

namespace HelpdeskApi.Services
{
    public interface IAiService
    {
        Task<SuggestCategoryResponse> SuggestCategoryAsync(SuggestCategoryRequest request);

        Task<SuggestPriorityResponse> SuggestPriorityAsync(SuggestPriorityRequest request);

        Task<SuggestReplyResponse> SuggestReplyAsync(SuggestReplyRequest request);

        Task<ScanAttachmentResponse> ScanAttachmentAsync(Guid attachmentId, Guid userId, string role);

        IAsyncEnumerable<AiStreamEvent> ChatStreamAsync(AiChatRequest request, Guid userId, CancellationToken cancellationToken = default);

        // Session management
        Task<List<AiSessionDto>> GetSessionsAsync(Guid userId);

        Task<AiSessionDto> CreateSessionAsync(Guid userId, CreateSessionRequest request);

        Task<AiSessionDto> UpdateSessionAsync(Guid sessionId, Guid userId, UpdateSessionRequest request);

        Task DeleteSessionAsync(Guid sessionId, Guid userId);

        Task<List<AiMessageDto>> GetSessionMessagesAsync(Guid sessionId, Guid userId);

        Task<List<AiAgentActionDto>> GetSessionActionsAsync(Guid sessionId, Guid userId);

        Task<AiAgentActionDto> ConfirmActionAsync(Guid actionId, Guid userId, CancellationToken cancellationToken = default);

        Task<AiAgentActionDto> RejectActionAsync(Guid actionId, Guid userId, CancellationToken cancellationToken = default);
    }
}
