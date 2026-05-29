using System.ComponentModel.DataAnnotations;

namespace HelpdeskApi.DTOs
{
    public class UpdateProfileDto
    {
        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? Department { get; set; }
    }
}