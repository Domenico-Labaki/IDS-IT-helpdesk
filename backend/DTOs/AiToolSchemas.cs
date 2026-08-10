namespace HelpdeskApi.DTOs
{
    /// <summary>
    /// The single allow-list for HELIX capabilities. The model only sees tools the
    /// current role may request; service-level authorization is still enforced at execution.
    /// </summary>
    public static class AiToolSchemas
    {
        private static readonly string[] AllRoles = ["Admin", "Agent", "Manager", "Employee"];
        private static readonly string[] StaffRoles = ["Admin", "Agent"];

        private sealed record Definition(object Schema, string[] Roles, bool RequiresConfirmation);

        private static readonly IReadOnlyDictionary<string, Definition> Definitions =
            new Dictionary<string, Definition>(StringComparer.Ordinal)
            {
                ["get_ticket"] = new(Tool("get_ticket", "Get a ticket the current user is allowed to view.",
                    Props(("ticket_id", String("Ticket GUID.", format: "uuid"))), ["ticket_id"]), AllRoles, false),
                ["list_tickets"] = new(Tool("list_tickets", "Search tickets using role-aware visibility.",
                    Props(
                        ("search_text", String("Search title and description.", maxLength: 255)),
                        ("status_id", Number("Status ID.", 1, 6)),
                        ("priority_id", Number("Priority ID.", 1, 4)),
                        ("category_id", Number("Category ID.", 1, 6)),
                        ("assigned_to", String("Assignee GUID.", format: "uuid")),
                        ("page", Number("Page number.", 1)),
                        ("page_size", Number("Results per page, maximum 50.", 1, 50)))), AllRoles, false),
                ["get_my_tickets"] = new(Tool("get_my_tickets", "Get tickets visible to the current user.",
                    Props(("status_id", Number("Optional status ID.", 1, 6)), ("page", Number("Page number.", 1)), ("page_size", Number("Results per page.", 1, 50)))), AllRoles, false),
                ["get_dashboard_stats"] = new(Tool("get_dashboard_stats", "Get role-aware dashboard statistics.", Props()), AllRoles, false),
                ["get_my_notifications"] = new(Tool("get_my_notifications", "Get the current user's notifications.",
                    Props(("unread_only", Boolean("Return unread notifications only.")))), AllRoles, false),
                ["get_lookup_values"] = new(Tool("get_lookup_values", "Get current ticket categories, priorities, and statuses.", Props()), AllRoles, false),
                ["suggest_category"] = new(Tool("suggest_category", "Suggest a ticket category.",
                    Props(("title", String("Ticket title.", 1, 255)), ("description", String("Ticket description.", 1, 4000))), ["title", "description"]), AllRoles, false),
                ["suggest_priority"] = new(Tool("suggest_priority", "Suggest a ticket priority.",
                    Props(("title", String("Ticket title.", 1, 255)), ("description", String("Ticket description.", 1, 4000)), ("category_id", Number("Category ID.", 1, 6))), ["title", "description", "category_id"]), AllRoles, false),
                ["get_agent_performance"] = new(Tool("get_agent_performance", "Get agent performance metrics.", Props()), ["Admin", "Manager"], false),
                ["list_assignable_agents"] = new(Tool("list_assignable_agents", "List active users who can be assigned tickets.",
                    Props(("search", String("Optional name search.", maxLength: 100)))), StaffRoles, false),

                ["create_ticket"] = new(Tool("create_ticket", "Create a support ticket for the current user.",
                    Props(
                        ("title", String("Ticket title, maximum 255 characters.", 1, 255)),
                        ("description", String("Detailed issue description.", 1, 4000)),
                        ("category_id", Number("Category ID from get_lookup_values.", 1, 6)),
                        ("priority_id", Number("Priority ID from get_lookup_values.", 1, 4))),
                    ["title", "description", "category_id", "priority_id"]), AllRoles, true),
                ["update_ticket"] = new(Tool("update_ticket", "Update the basic fields of an accessible ticket.",
                    Props(
                        ("ticket_id", String("Ticket GUID.", format: "uuid")),
                        ("title", String("New title.", 1, 255)),
                        ("description", String("New description.", 1, 4000)),
                        ("category_id", Number("New category ID.", 1, 6)),
                        ("priority_id", Number("New priority ID.", 1, 4))), ["ticket_id"]), AllRoles, true),
                ["add_comment"] = new(Tool("add_comment", "Add a comment to an accessible ticket.",
                    Props(("ticket_id", String("Ticket GUID.", format: "uuid")), ("body", String("Comment body.", 1, 4000)), ("is_internal", Boolean("Internal note; staff only."))),
                    ["ticket_id", "body"]), AllRoles, true),
                ["update_ticket_status"] = new(Tool("update_ticket_status", "Change a ticket status.",
                    Props(("ticket_id", String("Ticket GUID.", format: "uuid")), ("status_id", Number("New status ID.", 1, 6)), ("notes", String("Optional change note.", maxLength: 4000))),
                    ["ticket_id", "status_id"]), StaffRoles, true),
                ["assign_ticket"] = new(Tool("assign_ticket", "Assign a ticket to an active agent or admin.",
                    Props(("ticket_id", String("Ticket GUID.", format: "uuid")), ("user_id", String("Assignee GUID from list_assignable_agents.", format: "uuid"))),
                    ["ticket_id", "user_id"]), StaffRoles, true),
                ["unassign_ticket"] = new(Tool("unassign_ticket", "Remove the current ticket assignee.",
                    Props(("ticket_id", String("Ticket GUID.", format: "uuid"))), ["ticket_id"]), ["Admin"], true)
            };

        public static List<object> GetToolsForRole(string role) => Definitions
            .Where(pair => pair.Value.Roles.Contains(role, StringComparer.Ordinal))
            .Select(pair => pair.Value.Schema)
            .ToList();

        public static bool IsAllowedForRole(string name, string role) =>
            Definitions.TryGetValue(name, out var definition)
            && definition.Roles.Contains(role, StringComparer.Ordinal);

        public static bool RequiresConfirmation(string name) =>
            Definitions.TryGetValue(name, out var definition) && definition.RequiresConfirmation;

        private static object Tool(string name, string description, Dictionary<string, object> properties, string[]? required = null) => new
        {
            type = "function",
            function = new
            {
                name,
                description,
                parameters = new
                {
                    type = "object",
                    properties,
                    required = required ?? [],
                    additionalProperties = false
                }
            }
        };

        private static Dictionary<string, object> Props(params (string Name, object Schema)[] values) =>
            values.ToDictionary(value => value.Name, value => value.Schema, StringComparer.Ordinal);

        private static object String(string description, int? minLength = null, int? maxLength = null, string? format = null) =>
            new { type = "string", description, minLength, maxLength, format };
        private static object Number(string description, int? minimum = null, int? maximum = null) =>
            new { type = "integer", description, minimum, maximum };
        private static object Boolean(string description) => new { type = "boolean", description };
    }
}
