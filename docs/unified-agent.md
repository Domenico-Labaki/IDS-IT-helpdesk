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

## Secure Groq connectivity

- Only the backend calls Groq. The browser never receives the API key.
- The named HTTP client is pinned to `https://api.groq.com/`, rejects redirects, uses a 10-second connection timeout, and caps total requests at 60 seconds.
- HELIX sends the current message, role, ticket counts, lookup values, allowed tool schemas, and at most 12 recent history records bounded to 12,000 characters. Names and email addresses are excluded from the system context, and agent-search email addresses are filtered locally rather than returned to the model.
- Prompts are capped at 4,000 characters. The UI warns users not to submit passwords, API keys, or other secrets.
- Tool authorization, argument validation, confirmation, execution, and audit logging remain local. Credentials, JWTs, database configuration, and the Groq API key are never included in model input.

For production, store `Groq__ApiKey` in a managed secret store and use separate keys for development and production. Route backend egress through a firewall or HTTPS proxy that permits `api.groq.com:443` and denies unnecessary destinations. Enable Zero Data Retention in the Groq Console when required by organizational policy.
