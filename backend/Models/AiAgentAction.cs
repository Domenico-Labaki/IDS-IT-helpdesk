namespace HelpdeskApi.Models
{
    public class AiAgentAction
    {
        public Guid Id { get; set; }
        public Guid SessionId { get; set; }
        public Guid TurnId { get; set; }
        public Guid UserId { get; set; }
        public string ToolCallId { get; set; } = string.Empty;
        public string ToolName { get; set; } = string.Empty;
        public string ArgumentsJson { get; set; } = "{}";
        public string Summary { get; set; } = string.Empty;
        public string Status { get; set; } = AiAgentActionStatus.Pending;
        public string? ResultJson { get; set; }
        public string? Error { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime? ExecutedAt { get; set; }

        public AiChatSession Session { get; set; } = null!;
    }

    public static class AiAgentActionStatus
    {
        public const string Pending = "Pending";
        public const string Executing = "Executing";
        public const string Succeeded = "Succeeded";
        public const string Failed = "Failed";
        public const string Rejected = "Rejected";
        public const string Expired = "Expired";
    }
}
