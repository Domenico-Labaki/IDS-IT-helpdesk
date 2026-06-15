using System.ComponentModel.DataAnnotations;

namespace HelpdeskApi.DTOs
{
    public class AddCommentRequest
    {
        [Required]
        [MaxLength(4000)]
        public string Body { get; set; } = string.Empty;

        public bool IsInternal { get; set; }
    }
}
