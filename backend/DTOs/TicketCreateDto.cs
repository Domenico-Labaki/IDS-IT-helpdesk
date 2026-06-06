using System.ComponentModel.DataAnnotations;

namespace HelpdeskApi.DTOs
{
    public class TicketCreateDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public int CategoryId { get; set; }

        [Required]
        public int PriorityId { get; set; }
    }
}
