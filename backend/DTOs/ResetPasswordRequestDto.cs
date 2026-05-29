using System.ComponentModel.DataAnnotations;

namespace HelpdeskApi.DTOs
{
    public class ResetPasswordRequestDto
    {
        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        public string NewPassword { get; set; } = string.Empty;
    }
}