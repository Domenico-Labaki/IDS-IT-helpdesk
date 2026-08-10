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
        private readonly IWebHostEnvironment _env;

        public ProfileController(IProfileService profileService, JwtHelper jwtHelper, IWebHostEnvironment env)
        {
            _profileService = profileService;
            _jwtHelper = jwtHelper;
            _env = env;
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

        [HttpPost("avatar")]
        [RequestSizeLimit(5 * 1024 * 1024)] // 5 MB
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
                return Unauthorized();

            var allowedMimeTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (file == null || file.Length == 0)
                return BadRequest("No file provided.");

            if (!allowedMimeTypes.Contains(file.ContentType.ToLowerInvariant()))
                return BadRequest("Only JPEG, PNG, GIF, and WebP images are allowed.");

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest("File size must be less than 5 MB.");

            var uploadsDir = Path.Combine(_env.WebRootPath, "avatars");
            Directory.CreateDirectory(uploadsDir);

            var ext = await GetValidatedAvatarExtensionAsync(file);
            if (ext == null)
                return BadRequest("File content does not match the declared image type.");
            var fileName = $"{userId}{ext}";
            var filePath = Path.Combine(uploadsDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var avatarUrl = $"/avatars/{fileName}";
            await _profileService.UpdateAvatarAsync(userId.Value, avatarUrl);

            return Ok(new { avatarUrl });
        }

        [HttpDelete("avatar")]
        public async Task<IActionResult> DeleteAvatar()
        {
            var userId = _jwtHelper.GetUserIdFromToken(User);
            if (userId == null)
                return Unauthorized();

            var existing = await _profileService.GetAvatarPathAsync(userId.Value);
            if (!string.IsNullOrEmpty(existing))
            {
                var filePath = Path.Combine(_env.WebRootPath, existing.TrimStart('/'));
                if (System.IO.File.Exists(filePath))
                    System.IO.File.Delete(filePath);
            }

            await _profileService.UpdateAvatarAsync(userId.Value, null);

            return NoContent();
        }

        private static async Task<string?> GetValidatedAvatarExtensionAsync(IFormFile file)
        {
            var header = new byte[Math.Min(16, (int)file.Length)];
            await using var stream = file.OpenReadStream();
            var read = await stream.ReadAsync(header.AsMemory());
            bool Prefix(params byte[] signature)
            {
                if (read < signature.Length) return false;
                for (var index = 0; index < signature.Length; index++)
                    if (header[index] != signature[index]) return false;
                return true;
            }

            return file.ContentType.ToLowerInvariant() switch
            {
                "image/jpeg" when Prefix(0xFF, 0xD8, 0xFF) => ".jpg",
                "image/png" when Prefix(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A) => ".png",
                "image/gif" when Prefix(0x47, 0x49, 0x46, 0x38) => ".gif",
                "image/webp" when Prefix(0x52, 0x49, 0x46, 0x46)
                    && read >= 12
                    && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50 => ".webp",
                _ => null
            };
        }
    }
}
