namespace HelpdeskApi.DTOs
{
    public class AgentPerformanceDto
    {
        public Guid AgentId { get; set; }
        public string AgentName { get; set; } = string.Empty;
        public int AssignedCount { get; set; }
        public int ResolvedCount { get; set; }
        public double AvgResolutionHours { get; set; }
    }
}
