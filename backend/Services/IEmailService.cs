namespace HelpdeskApi.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetLink);
        Task SendTicketCreatedEmailAsync(string toEmail, string toName, string referenceNumber, string title, string ticketUrl);
        Task SendTicketAssignedEmailAsync(string toEmail, string toName, string referenceNumber, string title, string ticketUrl);
        Task SendTicketStatusChangedEmailAsync(string toEmail, string toName, string referenceNumber, string title, string newStatus, string ticketUrl);
        Task SendNewCommentEmailAsync(string toEmail, string toName, string referenceNumber, string title, string commenterName, string ticketUrl);
    }
}