# Release operations

The hosted MCP lives in paracast-web and deploys through the existing Vercel Git integration. The npm ephemeris-mcp package is a separate stdio bridge; the dedicated ephemeris-cli package is another independent distribution. A hosted MCP version change does not require either npm package to be published.

## Hosted MCP

Open a PR, require the Application checks / test check, and merge only after preview deployment and checks pass. CI covers tests, TypeScript, shared CLI/API contract drift, tool documentation, production build and PNG renderer/font tracing. Vercel deploys main. The Production MCP smoke workflow runs after successful production deployments, daily, and manually. It checks the production custom domain using the official SDK: version, six tool schemas, and HTTP 401 for a keyless saved-artifact call. It never submits a paid forecast and does not verify authenticated rendering or forecast quality.

A failed smoke check alerts through GitHub Actions; it does not automatically roll back. Investigate logs without exposing credentials. If the release is faulty, promote the last known good deployment through Vercel or revert the PR through the same checks. Re-run Production MCP smoke after recovery. Do not use new paid forecasts as a health probe.

## CLI and bridge packages

Package CI installs locked dependencies, runs its checks, and saves npm tarballs as workflow artifacts. CLI checks exercise the installed tarball, including PNG rendering against a synthetic local service, on Linux and macOS with Node 22 and 24. Windows is not yet release-certified. Bridge CI checks supported Node versions and live keyless tool discovery through the stdio bridge.

npm publication remains separate. No publish token is stored or publication workflow enabled by these changes. Before first CLI publication, confirm npm name ownership, licensing and distribution visibility, configure the registry's trusted publisher for an explicitly approved release workflow, and test installation of the exact candidate tarball. For subsequent releases bump package and lockfile versions, run all checks, publish the verified candidate under the intended tag, then smoke its installed executable. Do not reuse a published version. Roll package consumers back to a previous known-good version if needed; a hosted rollback is independent of npm versions.

The CLI repository is initially private; source access does not imply public npm availability. Web documentation must not advertise an npm installation until it exists. Current CLI source installation uses `npm install --global .` from an authorized checkout.

## Documentation and client refresh

Keep web docs, llms.txt, llms-full.txt, the bridge README and both bundled forecasting skills aligned. The CLI reference and schemas are generated and checked in its own CI. Archived npm READMEs and published skill catalog entries do not change solely because GitHub changes; refresh them through their own release process when needed.

Customers using hosted MCP should reconnect or start a fresh conversation to refresh cached tools. In HeyDitto, Settings → MCP Servers exposes tool discovery. Its published guide currently says SSE-only, so do not promise compatibility with Streamable HTTP without testing the actual connection. PNG/SVG attachment display also depends on the host.
