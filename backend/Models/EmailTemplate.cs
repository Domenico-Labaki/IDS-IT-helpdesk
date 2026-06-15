namespace HelpdeskApi.Models
{
    public class EmailTemplate
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; }
    }
}
