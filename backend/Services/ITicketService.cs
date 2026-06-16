using HelpdeskApi.DTOs;

namespace HelpdeskApi.Services
{
    public interface ITicketService
    {
        Task<PagedResult<TicketResponseDto>> GetAllTicketsAsync(Guid requestingUserId, string role, int page = 1, int pageSize = 50, string? searchText = null, int? categoryId = null, int? priorityId = null, int? statusId = null, Guid? assignedTo = null, DateTime? dateFrom = null, DateTime? dateTo = null, string? sortBy = null, string? sortOrder = null);
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
        Task<CategoryDto> CreateCategoryAsync(string name, string? description);
        Task<CategoryDto?> UpdateCategoryAsync(int id, string name, string? description);
        Task<bool> DeleteCategoryAsync(int id);
        Task<List<PriorityDto>> GetPrioritiesAsync();
        Task<PriorityDto> CreatePriorityAsync(string name, int level);
        Task<PriorityDto?> UpdatePriorityAsync(int id, string name, int level);
        Task<bool> DeletePriorityAsync(int id);
        Task<List<StatusDto>> GetStatusesAsync();
        Task<StatusDto> CreateStatusAsync(string name);
        Task<StatusDto?> UpdateStatusAsync(int id, string name);
        Task<bool> DeleteStatusAsync(int id);
    }
}
