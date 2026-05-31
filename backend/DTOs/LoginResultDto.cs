namespace HelpdeskApi.DTOs
{
    public class LoginResultDto
    {
        public LoginResponseDto Response { get; set; } = new LoginResponseDto();
        // Raw refresh token (must be sent via HttpOnly cookie, not in JSON response)
        public string RawRefreshToken { get; set; } = string.Empty;
    }
}
