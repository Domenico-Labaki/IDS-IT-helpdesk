using HelpdeskApi.DTOs;
using HelpdeskApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/priorities")]
    public class PrioritiesController : ControllerBase
    {
        private readonly ITicketService _ticketService;

        public PrioritiesController(ITicketService ticketService)
        {
            _ticketService = ticketService;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            var priorities = await _ticketService.GetPrioritiesAsync();
            return Ok(priorities);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreatePriorityDto dto)
        {
            var priority = await _ticketService.CreatePriorityAsync(dto.Name, dto.Level);
            return CreatedAtAction(nameof(GetAll), priority);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] CreatePriorityDto dto)
        {
            var priority = await _ticketService.UpdatePriorityAsync(id, dto.Name, dto.Level);
            return priority == null ? NotFound() : Ok(priority);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var deleted = await _ticketService.DeletePriorityAsync(id);
                return deleted ? NoContent() : NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
