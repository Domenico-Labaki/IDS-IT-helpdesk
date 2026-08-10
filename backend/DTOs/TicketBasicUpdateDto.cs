using System.ComponentModel.DataAnnotations;

namespace HelpdeskApi.DTOs
{
    public class TicketBasicUpdateDto
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(4000)]
        public string Description { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int CategoryId { get; set; }

        [Range(1, int.MaxValue)]
        public int PriorityId { get; set; }
    }
}
