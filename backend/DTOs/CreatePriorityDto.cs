namespace HelpdeskApi.DTOs
{
    public class CreatePriorityDto
    {
        public string Name { get; set; } = string.Empty;
        public int Level { get; set; }
    }
}
