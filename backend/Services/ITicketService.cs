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
        Task<List<CategoryDto>> GetCategoriesAsync();
        Task<List<PriorityDto>> GetPrioritiesAsync();
        Task<List<StatusDto>> GetStatusesAsync();
    }
}
