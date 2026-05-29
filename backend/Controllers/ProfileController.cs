using HelpdeskApi.DTOs;
using HelpdeskApi.Helpers;
using HelpdeskApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpdeskApi.Controllers
{
    [ApiController]
    [Route("api/profile")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;
        private readonly JwtHelper _jwtHelper;

        public ProfileController(IProfileService profileService, JwtHelper jwtHelper)
        {
            _profileService = profileService;
            _jwtHelper = jwtHelper;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var profile = await _profileService.GetProfileAsync(userId.Value);
            if (profile == null)
            {
                return NotFound();
            }

            return Ok(profile);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var profile = await _profileService.UpdateProfileAsync(userId.Value, dto);
            if (profile == null)
            {
                return NotFound();
            }

            return Ok(profile);
        }
    }
}