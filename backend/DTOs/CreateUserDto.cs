using System.ComponentModel.DataAnnotations;

namespace HelpdeskApi.DTOs
{
    public class CreateUserDto
    {
        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        [Required]
        [Range(1, int.MaxValue)]
        public int RoleId { get; set; }

        public string? Department { get; set; }
    }
}