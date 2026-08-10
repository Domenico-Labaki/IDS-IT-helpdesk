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
        private readonly ITicketService _ticketService;
        private readonly ITicketCommentService _commentService;
        private readonly IUserService _userService;
        private readonly IDashboardService _dashboardService;
        private readonly INotificationService _notificationService;

        public AiService(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            AppDbContext dbContext,
            IWebHostEnvironment env,
            ILogger<AiService> logger,
            ITicketService ticketService,
            ITicketCommentService commentService,
            IUserService userService,
            IDashboardService dashboardService,
            INotificationService notificationService)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _dbContext = dbContext;
            _env = env;
            _logger = logger;
            _ticketService = ticketService;
            _commentService = commentService;
            _userService = userService;
            _dashboardService = dashboardService;
            _notificationService = notificationService;
        }

        // ──────────────────────────────────────────────
        // Existing suggestion methods (unchanged)
        // ──────────────────────────────────────────────

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

            var validIds = string.Join(", ", priorities.Select(p => p.Id));
            var systemPrompt = $@"You are an IT helpdesk priority assessor. Given a ticket's title, description, and category, assign a priority level from the list below:
{priorityList}

IMPORTANT: Valid priorityIds are ONLY: {validIds}. Never return any other number.

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
                _logger.LogWarning("AI suggested invalid priorityId {Id}, retrying with corrective prompt.", raw.PriorityId);

                var retryPrompt = $@"Your previous response used priorityId {raw.PriorityId}, which is INVALID.
The ONLY valid priority IDs are:
{string.Join("\n", priorities.Select(p => $"{p.Id} - {p.Name}"))}

