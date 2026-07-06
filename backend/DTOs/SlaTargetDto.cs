namespace HelpdeskApi.DTOs
{
    public class SlaTargetDto
    {
        public int Id { get; set; }
        public int PriorityId { get; set; }
        public string PriorityName { get; set; } = string.Empty;
        public int TargetHours { get; set; }
    }

    public class UpdateSlaTargetDto
    {
        public int TargetHours { get; set; }
    }
}
