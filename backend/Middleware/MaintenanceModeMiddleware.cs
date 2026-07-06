using HelpdeskApi.Data;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Middleware
{
    public class MaintenanceModeMiddleware
    {
        private readonly RequestDelegate _next;
        private static bool? _cachedMaintenanceMode;
        private static DateTime _cacheExpiry = DateTime.MinValue;

        public MaintenanceModeMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
        {
            // Skip for health checks and static files
            if (context.Request.Path.StartsWithSegments("/api/admin/system/health") ||
                context.Request.Path.StartsWithSegments("/health") ||
                context.Request.Method == "OPTIONS")
            {
                await _next(context);
                return;
            }

            bool isMaintenanceMode;
            if (DateTime.UtcNow < _cacheExpiry && _cachedMaintenanceMode.HasValue)
            {
                isMaintenanceMode = _cachedMaintenanceMode.Value;
            }
            else
            {
                try
                {
                    var setting = await dbContext.SystemSettings
                        .FirstOrDefaultAsync(s => s.Key == "maintenanceMode");
                    isMaintenanceMode = setting?.Value == "true";
                    _cachedMaintenanceMode = isMaintenanceMode;
                    _cacheExpiry = DateTime.UtcNow.AddSeconds(30);
                }
                catch
                {
                    isMaintenanceMode = false;
                }
            }

            if (isMaintenanceMode)
            {
                var user = context.User;
                var isAdmin = user?.Identity?.IsAuthenticated == true &&
                    user.IsInRole("Admin");

                if (!isAdmin)
                {
                    context.Response.StatusCode = 503;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(
                        "{\"message\":\"System is currently under maintenance. Please try again later.\"}");
                    return;
                }
            }

            await _next(context);
        }
    }
}
