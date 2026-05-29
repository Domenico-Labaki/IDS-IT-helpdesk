using System.ComponentModel.DataAnnotations;

namespace HelpdeskApi.DTOs
{
    public class ForgotPasswordRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}