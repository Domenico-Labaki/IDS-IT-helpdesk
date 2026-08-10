# HELIX unified agent

HELIX uses Groq's OpenAI-compatible chat-completions API with local, allow-listed tools. No separate agent framework or external tool server is required.

## Execution model

1. The backend loads the authenticated user's role and a bounded session history.
2. Groq receives only the tools allowed for that role.
3. Read tools execute immediately through existing application services.
4. Every write tool creates an immutable `AiAgentAction` with a ten-minute expiry.
5. The user confirms or rejects that exact action through `/api/ai/actions/{id}`.
6. Confirmation atomically claims the action, rechecks the user's current role, executes it once, and writes an activity log.

Both the full AI hub and floating assistant use the same `AiAgentProvider`, session, pending actions, and confirmation endpoints.

## Supported write actions

- Create a ticket
- Update a ticket's basic fields
- Add a comment
- Change ticket status (Agent/Admin)
- Assign a ticket (Agent/Admin)
- Unassign a ticket (Admin)

Ticket deletion and user/system administration are deliberately outside the initial agent scope.

## Configuration

Set `Groq__ApiKey` in `backend/.env`. Apply the `UnifiedAgentActions` EF Core migration before running the updated application:

```powershell
dotnet ef database update
```

Access and refresh credentials are sent in HTTP-only, `SameSite=Strict` cookies. Deploy the frontend and API on the same site (the normal reverse-proxy or sibling-subdomain setup) and serve production traffic over HTTPS.