You MUST return exactly one of these IDs. Do NOT invent or guess any other number.
Respond with JSON: {{ ""priorityId"": number (one of the above ONLY), ""reasoning"": string, ""confidence"": number (0.0 to 1.0) }}";

                var retryResponse = await CallGroqJsonAsync(ModelPriority, retryPrompt, userPrompt, maxTokens: 300, temperature: 0.3);
                var retryRaw = TryParseContent<PriorityResult>(retryResponse);

                if (retryRaw != null)
                {
                    priority = priorities.FirstOrDefault(p => p.Id == retryRaw.PriorityId);
                    if (priority != null)
                    {
                        _logger.LogInformation("AI retry succeeded with priorityId {Id}.", priority.Id);
                        return new SuggestPriorityResponse
                        {
                            PriorityId = priority.Id,
                            PriorityName = priority.Name,
                            Confidence = Math.Clamp(retryRaw.Confidence, 0, 1),
                            Reasoning = retryRaw.Reasoning ?? string.Empty
                        };
                    }
                }

                _logger.LogWarning("AI retry also failed to produce a valid priorityId.");
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

        // ──────────────────────────────────────────────
        // Session management
        // ──────────────────────────────────────────────

        public async Task<List<AiSessionDto>> GetSessionsAsync(Guid userId)
        {
            return await _dbContext.AiChatSessions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.UpdatedAt)
                .Select(s => new AiSessionDto
                {
                    Id = s.Id,
                    UserId = s.UserId,
                    Title = s.Title,
                    MessageCount = s.Messages.Count,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt
                })
                .ToListAsync();
        }

        public async Task<AiSessionDto> CreateSessionAsync(Guid userId, CreateSessionRequest request)
        {
            var session = new AiChatSession
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = string.IsNullOrWhiteSpace(request.Title) ? "New Chat" : request.Title,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.AiChatSessions.Add(session);
            await _dbContext.SaveChangesAsync();

            return new AiSessionDto
            {
                Id = session.Id,
                UserId = session.UserId,
                Title = session.Title,
                MessageCount = 0,
                CreatedAt = session.CreatedAt,
                UpdatedAt = session.UpdatedAt
            };
        }

        public async Task<AiSessionDto> UpdateSessionAsync(Guid sessionId, Guid userId, UpdateSessionRequest request)
        {
            var session = await _dbContext.AiChatSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null)
            {
                throw new InvalidOperationException("Session not found.");
            }

            session.Title = request.Title;
            session.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            return new AiSessionDto
            {
                Id = session.Id,
                UserId = session.UserId,
                Title = session.Title,
                MessageCount = await _dbContext.AiChatMessages.CountAsync(m => m.SessionId == sessionId),
                CreatedAt = session.CreatedAt,
                UpdatedAt = session.UpdatedAt
            };
        }

        public async Task DeleteSessionAsync(Guid sessionId, Guid userId)
        {
            var session = await _dbContext.AiChatSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null)
            {
                throw new InvalidOperationException("Session not found.");
            }

            _dbContext.AiChatSessions.Remove(session);
            await _dbContext.SaveChangesAsync();
        }

        public async Task<List<AiMessageDto>> GetSessionMessagesAsync(Guid sessionId, Guid userId)
        {
            var session = await _dbContext.AiChatSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null)
            {
                throw new InvalidOperationException("Session not found.");
            }

            return await _dbContext.AiChatMessages
                .Where(m => m.SessionId == sessionId)
                .OrderBy(m => m.CreatedAt)
                .Select(m => new AiMessageDto
                {
                    Id = m.Id,
                    SessionId = m.SessionId,
                    TurnId = m.TurnId,
                    Role = m.Role,
                    Content = m.Content,
                    ToolCallsJson = m.ToolCallsJson,
                    ToolCallId = m.ToolCallId,
                    ToolName = m.ToolName,
                    ToolResultJson = m.ToolResultJson,
                    CreatedAt = m.CreatedAt
                })
                .ToListAsync();
        }

        // ──────────────────────────────────────────────
        // Agentic chat with tool calling
        // ──────────────────────────────────────────────

        public async IAsyncEnumerable<AiStreamEvent> ChatStreamAsync(AiChatRequest request, Guid userId, [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var apiKey = _configuration["Groq:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                yield return new AiStreamEvent
                {
                    Type = "text",
                    Content = "HELIX AI is not configured. Please set the Groq API key in your environment configuration."
                };
                yield break;
            }

            var user = await _dbContext.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user == null)
            {
                yield return new AiStreamEvent { Type = "text", Content = "User not found." };
                yield break;
            }

            // Ensure a session exists
            Guid sessionId;
            if (request.SessionId.HasValue)
            {
                var existing = await _dbContext.AiChatSessions
                    .FirstOrDefaultAsync(s => s.Id == request.SessionId.Value && s.UserId == userId, cancellationToken);
                if (existing == null)
                {
                    yield return new AiStreamEvent { Type = "text", Content = "Session not found." };
                    yield break;
                }
                sessionId = request.SessionId.Value;
            }
            else
            {
                var session = new AiChatSession
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Title = request.Message.Length > 80 ? request.Message[..80] + "..." : request.Message,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _dbContext.AiChatSessions.Add(session);
                await _dbContext.SaveChangesAsync(cancellationToken);
                sessionId = session.Id;

                yield return new AiStreamEvent
                {
                    Type = "session_created",
                    Session = new AiSessionEvent { SessionId = sessionId }
                };
            }

            // Build system prompt
            var openTickets = await _dbContext.Tickets.CountAsync(t => t.CreatedBy == userId && t.StatusId == 1, cancellationToken);
            var assignedTickets = user.Role.Name is "Agent" or "Admin"
                ? await _dbContext.Tickets.CountAsync(t => t.AssignedTo == userId && t.StatusId == 1, cancellationToken)
                : 0;

            var userContext = $@"
## Current User Context
- **Name**: {user.FullName}
- **Email**: {user.Email}
- **Role**: {user.Role.Name}
- **Your open tickets**: {openTickets}
- **Tickets assigned to you**: {assignedTickets}
";

            var systemContent = $@"You are HELIX, an AI assistant for the IDS IT Helpdesk platform. Your role is to help users use the platform and perform actions on their behalf using your available tools.
{userContext}
## Platform Overview
- **Roles**: Admin (full access), Agent (triage & assign), Manager (oversight + reports), Employee (create/view own tickets)
- **Ticket statuses**: Open(1) → In Progress(2) → Pending(6)/Resolved(3) → Closed(4)/Cancelled(5)
- **Categories**: 1=Hardware, 2=Software, 3=Network, 4=Access Request, 5=Other, 6=Email
- **Priorities**: 1=Low, 2=Medium, 3=High, 4=Critical
- **SLA targets**: Critical=4h, High=8h, Medium=24h, Low=72h

## Guidelines
- Be concise and helpful. Use your tools to perform actions when asked.
- For ticket creation, suggest appropriate category and priority if the user is unsure.
- If a user asks about resolving actual IT issues, suggest creating a ticket.
- When you need more info (e.g., which category?), ask the user.
- Confirm before performing destructive actions (deleting, cancelling tickets).
- If a tool fails due to permissions, explain what roles are required.
- Refer to yourself as HELIX.
- System info: this is HELIX v1.0 integrated into the IDS IT Helpdesk.
- The current user's name is {user.FullName}. Refer to them by name.";

            // Build message list
            var messages = new List<GroqMessage>
            {
                new() { Role = "system", Content = systemContent }
            };

            // Load history from DB
            var history = await _dbContext.AiChatMessages
                .Where(m => m.SessionId == sessionId)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync(cancellationToken);

            foreach (var msg in history)
            {
                if (msg.Role == "user" || msg.Role == "assistant")
                {
                    if (!string.IsNullOrEmpty(msg.ToolCallsJson))
                    {
                        messages.Add(new GroqMessage
                        {
                            Role = "assistant",
                            Content = string.IsNullOrEmpty(msg.Content) ? null : msg.Content,
                            ToolCalls = JsonSerializer.Deserialize<List<GroqToolCall>>(msg.ToolCallsJson, JsonOptions)
                        });
                    }
                    else
                    {
                        messages.Add(new GroqMessage { Role = msg.Role, Content = msg.Content });
                    }
                }

                if (msg.Role == "tool" && !string.IsNullOrEmpty(msg.ToolCallId))
                {
                    messages.Add(new GroqMessage
                    {
                        Role = "tool",
                        ToolCallId = msg.ToolCallId,
                        Content = msg.ToolResultJson ?? "{}"
                    });
                }
            }

            if (request.History != null)
            {
                foreach (var h in request.History)
                {
                    if (h.Role == "user" || h.Role == "assistant")
                    {
                        messages.Add(new GroqMessage { Role = h.Role, Content = h.Content });
                    }
                }
            }

            messages.Add(new GroqMessage { Role = "user", Content = request.Message });

            // Save user message with TurnId
            var turnId = Guid.NewGuid();
            var userMsg = new AiChatMessage
            {
                Id = Guid.NewGuid(),
                SessionId = sessionId,
                TurnId = turnId,
                Role = "user",
                Content = request.Message,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.AiChatMessages.Add(userMsg);

            // Agentic loop
            var maxTurns = 5;
            for (var turn = 0; turn < maxTurns; turn++)
            {
                var tools = AiToolSchemas.GetAllTools();
                var body = new GroqRequest
                {
                    Model = ModelChat,
                    Messages = messages,
                    Temperature = 0.3,
                    MaxTokens = 2000,
                    Stream = false,
                    Tools = tools
                };

                var responseJson = await SendGroqRequestAsync(body, cancellationToken);
                if (string.IsNullOrEmpty(responseJson))
                {
                    yield return new AiStreamEvent { Type = "text", Content = "I'm sorry, I couldn't process that request." };
                    break;
                }

                var groqResponse = JsonSerializer.Deserialize<GroqApiResponse>(responseJson, JsonOptions);
                var choice = groqResponse?.Choices?.FirstOrDefault();
                if (choice == null) break;

                var assistantContent = choice.Message?.Content ?? string.Empty;
                var toolCalls = choice.Message?.ToolCalls;

                if (toolCalls != null && toolCalls.Count > 0)
                {
                    // Emit tool call events
                    foreach (var tc in toolCalls)
                    {
                        yield return new AiStreamEvent
                        {
                            Type = "tool_call",
                            ToolCall = new AiToolCallDto
                            {
                                Id = tc.Id,
                                Name = tc.Function?.Name ?? "unknown",
                                Arguments = tc.Function?.Arguments != null
                                    ? JsonSerializer.Deserialize<Dictionary<string, object>>(tc.Function.Arguments.ToString()!, JsonOptions)
                                    : null
                            }
                        };
                    }

                    // Save assistant message with tool calls
                    var assistantMsg = new AiChatMessage
                    {
                        Id = Guid.NewGuid(),
                        SessionId = sessionId,
                        TurnId = turnId,
                        Role = "assistant",
                        Content = assistantContent,
                        ToolCallsJson = JsonSerializer.Serialize(toolCalls, JsonOptions),
                        CreatedAt = DateTime.UtcNow
                    };
                    _dbContext.AiChatMessages.Add(assistantMsg);

                    // Add assistant message to context
                    messages.Add(new GroqMessage
                    {
                        Role = "assistant",
                        Content = string.IsNullOrEmpty(assistantContent) ? null : assistantContent,
                        ToolCalls = toolCalls
                    });

                    // Execute each tool call
                    foreach (var tc in toolCalls)
                    {
                        var toolName = tc.Function?.Name ?? "unknown";
                        var argsJson = tc.Function?.Arguments?.ToString() ?? "{}";

                        AiToolResultDto result;
                        try
                        {
                            result = await ExecuteToolAsync(toolName, argsJson, user, cancellationToken);
                        }
                        catch (Exception ex)
                        {
                            result = new AiToolResultDto
                            {
                                ToolCallId = tc.Id,
                                Name = toolName,
                                Success = false,
                                Error = ex.Message
                            };
                        }

                        yield return new AiStreamEvent
                        {
                            Type = "tool_result",
                            ToolResult = result
                        };

                        // Save tool result message
                        var resultJson = JsonSerializer.Serialize(result.Result ?? new { error = result.Error }, JsonOptions);
                        var toolMsg = new AiChatMessage
                        {
                            Id = Guid.NewGuid(),
                            SessionId = sessionId,
                            TurnId = turnId,
                            Role = "tool",
                            Content = resultJson,
                            ToolCallId = tc.Id,
                            ToolName = toolName,
                            ToolResultJson = resultJson,
                            CreatedAt = DateTime.UtcNow
                        };
                        _dbContext.AiChatMessages.Add(toolMsg);

                        // Add tool result to context
                        messages.Add(new GroqMessage
                        {
                            Role = "tool",
                            ToolCallId = tc.Id,
                            Content = resultJson
                        });
                    }
                }
                else
                {
                    // No tool calls — stream the text response
                    if (!string.IsNullOrEmpty(assistantContent))
                    {
                        var assistantMsg = new AiChatMessage
                        {
                            Id = Guid.NewGuid(),
                            SessionId = sessionId,
                            TurnId = turnId,
                            Role = "assistant",
                            Content = assistantContent,
                            CreatedAt = DateTime.UtcNow
                        };
                        _dbContext.AiChatMessages.Add(assistantMsg);

                        yield return new AiStreamEvent
                        {
                            Type = "text",
                            Content = assistantContent
                        };
                    }

                    await _dbContext.SaveChangesAsync(cancellationToken);

                    // Update session timestamp
                    var session = await _dbContext.AiChatSessions.FindAsync(new object[] { sessionId }, cancellationToken);
                    if (session != null)
                    {
                        session.UpdatedAt = DateTime.UtcNow;
                        await _dbContext.SaveChangesAsync(cancellationToken);
                    }

                    yield break;
                }

                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            // If we hit max turns without finishing
            var sessionEntity = await _dbContext.AiChatSessions.FindAsync(new object[] { sessionId }, cancellationToken);
            if (sessionEntity != null)
            {
                sessionEntity.UpdatedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync(cancellationToken);
            }
        }

        // ──────────────────────────────────────────────
        // Tool execution
        // ──────────────────────────────────────────────

        private async Task<AiToolResultDto> ExecuteToolAsync(string toolName, string argsJson, User user, CancellationToken cancellationToken)
        {
            var args = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(argsJson, JsonOptions)
                       ?? new Dictionary<string, JsonElement>();

            string G(string key) => args.TryGetValue(key, out var v) ? v.GetString() ?? string.Empty : string.Empty;
            int I(string key) => args.TryGetValue(key, out var v) && v.ValueKind == JsonValueKind.Number ? v.GetInt32() : 0;
            Guid? GuidOrNull(string key)
            {
                var s = G(key);
                return Guid.TryParse(s, out var g) ? g : null;
            }

            var role = user.Role.Name;

            switch (toolName)
            {
                case "get_ticket":
                {
                    var ticketId = GuidOrNull("ticket_id");
                    if (ticketId == null)
                        return Error("ticketId is required.");
                    var ticket = await _ticketService.GetTicketByIdAsync(ticketId.Value, user.Id, role);
                    if (ticket == null)
                        return Error("Ticket not found.");
                    return Success(ticketId.Value.ToString(), ticket);
                }

                case "list_tickets":
                {
                    var result = await _ticketService.GetAllTicketsAsync(
                        user.Id, role,
                        page: I("page") > 0 ? I("page") : 1,
                        pageSize: I("page_size") > 0 ? I("page_size") : 10,
                        searchText: G("search_text") != "" ? G("search_text") : null,
                        categoryId: I("category_id") > 0 ? I("category_id") : (int?)null,
                        priorityId: I("priority_id") > 0 ? I("priority_id") : (int?)null,
                        statusId: I("status_id") > 0 ? I("status_id") : (int?)null,
                        assignedTo: GuidOrNull("assigned_to"));
                    return Success("list", result);
                }

                case "create_ticket":
                {
                    var title = G("title");
                    var description = G("description");
                    var categoryId = I("category_id");
                    var priorityId = I("priority_id");
                    if (string.IsNullOrWhiteSpace(title))
                        return Error("Title is required.");
                    if (string.IsNullOrWhiteSpace(description))
                        return Error("Description is required.");
                    if (categoryId == 0)
                        return Error("CategoryId is required.");
                    if (priorityId == 0)
                        return Error("PriorityId is required.");

                    var dto = new TicketCreateDto
                    {
                        Title = title,
                        Description = description,
                        CategoryId = categoryId,
                        PriorityId = priorityId
                    };
                    var ticket = await _ticketService.CreateTicketAsync(dto, user.Id);
                    return Success(ticket.Id.ToString(), ticket);
                }

                case "update_ticket":
                {
                    var ticketId = GuidOrNull("ticket_id");
                    if (ticketId == null)
                        return Error("ticketId is required.");
                    var existing = await _ticketService.GetTicketByIdAsync(ticketId.Value, user.Id, role);
                    if (existing == null)
                        return Error("Ticket not found.");
                    var dto = new TicketUpdateDto
                    {
                        Title = G("title") != "" ? G("title") : existing.Title,
                        Description = G("description") != "" ? G("description") : existing.Description,
                        CategoryId = I("category_id") > 0 ? I("category_id") : existing.CategoryId,
                        PriorityId = I("priority_id") > 0 ? I("priority_id") : existing.PriorityId,
                        StatusId = existing.StatusId,
                        AssignedTo = existing.AssignedTo
                    };
                    var result = await _ticketService.UpdateTicketAsync(ticketId.Value, dto, user.Id, role);
                    if (result == null)
                        return Error("Ticket not found or you don't have permission to update it.");
                    return Success(ticketId.Value.ToString(), result);
                }

                case "add_comment":
                {
                    var ticketId = GuidOrNull("ticket_id");
                    if (ticketId == null)
                        return Error("ticketId is required.");
                    var body = G("body");
                    if (string.IsNullOrWhiteSpace(body))
                        return Error("Comment body is required.");
                    var isInternal = args.TryGetValue("is_internal", out var isInt) && isInt.GetBoolean();
                    var comment = await _commentService.AddCommentAsync(ticketId.Value, user.Id, body, isInternal, role);
                    return Success(ticketId.Value.ToString(), comment);
                }

                case "update_ticket_status":
                {
                    var ticketId = GuidOrNull("ticket_id");
                    if (ticketId == null)
                        return Error("ticketId is required.");
                    var statusId = I("status_id");
                    if (statusId == 0)
                        return Error("statusId is required.");
                    var notes = G("notes") != "" ? G("notes") : null;
                    if (role is not "Admin" and not "Agent")
                        return Error("Only Agents and Admins can change ticket status.");
                    var result = await _ticketService.UpdateTicketStatusAsync(ticketId.Value, statusId, user.Id, notes);
                    if (result == null)
                        return Error("Ticket not found or status change failed.");
                    return Success(ticketId.Value.ToString(), result);
                }

                case "assign_ticket":
                {
                    var ticketId = GuidOrNull("ticket_id");
                    var assigneeId = GuidOrNull("user_id");
                    if (ticketId == null)
                        return Error("ticketId is required.");
                    if (assigneeId == null)
                        return Error("userId is required.");
                    if (role is not "Admin" and not "Agent")
                        return Error("Only Agents and Admins can assign tickets.");
                    var result = await _ticketService.AssignTicketAsync(ticketId.Value, assigneeId.Value, user.Id);
                    if (result == null)
                        return Error("Assignment failed. Check that the ticket and user exist.");
                    return Success(ticketId.Value.ToString(), result);
                }

                case "unassign_ticket":
                {
                    var ticketId = GuidOrNull("ticket_id");
                    if (ticketId == null)
                        return Error("ticketId is required.");
                    if (role != "Admin")
                        return Error("Only Admins can unassign tickets.");
                    var success = await _ticketService.UnassignTicketAsync(ticketId.Value, user.Id);
                    if (!success)
                        return Error("Unassignment failed.");
                    return Success(ticketId.Value.ToString(), new { message = "Ticket unassigned successfully." });
                }

                case "get_my_tickets":
                {
                    var result = await _ticketService.GetAllTicketsAsync(
                        user.Id, role,
                        page: I("page") > 0 ? I("page") : 1,
                        pageSize: I("page_size") > 0 ? I("page_size") : 10,
                        statusId: I("status_id") > 0 ? I("status_id") : (int?)null);
                    return Success("mytickets", result);
                }

                case "get_dashboard_stats":
                {
                    var stats = await _dashboardService.GetStatsAsync(user.Id, role);
                    return Success("stats", stats);
                }

                case "get_agent_performance":
                {
                    if (role is not "Admin" and not "Manager")
                        return Error("Only Managers and Admins can view agent performance.");
                    var perf = await _dashboardService.GetAgentPerformanceAsync();
                    return Success("performance", perf);
                }

                case "list_users":
                {
                    if (role != "Admin")
                        return Error("Only Admins can list users.");
                    var search = G("search");
                    var roleFilter = G("role");
                    var users = await _userService.GetAllAsync();
                    if (!string.IsNullOrWhiteSpace(search))
                    {
                        users = users.Where(u =>
                            u.FullName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                            u.Email.Contains(search, StringComparison.OrdinalIgnoreCase));
                    }
                    if (!string.IsNullOrWhiteSpace(roleFilter))
                    {
                        users = users.Where(u =>
                            u.Role.Equals(roleFilter, StringComparison.OrdinalIgnoreCase));
                    }
                    return Success("users", users.ToList());
                }

                case "get_my_notifications":
                {
                    var unreadOnly = args.TryGetValue("unreadOnly", out var unr) && unr.GetBoolean();
                    var notifications = await _notificationService.GetNotificationsAsync(user.Id, unreadOnly);
                    var count = await _notificationService.GetUnreadCountAsync(user.Id);
                    return Success("notifications", new { notifications, unreadCount = count });
                }

                case "suggest_category":
                {
                    var title = G("title");
                    var description = G("description");
                    if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(description))
                        return Error("Title and description are required.");
                    try
                    {
                        var result = await SuggestCategoryAsync(new SuggestCategoryRequest { Title = title, Description = description });
                        return Success("suggestion", result);
                    }
                    catch (Exception ex)
                    {
                        return Error(ex.Message);
                    }
                }

                case "suggest_priority":
                {
                    var title = G("title");
                    var description = G("description");
                    var categoryId = I("category_id");
                    if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(description) || categoryId == 0)
                        return Error("Title, description, and categoryId are required.");
                    try
                    {
                        var result = await SuggestPriorityAsync(new SuggestPriorityRequest { Title = title, Description = description, CategoryId = categoryId });
                        return Success("suggestion", result);
                    }
                    catch (Exception ex)
                    {
                        return Error(ex.Message);
                    }
                }

                case "get_system_info":
                {
                    if (role != "Admin")
                        return Error("Only Admins can view system info.");
                    var totalUsers = await _dbContext.Users.CountAsync(cancellationToken);
                    var totalTickets = await _dbContext.Tickets.CountAsync(cancellationToken);
                    return Success("systemInfo", new
                    {
                        version = "1.0.0",
                        databaseConnected = true,
                        totalUsers,
                        totalTickets
                    });
                }

                default:
                    return Error($"Unknown tool: {toolName}");
            }
        }

        private static AiToolResultDto Success(string id, object result) => new()
        {
            ToolCallId = id,
            Success = true,
            Result = result
        };

        private static AiToolResultDto Error(string message) => new()
        {
            Success = false,
            Error = message
        };

        // ──────────────────────────────────────────────
        // Groq API helpers
        // ──────────────────────────────────────────────

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

            var responseBody = await SendGroqRequestAsync(body);
            return ExtractGroqContent(responseBody);
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

            var responseBody = await SendGroqRequestAsync(body);
            return ExtractGroqContent(responseBody);
        }

        private string ExtractGroqContent(string responseBody)
        {
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

        private async Task<string> SendGroqRequestAsync(GroqRequest body, CancellationToken cancellationToken = default)
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

                using var httpResponse = await httpClient.SendAsync(httpRequest, cancellationToken);

                if (httpResponse.IsSuccessStatusCode)
                {
                    var responseBody = await httpResponse.Content.ReadAsStringAsync(cancellationToken);

                    _logger.LogDebug("Groq response: {Body}", responseBody);

                    return responseBody;
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
                        await Task.Delay(TimeSpan.FromSeconds(retryAfterSeconds), cancellationToken);
                        continue;
                    }

                    _logger.LogError("Groq API rate limited after {Attempt} attempts.", attempt);
                    throw new GroqRateLimitException(
                        $"AI service is temporarily busy. Please wait {retryAfterSeconds} seconds and try again.",
                        retryAfterSeconds);
                }

                var errorBody = await httpResponse.Content.ReadAsStringAsync(cancellationToken);
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

        // ──────────────────────────────────────────────
        // DTO classes for Groq API
        // ──────────────────────────────────────────────

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
            public List<object>? Tools { get; set; }
        }

        private class GroqMessage
        {
            [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
            public string Role { get; set; } = string.Empty;
            [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
            public object? Content { get; set; }
            [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
            [JsonPropertyName("tool_call_id")]
            public string? ToolCallId { get; set; }
            [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
            [JsonPropertyName("tool_calls")]
            public List<GroqToolCall>? ToolCalls { get; set; }
        }

        private class GroqToolCall
        {
            public string Id { get; set; } = string.Empty;
            public string Type { get; set; } = "function";
            public GroqFunctionCall? Function { get; set; }
        }

        private class GroqFunctionCall
        {
            public string Name { get; set; } = string.Empty;
            public object? Arguments { get; set; }
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

            [JsonPropertyName("tool_calls")]
            public List<GroqToolCall>? ToolCalls { get; set; }
        }
    }
}
