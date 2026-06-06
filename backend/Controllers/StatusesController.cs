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
    }
}
