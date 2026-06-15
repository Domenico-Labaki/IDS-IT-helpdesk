using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using HelpdeskApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/admin/settings")]
    [Authorize(Roles = "Admin")]
    public class AdminSettingsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public AdminSettingsController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var settings = await _dbContext.SystemSettings.ToListAsync();
            var dict = settings.ToDictionary(s => s.Key, s => s.Value);
            return Ok(dict);
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] UpdateSettingsRequest request)
        {
            foreach (var setting in request.Settings)
            {
                var existing = await _dbContext.SystemSettings.FirstOrDefaultAsync(s => s.Key == setting.Key);
                if (existing != null)
                {
                    existing.Value = setting.Value;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    _dbContext.SystemSettings.Add(new SystemSetting
                    {
                        Key = setting.Key,
                        Value = setting.Value,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }

            await _dbContext.SaveChangesAsync();
            return NoContent();
        }
    }

    [ApiController]
    [Route("api/admin/email-templates")]
    [Authorize(Roles = "Admin")]
    public class EmailTemplatesController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public EmailTemplatesController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var templates = await _dbContext.EmailTemplates
                .OrderBy(t => t.Name)
                .Select(t => new EmailTemplateDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    Subject = t.Subject,
                    Body = t.Body
                })
                .ToListAsync();

            return Ok(templates);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateEmailTemplateRequest request)
        {
            var template = await _dbContext.EmailTemplates.FindAsync(id);
            if (template == null) return NotFound();

            template.Subject = request.Subject;
            template.Body = request.Body;
            template.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            return NoContent();
        }
    }

    [ApiController]
    [Route("api/admin/system")]
    [Authorize(Roles = "Admin")]
    public class SystemController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly IWebHostEnvironment _env;

        public SystemController(AppDbContext dbContext, IWebHostEnvironment env)
        {
            _dbContext = dbContext;
            _env = env;
        }

        [HttpGet("info")]
        public async Task<IActionResult> GetInfo()
        {
            var uploadsDir = Path.Combine(_env.WebRootPath, "uploads");
            var storageBytes = Directory.Exists(uploadsDir)
                ? Directory.GetFiles(uploadsDir, "*", SearchOption.AllDirectories).Sum(f => new FileInfo(f).Length)
                : 0;

            var storageMb = Math.Round(storageBytes / (1024.0 * 1024.0), 1);

            var info = new SystemInfoDto
            {
                Version = "1.0.0",
                LastUpdated = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                DatabaseStatus = "Healthy",
                StorageUsed = $"{storageMb} MB",
                StorageLimit = "10 GB",
                TotalUsers = await _dbContext.Users.CountAsync(),
                TotalTickets = await _dbContext.Tickets.CountAsync()
            };

            return Ok(info);
        }
    }
}
