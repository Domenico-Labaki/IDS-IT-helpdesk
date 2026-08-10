namespace HelpdeskApi.Models
{
    public class AiChatMessage
    {
        public Guid Id { get; set; }
        public Guid SessionId { get; set; }
        public Guid TurnId { get; set; }
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? ToolCallsJson { get; set; }
        public string? ToolCallId { get; set; }
        public string? ToolName { get; set; }
        public string? ToolResultJson { get; set; }
        public DateTime CreatedAt { get; set; }

        public AiChatSession Session { get; set; } = null!;
    }
}
