namespace HelpdeskApi.DTOs
{
    public class PriorityCountDto
    {
        public string PriorityName { get; set; } = string.Empty;
        public int Level { get; set; }
        public int Count { get; set; }
    }
}
