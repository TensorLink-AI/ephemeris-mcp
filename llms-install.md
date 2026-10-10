# Installing the Ephemeris MCP server

Ephemeris is a hosted MCP server; nothing to build or run locally.

1. Get the user a key without it passing through the conversation: ask them to run `npx ephemeris-mcp login` in their own terminal. It opens the browser; they sign in or sign up, check the code and approve, and the key is saved locally (`~/.config/ephemeris/credentials`, owner-only). Then use the stdio bridge config below with no `env`. If they already have a key (starts with `pc_live_`) or prefer one from the dashboard (https://ephemeris.cascade.industries/dashboard/api-keys), use it as shown. Never invent or hard-code a key.
2. Add this server to the MCP settings (Streamable HTTP):

```json
{
  "mcpServers": {
    "ephemeris": {
      "type": "streamableHttp",
      "url": "https://ephemeris.cascade.industries/api/mcp",
      "headers": { "Authorization": "Bearer pc_live_..." }
    }
  }
}
```

   With a key saved by `npx ephemeris-mcp login`, or for clients that only run local (stdio) servers, use the npm bridge instead:
   `{"command": "npx", "args": ["-y", "ephemeris-mcp"]}` (add `"env": {"EPHEMERIS_API_KEY": "pc_live_..."}` only to pass a key explicitly)
3. Verify: call the `list_models` tool; it returns the live model panel. Every `forecast` call spends the user's credits, so do not forecast speculatively.
