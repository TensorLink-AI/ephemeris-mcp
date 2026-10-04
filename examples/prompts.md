# Example prompts

Each works with the Ephemeris MCP server connected. The agent reads your data, picks the frequency and horizon, and calls `forecast`.

## Business

- "Monthly revenue for the last 3 years is below. Forecast the next 12 months with 10th, 50th and 90th percentiles, and tell me the chance we stay above $1.2M a month."
- "Forecast daily orders for each of these 20 SKUs for the next 28 days, and flag the ones whose upper band exceeds current stock."
- "Our weekly signups are in signups.csv. Project the next quarter using the ensemble."

## Operations and infrastructure

- "Here is 15-minute CPU utilisation for the last two weeks. Forecast the next 48 hours and tell me when we are likely to cross 80%."
- "Forecast hourly API requests for the next 7 days so I can size the autoscaler; give me the 95th percentile."

## Energy, prices, sensors

- "Hourly electricity load is attached, with the temperature forecast for the next 3 days. Forecast load using temperature as a known-future covariate."
- "Forecast the next 30 daily closing values of this series and show the uncertainty band, not just a line."

## Choosing a model

- "List the Ephemeris models and tell me which ones support covariates."
- "Forecast this with TimesFM 2.5 and with the ensemble, and compare the two."
