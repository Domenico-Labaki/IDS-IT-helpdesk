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
                Body = $"<p>Hello {WebUtility.HtmlEncode(toName)},</p><p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href=\"{WebUtility.HtmlEncode(resetLink)}\">Reset your password</a></p>",
                IsBodyHtml = true
            };

            message.To.Add(new MailAddress(toEmail, toName));

            using var smtpClient = new SmtpClient(_smtpSettings.Host, _smtpSettings.Port)
            {
                EnableSsl = true,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(_smtpSettings.Username, _smtpSettings.Password)
            };

            await smtpClient.SendMailAsync(message);
        }
    }
}