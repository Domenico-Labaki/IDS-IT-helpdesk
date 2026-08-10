using System.Text.Json;
using HelpdeskApi.DTOs;

namespace HelpdeskApi.Tests;

public class AiToolSchemasTests
{
    [Fact]
    public void EmployeeOnlyReceivesEmployeeSafeTools()
    {
        var names = NamesFor("Employee");

        Assert.Contains("get_ticket", names);
        Assert.Contains("create_ticket", names);
        Assert.DoesNotContain("assign_ticket", names);
        Assert.DoesNotContain("update_ticket_status", names);
        Assert.DoesNotContain("list_assignable_agents", names);
        Assert.DoesNotContain("get_agent_performance", names);
    }

    [Theory]
    [InlineData("create_ticket")]
    [InlineData("update_ticket")]
    [InlineData("add_comment")]
    [InlineData("update_ticket_status")]
    [InlineData("assign_ticket")]
    [InlineData("unassign_ticket")]
    public void EveryWriteToolRequiresConfirmation(string toolName)
    {
        Assert.True(AiToolSchemas.RequiresConfirmation(toolName));
    }

    [Fact]
    public void ElevatedToolsAreRoleScoped()
    {
        Assert.True(AiToolSchemas.IsAllowedForRole("get_agent_performance", "Manager"));
        Assert.False(AiToolSchemas.IsAllowedForRole("assign_ticket", "Manager"));
        Assert.True(AiToolSchemas.IsAllowedForRole("assign_ticket", "Agent"));
        Assert.False(AiToolSchemas.IsAllowedForRole("unassign_ticket", "Agent"));
        Assert.True(AiToolSchemas.IsAllowedForRole("unassign_ticket", "Admin"));
    }

    private static HashSet<string> NamesFor(string role)
    {
        using var json = JsonDocument.Parse(JsonSerializer.Serialize(AiToolSchemas.GetToolsForRole(role)));
        return json.RootElement.EnumerateArray()
            .Select(tool => tool.GetProperty("function").GetProperty("name").GetString()!)
            .ToHashSet(StringComparer.Ordinal);
    }
}
