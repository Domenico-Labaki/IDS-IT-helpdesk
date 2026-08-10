using System.ComponentModel.DataAnnotations;

namespace HelpdeskApi.DTOs
{
    public class UpdateUserDto
    {
        [Required, MaxLength(150)]
        public string FullName { get; set; } = string.Empty;
        [Required, EmailAddress, MaxLength(254)]
        public string Email { get; set; } = string.Empty;
        [MaxLength(100)]
        public string? Department { get; set; }
    }
}
