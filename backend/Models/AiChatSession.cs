namespace HelpdeskApi.Models
{
    public class AiChatSession
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public User User { get; set; } = null!;
        public ICollection<AiChatMessage> Messages { get; set; } = new List<AiChatMessage>();
        public ICollection<AiAgentAction> Actions { get; set; } = new List<AiAgentAction>();
    }
}
