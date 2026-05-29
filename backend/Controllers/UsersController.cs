using HelpdeskApi.DTOs;
using HelpdeskApi.Helpers;
using HelpdeskApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize(Policy = "AdminOnly")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly JwtHelper _jwtHelper;

        public UsersController(IUserService userService, JwtHelper jwtHelper)
        {
            _userService = userService;
            _jwtHelper = jwtHelper;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userService.GetAllAsync();
            return Ok(users);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var user = await _userService.GetByIdAsync(id);
            return user == null ? NotFound() : Ok(user);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
        {
            var createdBy = _jwtHelper.GetUserIdFromToken(User);
            if (createdBy == null)
            {
                return Unauthorized();
            }

            try
            {
                var user = await _userService.CreateAsync(dto, createdBy.Value);
                return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
            }
            catch (InvalidOperationException ex) when (ex.Message == "Email already in use.")
            {
                return Conflict(new { message = ex.Message });
            }
            catch (ArgumentException ex) when (ex.Message == "Password does not meet complexity requirements.")
            {
                return BadRequest(new { message = "Password does not meet complexity requirements." });
            }
            catch (ArgumentException ex) when (ex.Message == "Invalid role.")
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id:guid}/toggle-active")]
        public async Task<IActionResult> ToggleActive(Guid id)
        {
            var updated = await _userService.ToggleActiveAsync(id);
            return updated ? NoContent() : NotFound();
        }
    }
}