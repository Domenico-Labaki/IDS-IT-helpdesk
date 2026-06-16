using HelpdeskApi.DTOs;
using HelpdeskApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/statuses")]
    public class StatusesController : ControllerBase
    {
        private readonly ITicketService _ticketService;

        public StatusesController(ITicketService ticketService)
        {
            _ticketService = ticketService;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            var statuses = await _ticketService.GetStatusesAsync();
            return Ok(statuses);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateLookupDto dto)
        {
            var status = await _ticketService.CreateStatusAsync(dto.Name);
            return CreatedAtAction(nameof(GetAll), status);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateLookupDto dto)
        {
            var status = await _ticketService.UpdateStatusAsync(id, dto.Name);
            return status == null ? NotFound() : Ok(status);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var deleted = await _ticketService.DeleteStatusAsync(id);
                return deleted ? NoContent() : NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
