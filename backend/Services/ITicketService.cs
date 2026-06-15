using HelpdeskApi.DTOs;

namespace HelpdeskApi.Services
{
    public interface ITicketService
    {
        Task<List<TicketResponseDto>> GetAllTicketsAsync(Guid requestingUserId, string role, int page = 1, int pageSize = 50);
        Task<TicketResponseDto?> GetTicketByIdAsync(Guid ticketId, Guid requestingUserId, string role);
        Task<TicketResponseDto> CreateTicketAsync(TicketCreateDto dto, Guid createdByUserId);
        Task<TicketResponseDto?> UpdateTicketAsync(Guid ticketId, TicketUpdateDto dto, Guid requestingUserId, string role);
        Task<bool> DeleteTicketAsync(Guid ticketId);
        Task<AssignTicketResponse?> AssignTicketAsync(Guid ticketId, Guid assignedToUserId, Guid assignedByUserId);
        Task<bool> UnassignTicketAsync(Guid ticketId, Guid performedByUserId);
        Task<TicketStatusResponse?> UpdateTicketStatusAsync(Guid ticketId, int newStatusId, Guid changedByUserId, string? notes);
        Task<List<StatusHistoryEntry>> GetStatusHistoryAsync(Guid ticketId);
        Task<List<AssignmentHistoryEntry>> GetAssignmentHistoryAsync(Guid ticketId);
        Task<List<ActivityLogEntryDto>> GetTicketActivityLogsAsync(Guid ticketId);
        Task<PagedResult<ActivityLogEntryDto>> GetActivityLogsAsync(Guid? userId, string? entityType, DateTime? from, DateTime? to, int page, int pageSize);
        Task<List<CategoryDto>> GetCategoriesAsync();
        Task<List<PriorityDto>> GetPrioritiesAsync();
        Task<List<StatusDto>> GetStatusesAsync();
    }
}
