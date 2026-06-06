using System.ComponentModel.DataAnnotations;

namespace HelpdeskApi.Models
{
    public class Priority
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        public int Level { get; set; }

        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}
