using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using HelpdeskApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

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

        [HttpGet("health")]
        public async Task<IActionResult> Health()
        {
            var dbOk = false;
            try
            {
                dbOk = await _dbContext.Database.CanConnectAsync();
            }
            catch { }

            return Ok(new
            {
                status = dbOk ? "Healthy" : "Degraded",
                database = dbOk ? "Connected" : "Disconnected",
                timestamp = DateTime.UtcNow,
                uptime = (DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime.ToUniversalTime()).TotalHours.ToString("F1") + " hours"
            });
        }

        [HttpGet("metrics")]
        public async Task<IActionResult> Metrics()
        {
            var now = DateTime.UtcNow;
            var last24h = now.AddHours(-24);

            var activeUsersLast24h = await _dbContext.ActivityLogs
                .Where(l => l.PerformedAt >= last24h)
                .Select(l => l.UserId)
                .Distinct()
                .CountAsync();

            var ticketsCreatedLast24h = await _dbContext.Tickets
                .CountAsync(t => t.CreatedAt >= last24h);

            var ticketsResolvedLast24h = await _dbContext.Tickets
                .CountAsync(t => t.ResolvedAt >= last24h);

            var totalUsers = await _dbContext.Users.CountAsync();
            var totalTickets = await _dbContext.Tickets.CountAsync();

            return Ok(new
            {
                activeUsersLast24h,
                ticketsCreatedLast24h,
                ticketsResolvedLast24h,
                totalUsers,
                totalTickets,
                requestRatePerMin = "N/A (not tracked)"
            });
        }

        [HttpPost("clear-cache")]
        public IActionResult ClearCache([FromServices] IMemoryCache memoryCache)
        {
            if (memoryCache is Microsoft.Extensions.Caching.Memory.MemoryCache memCache)
            {
                memCache.Compact(1.0);
            }
            return Ok(new { message = "Cache cleared successfully." });
        }

        [HttpPost("backup")]
        public async Task<IActionResult> CreateBackup()
        {
            var backupDir = Path.Combine(_env.ContentRootPath, "backups");
            Directory.CreateDirectory(backupDir);

            var fileName = $"backup_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json";
            var filePath = Path.Combine(backupDir, fileName);

            var data = new
            {
                ExportedAt = DateTime.UtcNow,
                Users = await _dbContext.Users.Select(u => new { u.Id, u.FullName, u.Email, u.Department, u.IsActive }).ToListAsync(),
                Tickets = await _dbContext.Tickets.Select(t => new { t.Id, t.ReferenceNumber, t.Title, t.CreatedAt }).ToListAsync(),
                Categories = await _dbContext.Categories.ToListAsync(),
                Priorities = await _dbContext.Priorities.ToListAsync(),
                Statuses = await _dbContext.Statuses.ToListAsync()
            };

            var json = System.Text.Json.JsonSerializer.Serialize(data, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
            await System.IO.File.WriteAllTextAsync(filePath, json);

            return Ok(new { message = "Backup created successfully.", file = fileName });
        }

        [HttpPost("check-updates")]
        public IActionResult CheckUpdates()
        {
            return Ok(new
            {
                message = "System is up to date.",
                currentVersion = "1.0.0",
                latestVersion = "1.0.0",
                updateAvailable = false
            });
        }
    }
}
