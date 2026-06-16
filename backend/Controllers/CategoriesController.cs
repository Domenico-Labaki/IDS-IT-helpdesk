using HelpdeskApi.DTOs;
using HelpdeskApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/categories")]
    public class CategoriesController : ControllerBase
    {
        private readonly ITicketService _ticketService;

        public CategoriesController(ITicketService ticketService)
        {
            _ticketService = ticketService;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _ticketService.GetCategoriesAsync();
            return Ok(categories);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateLookupDto dto)
        {
            var category = await _ticketService.CreateCategoryAsync(dto.Name, dto.Description);
            return CreatedAtAction(nameof(GetAll), category);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateLookupDto dto)
        {
            var category = await _ticketService.UpdateCategoryAsync(id, dto.Name, dto.Description);
            return category == null ? NotFound() : Ok(category);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var deleted = await _ticketService.DeleteCategoryAsync(id);
                return deleted ? NoContent() : NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
