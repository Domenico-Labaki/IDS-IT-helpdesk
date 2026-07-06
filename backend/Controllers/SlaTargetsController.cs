using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/sla-targets")]
    [Authorize(Policy = "AdminOnly")]
    public class SlaTargetsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public SlaTargetsController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var targets = await _dbContext.SlaTargets
                .Include(t => t.Priority)
                .OrderBy(t => t.Priority.Level)
                .Select(t => new SlaTargetDto
                {
                    Id = t.Id,
                    PriorityId = t.PriorityId,
                    PriorityName = t.Priority.Name,
                    TargetHours = t.TargetHours
                })
                .ToListAsync();

            return Ok(targets);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateSlaTargetDto dto)
        {
            var target = await _dbContext.SlaTargets.FindAsync(id);
            if (target == null) return NotFound();

            if (dto.TargetHours < 1)
                return BadRequest(new { message = "Target hours must be at least 1." });

            target.TargetHours = dto.TargetHours;
            await _dbContext.SaveChangesAsync();

            return NoContent();
        }
    }
}
