using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using HelpdeskApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Services
{
    public class AiService : IAiService
    {
        private const string GroqApiUrl = "https://api.groq.com/openai/v1/chat/completions";

        private const string ModelCategorization = "llama-3.3-70b-versatile";
        private const string ModelPriority = "llama-3.3-70b-versatile";
        private const string ModelReply = "llama-3.3-70b-versatile";
        private const string ModelVision = "meta-llama/llama-4-scout-17b-16e-instruct";
        private const string ModelChat = "llama-3.3-70b-versatile";

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            PropertyNameCaseInsensitive = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _dbContext;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<AiService> _logger;

        public AiService(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            AppDbContext dbContext,
            IWebHostEnvironment env,
            ILogger<AiService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _dbContext = dbContext;
            _env = env;
            _logger = logger;
        }

        public async Task<SuggestCategoryResponse> SuggestCategoryAsync(SuggestCategoryRequest request)
        {
            var categories = await _dbContext.Categories.OrderBy(c => c.Id).ToListAsync();
            var categoryList = string.Join("\n", categories.Select(c => $"{c.Id} - {c.Name} ({c.Description})"));

            var systemPrompt = $@"You are an IT helpdesk ticket classifier. Categorize the ticket into exactly one of these categories:
{categoryList}

Examples:
Title: ""Monitor screen is flickering"" Description: ""Dell monitor flickers intermittently since this morning"" -> categoryId: 1 (Hardware)
Title: ""Excel keeps crashing"" Description: ""Excel crashes when opening large files, error message 'Excel has stopped working'"" -> categoryId: 2 (Software)
Title: ""Cannot connect to company VPN"" Description: ""VPN client returns error 800 since last night, unable to work remotely"" -> categoryId: 3 (Network)
Title: ""Need SAP access for new hire"" Description: ""New employee John in accounting needs SAP read-only access by next week"" -> categoryId: 4 (Access Request)
Title: ""Password reset link not working"" Description: ""Clicked forgot password, received the email but the link says expired"" -> categoryId: 4 (Access Request)
Title: ""Outlook not sending emails"" Description: ""Outlook shows 'send error' for past 2 hours, receiving works fine"" -> categoryId: 6 (Email)

Respond with JSON: {{ ""categoryId"": number, ""reasoning"": string, ""confidence"": number (0.0 to 1.0) }}";

            var userPrompt = $"Title: {request.Title}\nDescription: {request.Description}";

            var heuristic = SuggestCategoryByKeywords(request.Title, request.Description, categories);
            if (heuristic != null)
            {
                return heuristic;
            }

            var response = await CallGroqJsonAsync(ModelCategorization, systemPrompt, userPrompt, maxTokens: 300, temperature: 0.3);

            var raw = TryParseContent<CategoryResult>(response);
            if (raw == null || raw.Confidence < 0.3)
            {
                throw new InvalidOperationException("AI could not determine a suitable category for this ticket. Please select manually.");
            }

            var category = categories.FirstOrDefault(c => c.Id == raw.CategoryId);
            if (category == null)
            {
                _logger.LogWarning("AI suggested categoryId {Id} which does not exist.", raw.CategoryId);
                throw new InvalidOperationException("AI suggested an invalid category. Please select manually.");
            }

            return new SuggestCategoryResponse
            {
                CategoryId = category.Id,
                CategoryName = category.Name,
                Confidence = Math.Clamp(raw.Confidence, 0, 1),
                Reasoning = raw.Reasoning ?? string.Empty
            };
        }

        public async Task<SuggestPriorityResponse> SuggestPriorityAsync(SuggestPriorityRequest request)
        {
            var priorities = await _dbContext.Priorities.OrderBy(p => p.Level).ToListAsync();
            var priorityList = string.Join("\n", priorities.Select(p => $"{p.Id} - {p.Name} (Level {p.Level})"));

            var systemPrompt = $@"You are an IT helpdesk priority assessor. Given a ticket's title, description, and category, assign a priority level:
{priorityList}

Consider urgency language, scope of impact, and business continuity.

Examples:
Title: ""Company website is completely down"" Description: ""Entire website returns 503 for all visitors, customers cannot access our services"" Category: Network -> priorityId: 4 (Critical)
Title: ""Cannot log into email"" Description: ""Outlook not accepting password since this morning, need to check work emails"" Category: Email -> priorityId: 3 (High)
Title: ""Need Adobe Creative Cloud license"" Description: ""Need extended license renewal for design team before next sprint"" Category: Software -> priorityId: 2 (Medium)
Title: ""Keyboard not working"" Description: ""USB keyboard at desk 14 stopped working, have spare from IT closet"" Category: Hardware -> priorityId: 1 (Low)
Title: ""VPN down for entire office"" Description: ""No remote access since 9 AM, 200+ employees affected company-wide"" Category: Network -> priorityId: 4 (Critical)
Title: ""SAP account expired"" Description: ""Can't log into SAP, need access renewal for monthly reporting"" Category: Access Request -> priorityId: 2 (Medium)

Respond with JSON: {{ ""priorityId"": number, ""reasoning"": string, ""confidence"": number (0.0 to 1.0) }}";

            var userPrompt = $"Title: {request.Title}\nDescription: {request.Description}\nCategoryId: {request.CategoryId}";

            var heuristic = SuggestPriorityByKeywords(request.Title, request.Description, priorities);
            if (heuristic != null)
            {
                return heuristic;
            }

            var response = await CallGroqJsonAsync(ModelPriority, systemPrompt, userPrompt, maxTokens: 300, temperature: 0.3);

            var raw = TryParseContent<PriorityResult>(response);
            if (raw == null || raw.Confidence < 0.3)
            {
                throw new InvalidOperationException("AI could not determine a suitable priority for this ticket. Please select manually.");
            }

            var priority = priorities.FirstOrDefault(p => p.Id == raw.PriorityId);
            if (priority == null)
            {
                _logger.LogWarning("AI suggested priorityId {Id} which does not exist.", raw.PriorityId);
                throw new InvalidOperationException("AI suggested an invalid priority. Please select manually.");
            }

            return new SuggestPriorityResponse
            {
                PriorityId = priority.Id,
                PriorityName = priority.Name,
                Confidence = Math.Clamp(raw.Confidence, 0, 1),
                Reasoning = raw.Reasoning ?? string.Empty
            };
        }

        public async Task<SuggestReplyResponse> SuggestReplyAsync(SuggestReplyRequest request)
        {
            var ticket = await _dbContext.Tickets
                .Include(t => t.Category)
                .Include(t => t.Priority)
                .Include(t => t.Status)
                .Include(t => t.Comments)
                    .ThenInclude(c => c.Author)
                .FirstOrDefaultAsync(t => t.Id == request.TicketId);

            if (ticket == null)
            {
                throw new InvalidOperationException("Ticket not found.");
            }

            var commentHistory = string.Join("\n",
                ticket.Comments
                    .Where(c => !c.IsInternal)
                    .OrderBy(c => c.CreatedAt)
                    .Select(c => $"{c.Author.FullName}: {c.Body}"));

            var context = $"Ticket #{ticket.ReferenceNumber}\nTitle: {ticket.Title}\nDescription: {ticket.Description}\nCategory: {ticket.Category.Name}\nPriority: {ticket.Priority.Name}\nStatus: {ticket.Status.Name}";

            if (!string.IsNullOrWhiteSpace(commentHistory))
            {
                context += $"\n\nConversation history:\n{commentHistory}";
            }

            var systemPrompt = "You are an IT helpdesk agent drafting a reply to a ticket. Write a **specific** reply that directly addresses the issue described — avoid generic or boilerplate language. Reference concrete details from the ticket title, description, and any previous comments. If the issue seems resolved, confirm with specifics. If more info is needed, ask about exact missing details (e.g., error messages, steps attempted, affected systems). Provide clear actionable next steps tailored to the situation. Respond with JSON: { \"suggestedBody\": string (the full reply text), \"reasoning\": string (brief explanation of your approach) }";

            var userPrompt = context;

            var response = await CallGroqJsonAsync(ModelReply, systemPrompt, userPrompt, maxTokens: 500);

            var raw = TryParseContent<ReplyResult>(response);
            return new SuggestReplyResponse
            {
                SuggestedBody = raw?.SuggestedBody ?? "I've reviewed your ticket and am looking into this. I'll follow up with more details shortly.",
                Reasoning = raw?.Reasoning ?? string.Empty
            };
        }

        public async Task<ScanAttachmentResponse> ScanAttachmentAsync(Guid attachmentId)
        {
            var attachment = await _dbContext.TicketAttachments.FindAsync(attachmentId);
            if (attachment == null)
            {
                throw new InvalidOperationException("Attachment not found.");
            }

            var allowedImageTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "image/jpeg", "image/png", "image/gif"
            };

            if (!allowedImageTypes.Contains(attachment.MimeType))
            {
                throw new InvalidOperationException("Attachment scanning is only supported for image files (JPEG, PNG, GIF).");
            }

            var physicalPath = Path.Combine(_env.WebRootPath, attachment.FilePath);
            if (!File.Exists(physicalPath))
            {
                throw new InvalidOperationException("Attachment file not found on disk.");
            }

            var imageBytes = await File.ReadAllBytesAsync(physicalPath);
            var base64Image = Convert.ToBase64String(imageBytes);
            var mimeType = attachment.MimeType;

            var systemPrompt = "You are an IT support image analyst. Describe what you see in this image in the context of an IT support ticket. Extract any visible error messages, error codes, UI elements, numbers, or relevant details. Respond with JSON: { \"summary\": string (2-3 sentences describing the image and its relevance), \"detectedIssues\": string[] (list of specific issues or notable items found) }";

            var response = await CallGroqVisionJsonAsync(ModelVision, systemPrompt, base64Image, mimeType, maxTokens: 500);

            var raw = TryParseContent<ScanResult>(response);
            var summary = raw?.Summary ?? "No summary could be generated for this image.";
            var detectedIssues = raw?.DetectedIssues ?? new List<string>();

            attachment.AiSummary = summary;
            attachment.AiSummaryGeneratedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            return new ScanAttachmentResponse
            {
                Summary = summary,
                DetectedIssues = detectedIssues
            };
        }

        public async IAsyncEnumerable<string> ChatStreamAsync(AiChatRequest request, Guid userId, [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var apiKey = _configuration["Groq:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                yield return "AI chat is not configured. Please set the Groq API key in your environment configuration.";
                yield break;
            }

            var messages = new List<GroqMessage>();
            var userContext = "";
            var user = await _dbContext.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user != null)
            {
                var openTickets = await _dbContext.Tickets.CountAsync(t => t.CreatedBy == userId && t.StatusId == 1, cancellationToken);
                var assignedTickets = user.Role.Name is "Agent" or "Admin"
                    ? await _dbContext.Tickets.CountAsync(t => t.AssignedTo == userId && t.StatusId == 1, cancellationToken)
                    : 0;

                userContext = $@"
## Current User Context
- **Name**: {user.FullName}
- **Email**: {user.Email}
- **Role**: {user.Role.Name}
- **Your open tickets**: {openTickets}
- **Tickets assigned to you**: {assignedTickets}
";
            }

            var systemContent = $@"You are an AI assistant for the IDS IT Helpdesk platform. Your role is to help users understand how to USE the platform itself — not to resolve their actual IT tickets.
{userContext}
## Platform Overview
- **Roles**: Admin (full access), Agent (triage & assign), Manager (oversight + reports), Employee (create/view own tickets)
- **Ticket statuses**: Open → In Progress → Pending/Resolved → Closed/Cancelled
- **Categories**: Hardware, Software, Network, Access Request, Email, Other
- **Priorities**: Low (1), Medium (2), High (3), Critical (4)
- **SLA targets**: Critical=4h, High=8h, Medium=24h, Low=72h

## Available Features
- Create, view, edit, and delete tickets
- Comment on tickets (internal notes visible only to agents/admins)
- Upload attachments (images, PDFs, docs — max 10MB)
- Dashboard with ticket stats, charts, and SLA compliance
- Reports (Admin and Manager only)
- User management (Admin only)
- System settings, email templates, escalation rules (Admin only)
- Real-time notifications via SignalR

## Guidelines
- Answer concisely and helpfully about how to use the platform
- If asked about resolving actual IT issues, gently redirect: 'Please create a ticket describing your issue so an agent can help you.'
- Do not attempt to diagnose or resolve technical problems
- If you don't know the answer, suggest checking the documentation or contacting an administrator";

            messages.Add(new GroqMessage { Role = "system", Content = systemContent });

            if (request.History != null)
            {
                foreach (var msg in request.History)
                {
                    messages.Add(new GroqMessage { Role = msg.Role, Content = msg.Content });
                }
            }

            messages.Add(new GroqMessage { Role = "user", Content = request.Message });

            var body = new GroqRequest
            {
                Model = ModelChat,
                Messages = messages,
                Temperature = 0.3,
                MaxTokens = 1000,
                Stream = true
            };

            var httpClient = _httpClientFactory.CreateClient();
            var httpRequest = new HttpRequestMessage(HttpMethod.Post, GroqApiUrl)
            {
                Content = new StringContent(JsonSerializer.Serialize(body, JsonOptions), Encoding.UTF8, "application/json")
            };
            httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

            using var httpResponse = await httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

            if (!httpResponse.IsSuccessStatusCode)
            {
                var errorBody = await httpResponse.Content.ReadAsStringAsync(cancellationToken);

                if ((int)httpResponse.StatusCode == 429)
                {
                    var retryAfterSeconds = 5;
                    var delta = httpResponse.Headers.RetryAfter?.Delta;
                    if (delta.HasValue)
                    {
                        retryAfterSeconds = (int)Math.Ceiling(delta.Value.TotalSeconds);
                    }

                    _logger.LogWarning("Groq chat stream rate limited. Retry after {Seconds}s.", retryAfterSeconds);
                    yield return $"The AI assistant is temporarily busy (rate limit reached). Please wait {retryAfterSeconds} seconds and try again.";
                    yield break;
                }

                _logger.LogError("Groq API returned {StatusCode}: {Error}", httpResponse.StatusCode, errorBody);
                yield return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
                yield break;
            }

            using var stream = await httpResponse.Content.ReadAsStreamAsync(cancellationToken);
            using var reader = new StreamReader(stream);

            while (true)
            {
                var line = await reader.ReadLineAsync(cancellationToken);
                if (line == null) break;
                if (string.IsNullOrWhiteSpace(line)) continue;

                if (!line.StartsWith("data: ")) continue;

                var data = line[6..];

                if (data == "[DONE]") break;

                var content = TryParseStreamChunk(data);
                if (!string.IsNullOrEmpty(content))
                {
                    yield return content;
                }
            }
        }

        private async Task<string> CallGroqJsonAsync(string model, string systemPrompt, string userPrompt, int? maxTokens = null, double temperature = 0.1)
        {
            var body = new GroqRequest
            {
                Model = model,
                Messages = new List<GroqMessage>
                {
                    new() { Role = "system", Content = systemPrompt },
                    new() { Role = "user", Content = userPrompt }
                },
                ResponseFormat = new GroqResponseFormat { Type = "json_object" },
                Temperature = temperature,
                MaxTokens = maxTokens
            };

            return await SendGroqRequestAsync(body);
        }

        private async Task<string> CallGroqVisionJsonAsync(string model, string systemPrompt, string base64Image, string mimeType, int? maxTokens = null)
        {
            var body = new GroqRequest
            {
                Model = model,
                Messages = new List<GroqMessage>
                {
                    new() { Role = "system", Content = systemPrompt },
                    new()
                    {
                        Role = "user",
                        Content = new List<GroqContentPart>
                        {
                            new() { Type = "text", Text = "Analyze this image and provide the requested information." },
                            new() { Type = "image_url", ImageUrl = new GroqImageUrl { Url = $"data:{mimeType};base64,{base64Image}" } }
                        }
                    }
                },
                ResponseFormat = new GroqResponseFormat { Type = "json_object" },
                Temperature = 0.1,
                MaxTokens = maxTokens
            };

            return await SendGroqRequestAsync(body);
        }

        private async Task<string> SendGroqRequestAsync(GroqRequest body)
        {
            var apiKey = _configuration["Groq:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new InvalidOperationException("Groq API key is not configured. Set it in your .env file as Groq__ApiKey=your_key_here.");
            }

            const int maxAttempts = 3;
            var attempt = 0;

            while (true)
            {
                attempt++;

                var httpClient = _httpClientFactory.CreateClient();
                var requestBody = JsonSerializer.Serialize(body, JsonOptions);

                _logger.LogDebug("Groq request (attempt {Attempt}/{Max}): {Body}", attempt, maxAttempts, requestBody);

                var httpRequest = new HttpRequestMessage(HttpMethod.Post, GroqApiUrl)
                {
                    Content = new StringContent(requestBody, Encoding.UTF8, "application/json")
                };
                httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

                using var httpResponse = await httpClient.SendAsync(httpRequest);

                if (httpResponse.IsSuccessStatusCode)
                {
                    var responseBody = await httpResponse.Content.ReadAsStringAsync();

                    _logger.LogDebug("Groq response: {Body}", responseBody);

                    try
                    {
                        var groqResponse = JsonSerializer.Deserialize<GroqApiResponse>(responseBody, JsonOptions);
                        return groqResponse?.Choices?.FirstOrDefault()?.Message?.Content ?? string.Empty;
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogError(ex, "Failed to parse Groq response");
                        return string.Empty;
                    }
                }

                if ((int)httpResponse.StatusCode == 429)
                {
                    var retryAfterSeconds = 5;
                    var delta = httpResponse.Headers.RetryAfter?.Delta;
                    if (delta.HasValue)
                    {
                        retryAfterSeconds = (int)Math.Ceiling(delta.Value.TotalSeconds);
                    }

                    if (attempt < maxAttempts)
                    {
                        _logger.LogWarning("Groq API rate limited (attempt {Attempt}/{Max}). Retrying after {Seconds}s.", attempt, maxAttempts, retryAfterSeconds);
                        await Task.Delay(TimeSpan.FromSeconds(retryAfterSeconds));
                        continue;
                    }

                    _logger.LogError("Groq API rate limited after {Attempt} attempts.", attempt);
                    throw new GroqRateLimitException(
                        $"AI service is temporarily busy. Please wait {retryAfterSeconds} seconds and try again.",
                        retryAfterSeconds);
                }

                var errorBody = await httpResponse.Content.ReadAsStringAsync();
                _logger.LogError("Groq API returned {StatusCode}: {Error}", httpResponse.StatusCode, errorBody);
                throw new InvalidOperationException($"AI service returned an error ({(int)httpResponse.StatusCode}). Please try again later.");
            }
        }

        private static T? TryParseContent<T>(string content) where T : class
        {
            if (string.IsNullOrWhiteSpace(content)) return null;

            try
            {
                var cleaned = content.Trim();
                if (cleaned.StartsWith("```json")) cleaned = cleaned[7..];
                if (cleaned.StartsWith("```")) cleaned = cleaned[3..];
                if (cleaned.EndsWith("```")) cleaned = cleaned[..^3];
                cleaned = cleaned.Trim();

                return JsonSerializer.Deserialize<T>(cleaned, JsonOptions);
            }
            catch (JsonException)
            {
                return null;
            }
        }

        private string? TryParseStreamChunk(string data)
        {
            try
            {
                var chunk = JsonSerializer.Deserialize<GroqStreamChunk>(data, JsonOptions);
                return chunk?.Choices?.FirstOrDefault()?.Delta?.Content;
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to parse streaming chunk: {Data}", data);
                return null;
            }
        }

        private static SuggestCategoryResponse? SuggestCategoryByKeywords(string title, string description, List<Category> categories)
        {
            var text = $"{title} {description}".ToLowerInvariant();

            var rules = new (string[] Keywords, string CategoryName)[]
            {
                (["email", "outlook", "exchange", "mail", "send", "receive", "inbox", "spam", "phishing", "e-mail"], "Email"),
                (["network", "wifi", "connect", "vpn", "internet", "dns", "ip", "connection", "offline", "unreachable"], "Network"),
                (["access", "permission", "login", "password", "account", "authenticate", "role", "unauthorized", "credential", "sign in", "sign-in"], "Access Request"),
                (["hardware", "monitor", "keyboard", "mouse", "printer", "laptop", "computer", "screen", "usb", "cable", "battery", "charge", "scanner", "headset", "docking"], "Hardware"),
                (["software", "install", "update", "upgrade", "crash", "error", "bug", "app", "program", "version", "license", "office", "windows", "excel", "word", "teams", "slack", "zoom"], "Software")
            };

            foreach (var (keywords, categoryName) in rules)
            {
                if (keywords.Any(k => text.Contains(k, StringComparison.Ordinal)))
                {
                    var cat = categories.FirstOrDefault(c => c.Name == categoryName);
                    if (cat != null)
                    {
                        return new SuggestCategoryResponse
                        {
                            CategoryId = cat.Id,
                            CategoryName = cat.Name,
                            Confidence = 0.5,
                            Reasoning = $"Keyword match: detected terms related to '{cat.Name}'"
                        };
                    }
                }
            }

            return null;
        }

        private static SuggestPriorityResponse? SuggestPriorityByKeywords(string title, string description, List<Priority> priorities)
        {
            var text = $"{title} {description}".ToLowerInvariant();

            var critical = new[] { "critical", "emergency", "outage", "all users", "company-wide", "everyone", "cannot work", "production down", "site down", "data loss", "security breach" };
            foreach (var keyword in critical)
            {
                if (text.Contains(keyword, StringComparison.Ordinal))
                {
                    var pri = priorities.FirstOrDefault(p => p.Level == 4);
                    if (pri != null)
                    {
                        return new SuggestPriorityResponse
                        {
                            PriorityId = pri.Id,
                            PriorityName = pri.Name,
                            Confidence = 0.5,
                            Reasoning = "Keyword match: urgency terms indicate critical impact"
                        };
                    }
                }
            }

            var high = new[] { "urgent", "blocked", "deadline", "cannot access", "stuck", "not working", "broken", "as soon as possible", "important", "down" };
            foreach (var keyword in high)
            {
                if (text.Contains(keyword, StringComparison.Ordinal))
                {
                    var pri = priorities.FirstOrDefault(p => p.Level == 3);
                    if (pri != null)
                    {
                        return new SuggestPriorityResponse
                        {
                            PriorityId = pri.Id,
                            PriorityName = pri.Name,
                            Confidence = 0.5,
                            Reasoning = "Keyword match: urgency terms indicate high priority"
                        };
                    }
                }
            }

            return null;
        }

        private class CategoryResult
        {
            public int CategoryId { get; set; }
            public string? Reasoning { get; set; }
            public double Confidence { get; set; }
        }

        private class PriorityResult
        {
            public int PriorityId { get; set; }
            public string? Reasoning { get; set; }
            public double Confidence { get; set; }
        }

        private class ReplyResult
        {
            public string? SuggestedBody { get; set; }
            public string? Reasoning { get; set; }
        }

        private class ScanResult
        {
            public string? Summary { get; set; }
            public List<string>? DetectedIssues { get; set; }
        }

        private class GroqRequest
        {
            public string Model { get; set; } = string.Empty;
            public List<GroqMessage> Messages { get; set; } = new();
            public GroqResponseFormat? ResponseFormat { get; set; }
            public double Temperature { get; set; } = 0.1;
            public int? MaxTokens { get; set; }
            public bool? Stream { get; set; }
        }

        private class GroqMessage
        {
            public string Role { get; set; } = string.Empty;
            public object Content { get; set; } = string.Empty;
        }

        private class GroqContentPart
        {
            public string Type { get; set; } = string.Empty;
            public string? Text { get; set; }
            public GroqImageUrl? ImageUrl { get; set; }
        }

        private class GroqImageUrl
        {
            public string Url { get; set; } = string.Empty;
        }

        private class GroqResponseFormat
        {
            public string Type { get; set; } = "json_object";
        }

        private class GroqApiResponse
        {
            public List<GroqChoice>? Choices { get; set; }
        }

        private class GroqChoice
        {
            public GroqMessageContent? Message { get; set; }
        }

        private class GroqMessageContent
        {
            public string? Content { get; set; }
        }

        private class GroqStreamChunk
        {
            public List<GroqStreamChoice>? Choices { get; set; }
        }

        private class GroqStreamChoice
        {
            public GroqStreamDelta? Delta { get; set; }
        }

        private class GroqStreamDelta
        {
            public string? Content { get; set; }
        }
    }
}
