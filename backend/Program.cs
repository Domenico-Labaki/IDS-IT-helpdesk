using System.Net;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using HelpdeskApi.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using DotNetEnv;
using HelpdeskApi.Data;
using HelpdeskApi.Helpers;
using QuestPDF.Infrastructure;

var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (File.Exists(envPath))
{
    Env.Load(envPath);
}

var builder = WebApplication.CreateBuilder(args);

// Web processes may not have permission to create or write Windows Event Log sources.
// Keep logging portable and prevent a logging failure from aborting HTTP requests.
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// Add services to the container

// 1. DbContext with Npgsql
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Bind settings using the options pattern for safe DI and future rotation
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("SmtpSettings"));
builder.Services.AddDataProtection();

// Keep helper lifetimes scoped so they can consume request-scoped dependencies like DbContext
builder.Services.AddSingleton<JwtHelper>();
builder.Services.AddScoped<IPasswordHelper, PasswordHelper>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<ITicketCommentService, TicketCommentService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAttachmentService, AttachmentService>();
builder.Services.AddScoped<IAutoAssignmentService, AutoAssignmentService>();
builder.Services.AddScoped<IReportExportService, ReportExportService>();
builder.Services.AddScoped<IEscalationService, EscalationService>();
builder.Services.AddHostedService<EscalationBackgroundService>();
builder.Services.AddScoped<IAiService, AiService>();
builder.Services.AddHttpClient();
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
});
builder.Services.AddAutoMapper(cfg => { }, typeof(HelpdeskApi.MappingProfiles.MappingProfile));

// 3. JWT Bearer Authentication
var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? string.Empty;
if (string.IsNullOrEmpty(jwtSecret) || jwtSecret.Length < 32)
{
    throw new InvalidOperationException("JwtSettings:Secret is not configured or is too short. Must be at least 32 characters.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnTokenValidated = async ctx =>
            {
                var userIdClaim = ctx.Principal?.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                {
                    ctx.Fail("Invalid token");
                    return;
                }

                var db = ctx.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                var user = await db.Users.FindAsync(userId);
                if (user == null || !user.IsActive)
                {
                    ctx.Fail("User not found or inactive");
                    return;
                }

                var tokenVersionClaim = ctx.Principal?.FindFirst("tokenVersion")?.Value ?? "0";
                if (!int.TryParse(tokenVersionClaim, out var tokenVersion) || user.TokenVersion != tokenVersion)
                {
                    ctx.Fail("Token has been revoked");
                    return;
                }
            }
        };

        options.Events.OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/notifications"))
            {
                context.Token = accessToken;
            }

            if (string.IsNullOrEmpty(context.Token))
            {
                var cookieToken = context.Request.Cookies["token"];
                if (!string.IsNullOrEmpty(cookieToken))
                {
                    context.Token = cookieToken;
                }
            }

            return Task.CompletedTask;
        };
    });

// 4. Authorization Policies for roles
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"))
    .AddPolicy("AgentOrAbove", policy => policy.RequireRole("Admin", "Agent"))
    .AddPolicy("ManagerOrAbove", policy => policy.RequireRole("Admin", "Manager"))
    .AddPolicy("AllAuthenticated", policy => policy.RequireAuthenticatedUser());

// 5. CORS configuration (use explicit allowed origins and allow credentials for refresh cookie)
var allowedOrigins = builder.Configuration.GetValue<string>("AllowedCorsOrigins")
    ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// 6. Per-client rate limiting for authentication and AI endpoints
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("AuthPolicy", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        }));
    options.AddPolicy("AiPolicy", context => RateLimitPartition.GetFixedWindowLimiter(
        context.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? context.Connection.RemoteIpAddress?.ToString()
            ?? "anonymous",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 15,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        }));
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// 7. Swagger/OpenAPI with JWT Bearer security definition
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "IT Help Desk API",
        Version = "v1",
        Description = "ASP.NET Core Web API for IT Help Desk System"
    });

    // Add JWT Bearer security definition
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "JWT Authorization header using the Bearer scheme."
    });

    // Add security requirement
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// 8. SignalR
builder.Services.AddSignalR();

// 9. Controllers
builder.Services.AddControllers();

// 9. HttpContextAccessor as singleton
builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();

// Build the app
var app = builder.Build();

QuestPDF.Settings.License = LicenseType.Community;

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(dbContext);

    if (app.Environment.IsDevelopment() && app.Configuration.GetValue<bool>("SeedTestData"))
    {
        await DbSeeder.SeedTestDataAsync(dbContext);
    }
}

// Middleware pipeline
app.UseForwardedHeaders();

// Enable Swagger only in Development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

// Global exception handling
app.UseExceptionHandler(appError =>
{
    appError.Run(async context =>
    {
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        context.Response.ContentType = "application/json";
        var contextFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        if (contextFeature != null)
        {
            var message = app.Environment.IsDevelopment()
                ? contextFeature.Error.Message
                : "An internal error occurred.";
            await context.Response.WriteAsJsonAsync(new { message });
        }
    });
});

// Only enable HTTPS redirection if an HTTPS endpoint is configured to avoid the "Failed to determine the https port" warning
var urlsFromEnv = builder.Configuration["ASPNETCORE_URLS"];
var kestrelHttps = builder.Configuration.GetValue<string>("Kestrel:Endpoints:Https:Url");
var hasHttps = (!string.IsNullOrEmpty(urlsFromEnv) && urlsFromEnv.Contains("https", StringComparison.OrdinalIgnoreCase))
               || (!string.IsNullOrEmpty(kestrelHttps) && kestrelHttps.Contains("https", StringComparison.OrdinalIgnoreCase));
if (!app.Environment.IsDevelopment() || hasHttps)
{
    app.UseHttpsRedirection();
}

app.Use(async (context, next) =>
{
    context.Response.Headers.XContentTypeOptions = "nosniff";
    context.Response.Headers.XFrameOptions = "DENY";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'; object-src 'none'";
    }

    // Ticket uploads are served only by the authorized download endpoint.
    if (context.Request.Path.StartsWithSegments("/uploads"))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    await next();
});
app.UseStaticFiles();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.UseMiddleware<HelpdeskApi.Middleware.MaintenanceModeMiddleware>();
app.MapControllers();
app.MapHub<HelpdeskApi.Hubs.NotificationsHub>("/hubs/notifications");

app.Run();
