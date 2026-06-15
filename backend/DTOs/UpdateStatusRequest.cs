using System.ComponentModel.DataAnnotations;

namespace HelpdeskApi.DTOs
{
    public class UpdateStatusRequest
    {
        [Required]
        public int StatusId { get; set; }

        public string? Notes { get; set; }
    }
}
