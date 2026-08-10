using HelpdeskApi.Data;
using HelpdeskApi.Models;
using HelpdeskApi.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Mail;

namespace HelpdeskApi.Services
{
    public class EmailService : IEmailService
    {
        private readonly SmtpSettings _smtpSettings;
        private readonly AppDbContext _dbContext;
        private readonly ILogger<EmailService> _logger;

        public EmailService(Microsoft.Extensions.Options.IOptions<SmtpSettings> smtpSettings, AppDbContext dbContext, ILogger<EmailService> logger)
        {
            _smtpSettings = smtpSettings?.Value ?? new SmtpSettings();
            _dbContext = dbContext;
            _logger = logger;
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetLink)
        {
            if (!HostConfigured()) return;

            var companyName = await GetCompanyNameAsync();
            var subject = "Reset your password — " + companyName;
            var body = $"<p>Hello {WebUtility.HtmlEncode(toName)},</p><p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href=\"{resetLink}\">Reset your password</a></p>";

            await SendEmailAsync(toEmail, toName, subject, body);
        }

        public async Task SendTicketCreatedEmailAsync(string toEmail, string toName, string referenceNumber, string title, string ticketUrl)
        {
            if (!HostConfigured() || !await EmailNotificationsEnabled()) return;

            var (subject, body) = await ResolveTemplateAsync("New Ticket Created", new()
            {
                ["{Name}"] = toName,
                ["{ReferenceNumber}"] = referenceNumber,
                ["{Title}"] = title,
                ["{TicketUrl}"] = ticketUrl
            }, $"[{referenceNumber}] Ticket Created — {{Company}}", $"<p>Hello {WebUtility.HtmlEncode(toName)},</p><p>Your ticket has been created successfully.</p><p><strong>{WebUtility.HtmlEncode(referenceNumber)}</strong> — {WebUtility.HtmlEncode(title)}</p><p><a href=\"{ticketUrl}\">View your ticket</a></p>");

            await SendEmailAsync(toEmail, toName, subject, body);
        }

        public async Task SendTicketAssignedEmailAsync(string toEmail, string toName, string referenceNumber, string title, string ticketUrl)
        {
            if (!HostConfigured() || !await EmailNotificationsEnabled()) return;

            var (subject, body) = await ResolveTemplateAsync("Ticket Assigned", new()
            {
                ["{Name}"] = toName,
                ["{ReferenceNumber}"] = referenceNumber,
                ["{Title}"] = title,
                ["{TicketUrl}"] = ticketUrl
            }, $"[{referenceNumber}] Ticket Assigned — {{Company}}", $"<p>Hello {WebUtility.HtmlEncode(toName)},</p><p>Ticket <strong>{WebUtility.HtmlEncode(referenceNumber)}</strong> has been assigned to you.</p><p>{WebUtility.HtmlEncode(title)}</p><p><a href=\"{ticketUrl}\">View assigned ticket</a></p>");

            await SendEmailAsync(toEmail, toName, subject, body);
        }

        public async Task SendTicketStatusChangedEmailAsync(string toEmail, string toName, string referenceNumber, string title, string newStatus, string ticketUrl)
        {
            if (!HostConfigured() || !await EmailNotificationsEnabled()) return;

            var (subject, body) = await ResolveTemplateAsync("Ticket Updated", new()
            {
                ["{Name}"] = toName,
                ["{ReferenceNumber}"] = referenceNumber,
                ["{Title}"] = title,
                ["{NewStatus}"] = newStatus,
                ["{TicketUrl}"] = ticketUrl
            }, $"[{referenceNumber}] Status Updated — {{Company}}", $"<p>Hello {WebUtility.HtmlEncode(toName)},</p><p>Your ticket <strong>{WebUtility.HtmlEncode(referenceNumber)}</strong> status has changed to <strong>{WebUtility.HtmlEncode(newStatus)}</strong>.</p><p>{WebUtility.HtmlEncode(title)}</p><p><a href=\"{ticketUrl}\">View your ticket</a></p>");

            await SendEmailAsync(toEmail, toName, subject, body);
        }

