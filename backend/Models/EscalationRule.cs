using System.ComponentModel.DataAnnotations;

namespace HelpdeskApi.Models
{
    public class EscalationRule
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public int PriorityId { get; set; }

        [Required]
        public int TriggerHours { get; set; }

        public int? TargetRoleId { get; set; }

        public int? EscalateToRoleId { get; set; }

        public bool IsActive { get; set; } = true;

        public Priority Priority { get; set; } = null!;
        public Role? TargetRole { get; set; }
        public Role? EscalateToRole { get; set; }
    }
}
