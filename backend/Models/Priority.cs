namespace HelpdeskApi.Models
{
    public class Priority
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int Level { get; set; }

        // Navigation properties
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}
