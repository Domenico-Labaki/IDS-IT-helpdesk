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
        public List<AiChatMessageDto>? History { get; set; }
    }
}
