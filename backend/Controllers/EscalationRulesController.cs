using HelpdeskApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/admin/escalation-rules")]
    [Authorize(Roles = "Admin")]
    public class EscalationRulesController : ControllerBase
    {
        private readonly IEscalationService _escalationService;

        public EscalationRulesController(IEscalationService escalationService)
        {
            _escalationService = escalationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var rules = await _escalationService.GetAllRulesAsync();
            return Ok(rules.Select(r => new
            {
                r.Id,
                r.Name,
                r.PriorityId,
                PriorityName = r.Priority?.Name ?? "",
                r.TriggerHours,
                r.TargetRoleId,
                TargetRoleName = r.TargetRole?.Name ?? "",
                r.EscalateToRoleId,
                EscalateToRoleName = r.EscalateToRole?.Name ?? "",
                r.IsActive
            }));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEscalationRuleRequest dto)
        {
            var rule = await _escalationService.CreateRuleAsync(dto.Name, dto.PriorityId, dto.TriggerHours, dto.TargetRoleId, dto.EscalateToRoleId);
            return CreatedAtAction(nameof(GetAll), new { id = rule.Id }, rule);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateEscalationRuleRequest dto)
        {
            var rule = await _escalationService.UpdateRuleAsync(id, dto.Name, dto.PriorityId, dto.TriggerHours, dto.TargetRoleId, dto.EscalateToRoleId, dto.IsActive);
            return rule == null ? NotFound() : Ok(rule);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _escalationService.DeleteRuleAsync(id);
            return deleted ? NoContent() : NotFound();
        }
    }

    public class CreateEscalationRuleRequest
    {
        public string Name { get; set; } = string.Empty;
        public int PriorityId { get; set; }
        public int TriggerHours { get; set; }
        public int? TargetRoleId { get; set; }
        public int? EscalateToRoleId { get; set; }
    }

    public class UpdateEscalationRuleRequest
    {
        public string Name { get; set; } = string.Empty;
        public int PriorityId { get; set; }
        public int TriggerHours { get; set; }
        public int? TargetRoleId { get; set; }
        public int? EscalateToRoleId { get; set; }
        public bool IsActive { get; set; }
    }
}
