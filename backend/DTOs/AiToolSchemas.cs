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
                    Props(("ticket_id", String("Ticket GUID."))), ["ticket_id"]), AllRoles, false),
                ["list_tickets"] = new(Tool("list_tickets", "Search tickets using role-aware visibility.",
                    Props(
                        ("search_text", String("Search title and description.")),
                        ("status_id", Number("Status ID.")),
                        ("priority_id", Number("Priority ID.")),
                        ("category_id", Number("Category ID.")),
                        ("assigned_to", String("Assignee GUID.")),
                        ("page", Number("Page number.")),
                        ("page_size", Number("Results per page, maximum 50.")))), AllRoles, false),
                ["get_my_tickets"] = new(Tool("get_my_tickets", "Get tickets visible to the current user.",
                    Props(("status_id", Number("Optional status ID.")), ("page", Number("Page number.")), ("page_size", Number("Results per page.")))), AllRoles, false),
                ["get_dashboard_stats"] = new(Tool("get_dashboard_stats", "Get role-aware dashboard statistics.", Props()), AllRoles, false),
                ["get_my_notifications"] = new(Tool("get_my_notifications", "Get the current user's notifications.",
                    Props(("unread_only", Boolean("Return unread notifications only.")))), AllRoles, false),
                ["get_lookup_values"] = new(Tool("get_lookup_values", "Get current ticket categories, priorities, and statuses.", Props()), AllRoles, false),
                ["suggest_category"] = new(Tool("suggest_category", "Suggest a ticket category.",
                    Props(("title", String("Ticket title.")), ("description", String("Ticket description."))), ["title", "description"]), AllRoles, false),
                ["suggest_priority"] = new(Tool("suggest_priority", "Suggest a ticket priority.",
                    Props(("title", String("Ticket title.")), ("description", String("Ticket description.")), ("category_id", Number("Category ID."))), ["title", "description", "category_id"]), AllRoles, false),
                ["get_agent_performance"] = new(Tool("get_agent_performance", "Get agent performance metrics.", Props()), ["Admin", "Manager"], false),
                ["list_assignable_agents"] = new(Tool("list_assignable_agents", "List active users who can be assigned tickets.",
                    Props(("search", String("Optional name or email search.")))), StaffRoles, false),

                ["create_ticket"] = new(Tool("create_ticket", "Create a support ticket for the current user.",
                    Props(
                        ("title", String("Ticket title, maximum 255 characters.")),
                        ("description", String("Detailed issue description.")),
                        ("category_id", Number("Category ID from get_lookup_values.")),
                        ("priority_id", Number("Priority ID from get_lookup_values."))),
                    ["title", "description", "category_id", "priority_id"]), AllRoles, true),
                ["update_ticket"] = new(Tool("update_ticket", "Update the basic fields of an accessible ticket.",
                    Props(
                        ("ticket_id", String("Ticket GUID.")),
                        ("title", String("New title.")),
                        ("description", String("New description.")),
                        ("category_id", Number("New category ID.")),
                        ("priority_id", Number("New priority ID."))), ["ticket_id"]), AllRoles, true),
                ["add_comment"] = new(Tool("add_comment", "Add a comment to an accessible ticket.",
                    Props(("ticket_id", String("Ticket GUID.")), ("body", String("Comment body.")), ("is_internal", Boolean("Internal note; staff only."))),
                    ["ticket_id", "body"]), AllRoles, true),
                ["update_ticket_status"] = new(Tool("update_ticket_status", "Change a ticket status.",
                    Props(("ticket_id", String("Ticket GUID.")), ("status_id", Number("New status ID.")), ("notes", String("Optional change note."))),
                    ["ticket_id", "status_id"]), StaffRoles, true),
                ["assign_ticket"] = new(Tool("assign_ticket", "Assign a ticket to an active agent or admin.",
                    Props(("ticket_id", String("Ticket GUID.")), ("user_id", String("Assignee GUID from list_assignable_agents."))),
                    ["ticket_id", "user_id"]), StaffRoles, true),
                ["unassign_ticket"] = new(Tool("unassign_ticket", "Remove the current ticket assignee.",
                    Props(("ticket_id", String("Ticket GUID."))), ["ticket_id"]), ["Admin"], true)
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
                    required = required ?? []
                }
            }
        };

        private static Dictionary<string, object> Props(params (string Name, object Schema)[] values) =>
            values.ToDictionary(value => value.Name, value => value.Schema, StringComparer.Ordinal);

        private static object String(string description) => new { type = "string", description };
        private static object Number(string description) => new { type = "integer", description };
        private static object Boolean(string description) => new { type = "boolean", description };
    }
}
