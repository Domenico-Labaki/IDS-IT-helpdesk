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
    }
}
