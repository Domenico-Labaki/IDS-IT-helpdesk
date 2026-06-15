using HelpdeskApi.DTOs;

namespace HelpdeskApi.Services
{
    public interface ITicketCommentService
    {
        Task<List<CommentResponse>?> GetCommentsAsync(Guid ticketId, Guid requestingUserId, string requestingUserRole);
        Task<CommentResponse> AddCommentAsync(Guid ticketId, Guid authorId, string body, bool isInternal, string requestingUserRole);
        Task<bool> DeleteCommentAsync(Guid commentId, Guid requestingUserId, string requestingUserRole);
    }
}
