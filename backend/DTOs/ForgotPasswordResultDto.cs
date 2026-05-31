namespace HelpdeskApi.DTOs
{
    public class ForgotPasswordResultDto
    {
        public string Message { get; set; } = string.Empty;
        public string? DevResetLink { get; set; }
    }
}
