using System.ComponentModel.DataAnnotations;

namespace HelpdeskApi.Models
{
    public class SlaTarget
    {
        public int Id { get; set; }

        public int PriorityId { get; set; }

        [Required]
        public int TargetHours { get; set; }

        public Priority Priority { get; set; } = null!;
    }
}
