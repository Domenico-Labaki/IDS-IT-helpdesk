using System.ComponentModel.DataAnnotations;

namespace HelpdeskApi.DTOs
{
    public class ChangePasswordRequestDto
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        public string NewPassword { get; set; } = string.Empty;
    }
}