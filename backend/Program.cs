using Microsoft.AspNetCore.Authentication.JwtBearer;
using HelpdeskApi.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using DotNetEnv;
using HelpdeskApi.Data;
using HelpdeskApi.Helpers;
using System.Text;
using System.IO;
using System;

var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (File.Exists(envPath))
{
    Env.Load(envPath);
}

var builder = WebApplication.CreateBuilder(args);

// Add services to the container

// 1. DbContext with Npgsql
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Bind and register concrete settings instances for helper injection
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>() ?? new JwtSettings();
var smtpSettings = builder.Configuration.GetSection("SmtpSettings").Get<SmtpSettings>() ?? new SmtpSettings();

builder.Services.AddSingleton(jwtSettings);
builder.Services.AddSingleton(smtpSettings);

// TODO: Keep helper lifetimes scoped so they can consume request-safe dependencies.
builder.Services.AddScoped<JwtHelper>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IUserService, UserService>();

// 3. JWT Bearer Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

// 4. Authorization Policies for roles
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"))
    .AddPolicy("AgentOrAbove", policy => policy.RequireRole("Admin", "Agent"))
    .AddPolicy("ManagerOrAbove", policy => policy.RequireRole("Admin", "Manager"))
    .AddPolicy("AllAuthenticated", policy => policy.RequireAuthenticatedUser());

// 5. CORS configuration (dev config — tighten in production)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// 6. Swagger/OpenAPI with JWT Bearer security definition
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

// 7. Controllers
builder.Services.AddControllers();

// 8. HttpContextAccessor as singleton
builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();

// Build the app
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(dbContext);
}

// Middleware pipeline
// Enable Swagger in Development or when explicitly enabled via configuration
var enableSwagger = builder.Configuration.GetValue<bool>("EnableSwagger", false);
if (app.Environment.IsDevelopment() || enableSwagger)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Only enable HTTPS redirection if an HTTPS endpoint is configured to avoid the "Failed to determine the https port" warning
var urlsFromEnv = builder.Configuration["ASPNETCORE_URLS"];
var kestrelHttps = builder.Configuration.GetValue<string>("Kestrel:Endpoints:Https:Url");
var hasHttps = (!string.IsNullOrEmpty(urlsFromEnv) && urlsFromEnv.Contains("https", StringComparison.OrdinalIgnoreCase))
               || (!string.IsNullOrEmpty(kestrelHttps) && kestrelHttps.Contains("https", StringComparison.OrdinalIgnoreCase));
if (hasHttps)
{
    app.UseHttpsRedirection();
}
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
