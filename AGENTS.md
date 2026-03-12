# HyperChat Codex Workflow (MV3 Main)

## Branch Discipline

- `main` is the MV3 integration branch.
- Land generic feature/fix changes on `mv2` first, then merge into `main`.
- On `main`, limit direct edits to MV3-specific adaptation, verification, and follow-up fixes after merge.

## Codex Dev Runtime

- Run `scripts/codex-dev.sh setup-mcp` once (or per fresh machine) to register the Codex MCP server:
  - name: `chrome-devtools`
  - command: `npx -y chrome-devtools-mcp@latest --browserUrl=http://127.0.0.1:9222`
- Use `scripts/codex-dev.sh watch` once per session to keep Chrome extension builds live in the background.
- On `main`, this resolves to MV3 scripts (`dev:chrome`/`build:chrome`) and `build/chrome` output automatically.
- On `mv2`, watcher mode prefers `npm run start:none` so build watch stays alive without separate browser autolaunch.
- Start headless browser testing only when explicitly requested (for example: "go test", "test this", "run browser test").
- For test runs, use `scripts/codex-dev.sh go-test`. This guarantees:
  - MCP configuration is present
  - watcher is running
  - headless Chromium is restarted with a fresh profile and extension reload
- If Chromium fails to start in a sandboxed/snap environment, set `CHROME_BIN` to a non-snap Chrome/Chromium binary before `go-test`.

## Reload Policy

- After significant extension-runtime changes, run `scripts/codex-dev.sh reload` before validation.
- Treat these as significant by default:
  - `src/scripts/**`
  - `src/components/**`
  - `src/manifest.json`
  - `vite.config.ts`
  - settings/storage/messaging code under `src/ts/**`
- The reload is intentionally hard (full browser restart) to avoid stale MV3 service-worker state, extension cache artifacts, and mixed-profile debugging drift.

## UI Name Formatting

- For chat author display, hide a leading `@` in UI text while keeping underlying identity data unchanged.
- Use `src/ts/author-name.ts` (`formatAuthorName`) for this transformation and apply it at render points.

## Testbed URL

- Headless validation should open the same `startUrl` used by `vite.config.ts`.
- `scripts/codex-dev.sh go-test` now does this automatically (defaulting by detected mode), and `TEST_URL` can override when needed.

## Operational Commands

- `scripts/codex-dev.sh status` shows watcher/MCP/browser states.
- `scripts/codex-dev.sh logs` prints watcher/browser log file locations.
- `scripts/codex-dev.sh stop` shuts down watcher and the headless browser.