        public async Task SendNewCommentEmailAsync(string toEmail, string toName, string referenceNumber, string title, string commenterName, string ticketUrl)
        {
            if (!HostConfigured() || !await EmailNotificationsEnabled()) return;

            var (subject, body) = await ResolveTemplateAsync("Ticket Updated", new()
            {
                ["{Name}"] = toName,
                ["{ReferenceNumber}"] = referenceNumber,
                ["{Title}"] = title,
                ["{CommenterName}"] = commenterName,
                ["{NewStatus}"] = "New Comment",
                ["{TicketUrl}"] = ticketUrl
            }, $"[{referenceNumber}] New Comment — {{Company}}", $"<p>Hello {WebUtility.HtmlEncode(toName)},</p><p>{WebUtility.HtmlEncode(commenterName)} added a comment to ticket <strong>{WebUtility.HtmlEncode(referenceNumber)}</strong>.</p><p>{WebUtility.HtmlEncode(title)}</p><p><a href=\"{ticketUrl}\">View the comment</a></p>");

            await SendEmailAsync(toEmail, toName, subject, body);
        }

        private async Task<(string Subject, string Body)> ResolveTemplateAsync(
            string templateName,
            Dictionary<string, string> placeholders,
            string defaultSubject,
            string defaultBody)
        {
            try
            {
                var template = await _dbContext.EmailTemplates
                    .FirstOrDefaultAsync(t => t.Name == templateName);

                if (template == null) return (defaultSubject, defaultBody);

                var companyName = await GetCompanyNameAsync();
                var allPlaceholders = new Dictionary<string, string>(placeholders)
                {
                    ["{Company}"] = companyName
                };

                var subject = template.Subject;
                var body = template.Body;
                foreach (var (key, value) in allPlaceholders)
                {
                    subject = subject.Replace(key, WebUtility.HtmlEncode(value));
                    body = body.Replace(key, WebUtility.HtmlEncode(value));
                }

                return (subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load email template '{Name}', falling back to default", templateName);
                return (defaultSubject, defaultBody);
            }
        }

        private bool HostConfigured() => !string.IsNullOrWhiteSpace(_smtpSettings.Host);

        private async Task<string> GetCompanyNameAsync()
        {
            try
            {
                var setting = await _dbContext.SystemSettings.FirstOrDefaultAsync(s => s.Key == "companyName");
                return setting?.Value ?? "IT Help Desk";
            }
            catch
            {
                return "IT Help Desk";
            }
        }

        private async Task<string> GetSupportEmailAsync()
        {
            try
            {
                var setting = await _dbContext.SystemSettings.FirstOrDefaultAsync(s => s.Key == "supportEmail");
                return setting?.Value ?? _smtpSettings.FromEmail;
            }
            catch
            {
                return _smtpSettings.FromEmail;
            }
        }

        private async Task<bool> EmailNotificationsEnabled()
        {
            try
            {
                var setting = await _dbContext.SystemSettings.FirstOrDefaultAsync(s => s.Key == "emailNotifications");
                return setting?.Value != "false";
            }
            catch
            {
                return true;
            }
        }

        private async Task SendEmailAsync(string toEmail, string toName, string subject, string body)
        {
            try
            {
                var fromEmail = _smtpSettings.FromEmail;
                var fromName = await GetCompanyNameAsync();

                using var message = new MailMessage
                {
                    From = new MailAddress(fromEmail, fromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };

                var replyTo = await GetSupportEmailAsync();
                if (!string.IsNullOrEmpty(replyTo) && replyTo != fromEmail)
                {
                    message.ReplyToList.Add(new MailAddress(replyTo));
                }

                message.To.Add(new MailAddress(toEmail, toName));

                using var smtpClient = CreateSmtpClient();
                await smtpClient.SendMailAsync(message);
            }
            catch (Exception ex)
            {
                // Email is a secondary notification. A delivery outage must not make an
                // already-committed ticket or platform action appear to have failed.
                _logger.LogWarning(ex, "Email delivery failed; the primary platform operation was retained.");
            }
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
