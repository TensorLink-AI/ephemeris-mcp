# Installing the Ephemeris MCP server

Ephemeris is a hosted MCP server; nothing to build or run locally.

1. Ask the user for their Ephemeris API key (starts with `pc_live_`). If they have none: sign up at https://ephemeris.cascade.industries/sign-up, add credits, and create a key in the dashboard. Never invent or hard-code a key.
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

   For clients that only run local (stdio) servers, use the npm bridge instead:
   `{"command": "npx", "args": ["-y", "ephemeris-mcp"], "env": {"EPHEMERIS_API_KEY": "pc_live_..."}}`
3. Verify: call the `list_models` tool; it returns the live model panel. Every `forecast` call spends the user's credits, so do not forecast speculatively.
