using System.ComponentModel.DataAnnotations;

namespace HelpdeskApi.DTOs
{
    public class AssignTicketRequest
    {
        [Required]
        public Guid AssignedToUserId { get; set; }
    }
}
