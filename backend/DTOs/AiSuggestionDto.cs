namespace HelpdeskApi.DTOs
{
    public class SuggestCategoryRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class SuggestCategoryResponse
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public string Reasoning { get; set; } = string.Empty;
    }

    public class SuggestPriorityRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int CategoryId { get; set; }
    }

    public class SuggestPriorityResponse
    {
        public int PriorityId { get; set; }
        public string PriorityName { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public string Reasoning { get; set; } = string.Empty;
    }

    public class SuggestReplyRequest
    {
        public Guid TicketId { get; set; }
    }

    public class SuggestReplyResponse
    {
        public string SuggestedBody { get; set; } = string.Empty;
        public string Reasoning { get; set; } = string.Empty;
    }

    public class ScanAttachmentResponse
    {
        public string Summary { get; set; } = string.Empty;
        public List<string> DetectedIssues { get; set; } = new();
    }

    public class AiChatMessageDto
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }

    public class AiChatRequest
    {
        public string Message { get; set; } = string.Empty;
        public Guid? SessionId { get; set; }
        public List<AiChatMessageDto>? History { get; set; }
    }

    // Tool calling types
    public class AiStreamEvent
    {
        public string Type { get; set; } = string.Empty;
        public string? Content { get; set; }
        public AiToolCallDto? ToolCall { get; set; }
        public AiToolResultDto? ToolResult { get; set; }
        public AiSessionEvent? Session { get; set; }
    }

    public class AiToolCallDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public Dictionary<string, object>? Arguments { get; set; }
    }

    public class AiToolResultDto
    {
        public string ToolCallId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool Success { get; set; }
        public object? Result { get; set; }
        public string? Error { get; set; }
    }

    // Session management types
    public class AiSessionDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public int MessageCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateSessionRequest
    {
        public string Title { get; set; } = string.Empty;
    }

    public class UpdateSessionRequest
    {
        public string Title { get; set; } = string.Empty;
    }

    public class AiMessageDto
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
    }

    public class AiSessionEvent
    {
        public Guid SessionId { get; set; }
    }
}
