using System.Text.Json;

namespace HelpdeskApi.DTOs
{
    public static class AiToolSchemas
    {
        public static List<object> GetAllTools() => new()
        {
            GetTicketTool,
            ListTicketsTool,
            CreateTicketTool,
            UpdateTicketTool,
            AddCommentTool,
            UpdateTicketStatusTool,
            AssignTicketTool,
            UnassignTicketTool,
            GetMyTicketsTool,
            GetDashboardStatsTool,
            GetAgentPerformanceTool,
            ListUsersTool,
            GetMyNotificationsTool,
            SuggestCategoryTool,
            SuggestPriorityTool,
            GetSystemInfoTool
        };

        private static readonly object GetTicketTool = new
        {
            type = "function",
            function = new
            {
                name = "get_ticket",
                description = "Get detailed information about a specific ticket by its ID.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        ticketId = new
                        {
                            type = "string",
                            description = "The GUID of the ticket to retrieve."
                        }
                    },
                    required = new[] { "ticket_id" }
                }
            }
        };

        private static readonly object ListTicketsTool = new
        {
            type = "function",
            function = new
            {
                name = "list_tickets",
                description = "Search and filter tickets. Returns paginated results.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        searchText = new { type = "string", description = "Search text for title and description." },
                        statusId = new { type = "number", description = "Filter by status ID (1=Open, 2=In Progress, 3=Resolved, 4=Closed, 5=Cancelled, 6=Pending)." },
                        priorityId = new { type = "number", description = "Filter by priority ID." },
                        categoryId = new { type = "number", description = "Filter by category ID." },
                        assignedTo = new { type = "string", description = "Filter by assigned user's GUID." },
                        page = new { type = "number", description = "Page number (1-based)." },
                        pageSize = new { type = "number", description = "Results per page." }
                    },
                    required = new string[] { }
                }
            }
        };

        private static readonly object CreateTicketTool = new
        {
            type = "function",
            function = new
            {
                name = "create_ticket",
                description = "Create a new support ticket. The user must be authenticated.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        title = new { type = "string", description = "Ticket title / summary." },
                        description = new { type = "string", description = "Detailed description of the issue." },
                        categoryId = new { type = "number", description = "Category ID (1=Hardware, 2=Software, 3=Network, 4=Access Request, 5=Other, 6=Email)." },
                        priorityId = new { type = "number", description = "Priority ID (1=Low, 2=Medium, 3=High, 4=Critical)." }
                    },
                    required = new[] { "title", "description", "category_id", "priority_id" }
                }
            }
        };

        private static readonly object UpdateTicketTool = new
        {
            type = "function",
            function = new
            {
                name = "update_ticket",
                description = "Update an existing ticket's fields.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        ticketId = new { type = "string", description = "The GUID of the ticket to update." },
                        title = new { type = "string", description = "New title." },
                        description = new { type = "string", description = "New description." },
                        categoryId = new { type = "number", description = "New category ID." },
                        priorityId = new { type = "number", description = "New priority ID." }
                    },
                    required = new[] { "ticket_id" }
                }
            }
        };

        private static readonly object AddCommentTool = new
        {
            type = "function",
            function = new
            {
                name = "add_comment",
                description = "Add a comment to a ticket.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        ticketId = new { type = "string", description = "The GUID of the ticket." },
                        body = new { type = "string", description = "The comment text." },
                        isInternal = new { type = "boolean", description = "Whether this is an internal note (visible only to agents/admins)." }
                    },
                    required = new[] { "ticket_id", "body" }
                }
            }
        };

        private static readonly object UpdateTicketStatusTool = new
        {
            type = "function",
            function = new
            {
                name = "update_ticket_status",
                description = "Change the status of a ticket. Requires Agent or Admin role.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        ticketId = new { type = "string", description = "The GUID of the ticket." },
                        statusId = new { type = "number", description = "New status ID (1=Open, 2=In Progress, 3=Resolved, 4=Closed, 5=Cancelled, 6=Pending)." },
                        notes = new { type = "string", description = "Optional notes about the status change." }
                    },
                    required = new[] { "ticket_id", "status_id" }
                }
            }
        };

        private static readonly object AssignTicketTool = new
        {
            type = "function",
            function = new
            {
                name = "assign_ticket",
                description = "Assign a ticket to a user. Requires Agent or Admin role.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        ticketId = new { type = "string", description = "The GUID of the ticket." },
                        userId = new { type = "string", description = "The GUID of the user to assign to." }
                    },
                    required = new[] { "ticket_id", "user_id" }
                }
            }
        };

        private static readonly object UnassignTicketTool = new
        {
            type = "function",
            function = new
            {
                name = "unassign_ticket",
                description = "Unassign a ticket (remove the current assignee). Requires Admin role.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        ticketId = new { type = "string", description = "The GUID of the ticket." }
                    },
                    required = new[] { "ticket_id" }
                }
            }
        };

        private static readonly object GetMyTicketsTool = new
        {
            type = "function",
            function = new
            {
                name = "get_my_tickets",
                description = "Get tickets for the currently authenticated user. Employees see their own tickets; agents/admins see all.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        statusId = new { type = "number", description = "Filter by status ID." },
                        page = new { type = "number", description = "Page number." },
                        pageSize = new { type = "number", description = "Results per page." }
                    },
                    required = new string[] { }
                }
            }
        };

        private static readonly object GetDashboardStatsTool = new
        {
            type = "function",
            function = new
            {
                name = "get_dashboard_stats",
                description = "Get dashboard summary statistics. Role-aware: employees see their own stats.",
                parameters = new
                {
                    type = "object",
                    properties = new { },
                    required = new string[] { }
                }
            }
        };

        private static readonly object GetAgentPerformanceTool = new
        {
            type = "function",
            function = new
            {
                name = "get_agent_performance",
                description = "Get agent performance metrics. Requires Manager or Admin role.",
                parameters = new
                {
                    type = "object",
                    properties = new { },
                    required = new string[] { }
                }
            }
        };

        private static readonly object ListUsersTool = new
        {
            type = "function",
            function = new
            {
                name = "list_users",
                description = "List all users. Requires Admin role.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        search = new { type = "string", description = "Search by name or email." },
                        role = new { type = "string", description = "Filter by role name." }
                    },
                    required = new string[] { }
                }
            }
        };

        private static readonly object GetMyNotificationsTool = new
        {
            type = "function",
            function = new
            {
                name = "get_my_notifications",
                description = "Get notifications for the current user.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        unreadOnly = new { type = "boolean", description = "Only return unread notifications." }
                    },
                    required = new string[] { }
                }
            }
        };

        private static readonly object SuggestCategoryTool = new
        {
            type = "function",
            function = new
            {
                name = "suggest_category",
                description = "Use AI to suggest a category for a ticket based on its title and description.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        title = new { type = "string", description = "Ticket title." },
                        description = new { type = "string", description = "Ticket description." }
                    },
                    required = new[] { "title", "description" }
                }
            }
        };

        private static readonly object SuggestPriorityTool = new
        {
            type = "function",
            function = new
            {
                name = "suggest_priority",
                description = "Use AI to suggest a priority for a ticket based on its title, description, and category.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        title = new { type = "string", description = "Ticket title." },
                        description = new { type = "string", description = "Ticket description." },
                        categoryId = new { type = "number", description = "Category ID the ticket belongs to." }
                    },
                    required = new[] { "title", "description", "category_id" }
                }
            }
        };

        private static readonly object GetSystemInfoTool = new
        {
            type = "function",
            function = new
            {
                name = "get_system_info",
                description = "Get system information (version, DB status, total users, total tickets). Requires Admin role.",
                parameters = new
                {
                    type = "object",
                    properties = new { },
                    required = new string[] { }
                }
            }
        };
    }
}
