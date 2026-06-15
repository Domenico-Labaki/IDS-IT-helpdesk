using HelpdeskApi.Helpers;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Mail;

namespace HelpdeskApi.Services
{
    public class EmailService : IEmailService
    {
        private readonly SmtpSettings _smtpSettings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(Microsoft.Extensions.Options.IOptions<SmtpSettings> smtpSettings, ILogger<EmailService> logger)
        {
            _smtpSettings = smtpSettings?.Value ?? new SmtpSettings();
            _logger = logger;
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetLink)
        {
            if (string.IsNullOrWhiteSpace(_smtpSettings.Host))
            {
                _logger.LogWarning("SMTP host is not configured. Skipping password reset email for {Email}.", toEmail);
                return;
            }

            using var message = new MailMessage
            {
                From = new MailAddress(_smtpSettings.FromEmail, _smtpSettings.FromName),
                Subject = "Reset your password — IT Help Desk",
                Body = $"<p>Hello {WebUtility.HtmlEncode(toName)},</p><p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href=\"{resetLink}\">Reset your password</a></p>",
                IsBodyHtml = true
            };

            message.To.Add(new MailAddress(toEmail, toName));

            using var smtpClient = CreateSmtpClient();
            await smtpClient.SendMailAsync(message);
        }

        public async Task SendTicketCreatedEmailAsync(string toEmail, string toName, string referenceNumber, string title, string ticketUrl)
        {
            if (string.IsNullOrWhiteSpace(_smtpSettings.Host)) return;

            using var message = new MailMessage
            {
                From = new MailAddress(_smtpSettings.FromEmail, _smtpSettings.FromName),
                Subject = $"[{referenceNumber}] Ticket Created — IT Help Desk",
                Body = $"<p>Hello {WebUtility.HtmlEncode(toName)},</p><p>Your ticket has been created successfully.</p><p><strong>{WebUtility.HtmlEncode(referenceNumber)}</strong> — {WebUtility.HtmlEncode(title)}</p><p><a href=\"{ticketUrl}\">View your ticket</a></p>",
                IsBodyHtml = true
            };

            message.To.Add(new MailAddress(toEmail, toName));

            using var smtpClient = CreateSmtpClient();
            await smtpClient.SendMailAsync(message);
        }

        public async Task SendTicketAssignedEmailAsync(string toEmail, string toName, string referenceNumber, string title, string ticketUrl)
        {
            if (string.IsNullOrWhiteSpace(_smtpSettings.Host)) return;

            using var message = new MailMessage
            {
                From = new MailAddress(_smtpSettings.FromEmail, _smtpSettings.FromName),
                Subject = $"[{referenceNumber}] Ticket Assigned — IT Help Desk",
                Body = $"<p>Hello {WebUtility.HtmlEncode(toName)},</p><p>Ticket <strong>{WebUtility.HtmlEncode(referenceNumber)}</strong> has been assigned to you.</p><p>{WebUtility.HtmlEncode(title)}</p><p><a href=\"{ticketUrl}\">View assigned ticket</a></p>",
                IsBodyHtml = true
            };

            message.To.Add(new MailAddress(toEmail, toName));

            using var smtpClient = CreateSmtpClient();
            await smtpClient.SendMailAsync(message);
        }

        public async Task SendTicketStatusChangedEmailAsync(string toEmail, string toName, string referenceNumber, string title, string newStatus, string ticketUrl)
        {
            if (string.IsNullOrWhiteSpace(_smtpSettings.Host)) return;

            using var message = new MailMessage
            {
                From = new MailAddress(_smtpSettings.FromEmail, _smtpSettings.FromName),
                Subject = $"[{referenceNumber}] Status Updated — IT Help Desk",
                Body = $"<p>Hello {WebUtility.HtmlEncode(toName)},</p><p>Your ticket <strong>{WebUtility.HtmlEncode(referenceNumber)}</strong> status has changed to <strong>{WebUtility.HtmlEncode(newStatus)}</strong>.</p><p>{WebUtility.HtmlEncode(title)}</p><p><a href=\"{ticketUrl}\">View your ticket</a></p>",
                IsBodyHtml = true
            };

            message.To.Add(new MailAddress(toEmail, toName));

            using var smtpClient = CreateSmtpClient();
            await smtpClient.SendMailAsync(message);
        }

        public async Task SendNewCommentEmailAsync(string toEmail, string toName, string referenceNumber, string title, string commenterName, string ticketUrl)
        {
            if (string.IsNullOrWhiteSpace(_smtpSettings.Host)) return;

            using var message = new MailMessage
            {
                From = new MailAddress(_smtpSettings.FromEmail, _smtpSettings.FromName),
                Subject = $"[{referenceNumber}] New Comment — IT Help Desk",
                Body = $"<p>Hello {WebUtility.HtmlEncode(toName)},</p><p>{WebUtility.HtmlEncode(commenterName)} added a comment to ticket <strong>{WebUtility.HtmlEncode(referenceNumber)}</strong>.</p><p>{WebUtility.HtmlEncode(title)}</p><p><a href=\"{ticketUrl}\">View the comment</a></p>",
                IsBodyHtml = true
            };

            message.To.Add(new MailAddress(toEmail, toName));

            using var smtpClient = CreateSmtpClient();
            await smtpClient.SendMailAsync(message);
        }

        private SmtpClient CreateSmtpClient()
        {
            return new SmtpClient(_smtpSettings.Host, _smtpSettings.Port)
            {
                EnableSsl = true,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(_smtpSettings.Username, _smtpSettings.Password)
            };
        }
    }
}