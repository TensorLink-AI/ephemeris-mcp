# Ephemeris MCP server: time-series foundation model (TSFM) forecasting for AI agents

[![CI](https://github.com/TensorLink-AI/ephemeris-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/TensorLink-AI/ephemeris-mcp/actions/workflows/ci.yml) [![npm](https://img.shields.io/npm/v/ephemeris-mcp)](https://www.npmjs.com/package/ephemeris-mcp)

[![Add Ephemeris to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=ephemeris&config=eyJ1cmwiOiJodHRwczovL2VwaGVtZXJpcy5jYXNjYWRlLmluZHVzdHJpZXMvYXBpL21jcCIsImhlYWRlcnMiOnsiQXV0aG9yaXphdGlvbiI6IkJlYXJlciBZT1VSX0VQSEVNRVJJU19BUElfS0VZIn19)

Give Claude, Cursor, ChatGPT or any MCP client the ability to **forecast numeric time series with prediction intervals**: sales, demand, inventory, web traffic, signups, revenue, energy load, prices, sensor readings, infrastructure metrics.

Ephemeris runs a panel of open-weights, zero-shot time-series foundation models (TSFMs) behind one API key, plus an accuracy-weighted ensemble of them:

| Model | Publisher | Use by name |
|---|---|---|
| [Chronos-2](https://ephemeris.cascade.industries/models/chronos-2) | Amazon | `chronos2` |
| [TimesFM 2.5](https://ephemeris.cascade.industries/models/timesfm-2-5) | Google Research | `timesfm25` |
| [Toto 2](https://ephemeris.cascade.industries/models/toto-2) | Datadog | `toto2-313m` |
| [TiRex-2](https://ephemeris.cascade.industries/models/tirex-2) | NXAI | `tirex2` |
| [PatchTST-FM r2](https://ephemeris.cascade.industries/models/patchtst-fm) | IBM Granite | `patchtst-fm-r2` |
| [FlowState r1](https://ephemeris.cascade.industries/models/flowstate) | IBM Granite | `flowstate-r1` |

Send history, get quantile forecasts back. No training, no feature engineering, no GPU. Name a model, let Ephemeris **route** to the best fit for your data, or use the **ensemble**, an accuracy-weighted blend of the panel:

- **TIME**: level with the top of the leaderboard (MASE 0.639 vs 0.638 for the leader), with the best average MASE rank of 31 models
- **GIFT-Eval**: CRPS 0.4662 against seasonal naive, better than every model it blends (a few leaderboard entries, including TimesFM-3, score better)

Scored with each benchmark's own harness. Details: [ephemeris.cascade.industries/benchmarks](https://ephemeris.cascade.industries/benchmarks).

## Tools

| Tool | What it does |
|---|---|
| `forecast` | Forecast 1 to 64 series in one call: `route`, `ensemble` or `explicit` mode, any quantiles, optional covariates, horizons up to 512 steps |
| `list_models` | The live panel: health, capabilities, horizon limits, ensemble weights, prices |
| `get_balance` | Spendable credits |
| `get_usage` | Recent requests and what each cost |

## Get an API key

Sign up at [ephemeris.cascade.industries](https://ephemeris.cascade.industries/sign-up), add credits, and create a key (`pc_live_...`) in the dashboard. Pay per forecast, no subscription: [pricing](https://ephemeris.cascade.industries/pricing).

## Connect

Remote server (Streamable HTTP): `https://ephemeris.cascade.industries/api/mcp`, header `Authorization: Bearer pc_live_...`

**Claude Code (plugin: MCP server plus a forecasting skill)**

```
/plugin marketplace add TensorLink-AI/ephemeris-mcp
/plugin install ephemeris@ephemeris
```

You are asked for your API key once; it is stored in your system's secure credential store.

**Claude Code (server only)**

```
claude mcp add --transport http ephemeris https://ephemeris.cascade.industries/api/mcp \
  --header "Authorization: Bearer pc_live_your_key"
```

**Cursor**: one click with [![Add to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=ephemeris&config=eyJ1cmwiOiJodHRwczovL2VwaGVtZXJpcy5jYXNjYWRlLmluZHVzdHJpZXMvYXBpL21jcCIsImhlYWRlcnMiOnsiQXV0aG9yaXphdGlvbiI6IkJlYXJlciBZT1VSX0VQSEVNRVJJU19BUElfS0VZIn19), then replace `YOUR_EPHEMERIS_API_KEY` with your key in Cursor's MCP settings. Or add it by hand:

**Cursor (`.cursor/mcp.json`) and most clients**

```json
{
  "mcpServers": {
    "ephemeris": {
      "url": "https://ephemeris.cascade.industries/api/mcp",
      "headers": { "Authorization": "Bearer pc_live_your_key" }
    }
  }
}
```

**VS Code (`.vscode/mcp.json`)**

```json
{
  "servers": {
    "ephemeris": {
      "type": "http",
      "url": "https://ephemeris.cascade.industries/api/mcp",
      "headers": { "Authorization": "Bearer pc_live_your_key" }
    }
  }
}
```

**Claude Desktop and other clients that only run local (stdio) servers**

```json
{
  "mcpServers": {
    "ephemeris": {
      "command": "npx",
      "args": ["-y", "ephemeris-mcp"],
      "env": { "EPHEMERIS_API_KEY": "pc_live_your_key" }
    }
  }
}
```

**OpenAI Responses API, Anthropic Messages API, Codex, Gemini CLI**: see [the docs](https://ephemeris.cascade.industries/docs#agents).

## Try it

Once connected, ask:

- "Here are my last 18 months of sales: … Forecast the next 6 months with an 80% interval."
- "Forecast next week's hourly traffic from this CSV and tell me the likely peak."
- "Use the ensemble to project daily signups for 90 days; plot the median and the 10th to 90th percentile band."

More in [examples/prompts.md](examples/prompts.md). Without MCP, the same forecast is one REST call: [examples/rest_forecast.py](examples/rest_forecast.py).

## Guides

- [How to give Claude, Cursor or any AI agent a forecasting tool](https://ephemeris.cascade.industries/blog/forecasting-tool-for-ai-agents-mcp): setup for each client
- [Forecasting in LangChain, the OpenAI Agents SDK and the Claude API](https://ephemeris.cascade.industries/blog/forecasting-in-agent-frameworks)
- [Why language models are bad at forecasting numbers](https://ephemeris.cascade.industries/blog/why-language-models-are-bad-at-time), and [the split that works](https://ephemeris.cascade.industries/blog/llm-for-context-forecaster-for-numbers)
- [Which time-series foundation model should I use?](https://ephemeris.cascade.industries/blog/which-forecasting-model-should-i-use)
- [Chronos-2 vs TimesFM 2.5 vs Toto 2 vs TiRex-2](https://ephemeris.cascade.industries/blog/chronos-2-vs-timesfm-vs-toto-vs-tirex)
- Tutorials: [store sales](https://ephemeris.cascade.industries/blog/forecast-store-sales-with-promotions), [electricity load and solar](https://ephemeris.cascade.industries/blog/forecast-electricity-load-and-solar), [ops capacity](https://ephemeris.cascade.industries/blog/capacity-planning-ops-metrics), [sensors and IoT](https://ephemeris.cascade.industries/blog/forecast-sensor-iot-readings)
- [All guides](https://ephemeris.cascade.industries/blog)

## Reference

- Full reference for LLMs: [llms-full.txt](https://ephemeris.cascade.industries/llms-full.txt)
- API docs: [ephemeris.cascade.industries/docs](https://ephemeris.cascade.industries/docs)
- OpenAPI: [openapi-m1.json](https://ephemeris.cascade.industries/openapi-m1.json)
- Status: [ephemeris.cascade.industries/status](https://ephemeris.cascade.industries/status)

The code in this repository (the plugin manifest, skill and stdio bridge) is MIT-licensed. The models keep their own licences, listed on each model page.
