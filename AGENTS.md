# HyperChat Codex Workflow

## Branch Discipline

- Make code changes on `mv2` first.
- Do not implement feature/fix work directly on `main`/`mv3`.
- If a task starts on another branch, switch to `mv2` before editing unless the user explicitly asks otherwise.

## House Style

- Commit messages should be short, direct, and readable in `git log --oneline`.
- Prefer active voice and concrete verbs:
  - `hide @ in names`
  - `fix lingering yt visuals`
  - `agent upkeep`
- Avoid padded scopes, issue-number prefixes, and changelog-style essays in commit subjects.
- A slightly dry or funny commit is fine if it is still clear at a glance.
- Prefer proper merges when carrying `mv2` work into `mv3` and `mv3-ltl`.
- If MV3 needs follow-up adaptation, keep that as a small, explicit commit after the merge instead of rewriting history or hand-copying changes.

## Code Patterns

- Prefer editing existing modules and utilities over creating one-off files for tiny helpers.
- If a helper obviously belongs in an existing shared utility file, put it there.
- Put shared behavior on `mv2` first; `mv3` and `mv3-ltl` should usually be merge-plus-adaptation branches, not separate feature branches.
- Keep MV3 adaptation narrow:
  - preserve branch-specific build/runtime wiring
  - change only what is required for manifest/background/injection differences
- Prefer render-edge formatting over mutating raw identity data:
  - keep parsed message/channel ids untouched
  - transform display text at component or view-model boundaries
- Prefer resilient lookups over brittle positions:
  - endpoint/type detection over fixed menu indices
  - semantic selectors/utilities over DOM-order assumptions
- When a bug appears in multiple surfaces, prefer fixing the shared parser/messaging/util layer before patching several components by hand.

## Changelog Style

- Keep release bullets short and user-facing.
- Prefer active voice:
  - `Fix admin block/report actions`
  - `Hide leading @ in names`
- Avoid passive voice, filler, and overly technical internal wording unless the release note is specifically for maintainers.

## Codex Dev Runtime

- Run `scripts/codex-dev.sh setup-mcp` once (or per fresh machine) to register the Codex MCP server:
  - name: `chrome-devtools`
  - command: `npx -y chrome-devtools-mcp@latest --browserUrl=http://127.0.0.1:9222`
- Use `scripts/codex-dev.sh watch` once per session to keep Chrome extension builds live in the background.
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
- The reload is intentionally hard (full browser restart) to avoid stale MV2 background page state, service-worker/cache confusion in mixed tooling, and extension asset cache artifacts.

## UI Name Formatting

- For chat author display, hide a leading `@` in UI text while keeping underlying identity data unchanged.
- Use `src/ts/component-utils.ts` (`formatAuthorName`) for this transformation and apply it at render points.

## Emoji Placeholder Handling

- Treat legacy member emoji placeholders (`U+25A1`, rendered as `□`) as emoji-equivalent for filtering.
- In `HIDE_ALL` mode, do not render these placeholders in `MessageRuns.svelte`.
- For emoji-only spam detection, count placeholder-only text runs as emoji in `isAllEmoji`.

## Block/Report Endpoint Handling

- Do not assume fixed menu item indices from `get_item_context_menu` (YouTube may reorder menu items).
- Resolve block/report actions by searching for endpoint types (`moderateLiveChatEndpoint`, `getReportFormEndpoint`) in the response tree.
- Always post `chatUserActionResponse` even when message context params are missing so UI state can fail gracefully.
- Keep proxy fetch request/response events correlated by request id; do not use unscoped global listeners.

## Testbed URL

- Headless validation should open the same `startUrl` used by `vite.config.ts`.
- `scripts/codex-dev.sh go-test` now does this automatically (defaulting by detected mode), and `TEST_URL` can override when needed.

## Cross-Browser Headless Validation Notes

- Always rebuild for the target browser before runtime validation:
  - `yarn build:chrome`
  - `yarn build:firefox`
- Chromium extension validation is most reliable in CI/headless shells with:
  - Playwright Chromium persistent context
  - `headless=false` plus `--ozone-platform=headless`
  - extension args: `--disable-extensions-except=<build>` and `--load-extension=<build>`
- Firefox validation in this environment must set `HOME=/root` before launching browser automation as root, or Firefox exits early with a root/session ownership error.
- For Firefox runtime checks, prefer `https://www.youtube.com/live_chat?v=jfKfPfyJRdk&is_popout=1` for deterministic chat-frame loading in headless mode.

## Embed 404 Notes (MV3)

- The MV3 embed fallback page (`/embed/hyperchat_embed`) can render a centered YouTube logo/error artifact if page elements are not fully removed.
- In `src/scripts/chat-mounter.ts`, treat the HyperChat mount root as the only allowed direct `body` child and aggressively remove fallback embed artifacts.
- If the logo reappears in browser tests, prioritize checking `chat-mounter.ts` cleanup selectors and page timing behavior before touching parser/UI code.

## Operational Commands

- `scripts/codex-dev.sh status` shows watcher/MCP/browser states.
- `scripts/codex-dev.sh logs` prints watcher/browser log file locations.
- `scripts/codex-dev.sh stop` shuts down watcher and the headless browser.
