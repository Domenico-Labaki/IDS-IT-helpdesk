namespace HelpdeskApi.Models
{
    public class Role
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }

        // Navigation properties
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
