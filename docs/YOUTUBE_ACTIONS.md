# YouTube Actions (Dev Notes)

This repo implements YouTube "chat actions" (block, report, delete/retract, and future mod actions) by calling Innertube endpoints based on data from the message + its context menu.

This doc exists so we do not re-learn the same YouTube quirks every time.

## Rule 0: Copy The Real Request

If native YouTube can do it and HyperChat cannot, assume our request is missing a header, context field, or tracking param. Do not "guess until it works".

When in doubt, capture:

- One request flow in native UI (extension off)
- The same flow in HyperChat (extension on)

Then diff the request bodies + headers and make HyperChat match.

## Request Inputs You Must Preserve

YouTube actions almost always depend on these fields. If you drop any of them, you get silent no-ops, missing menu items, or opaque errors.

- `context`: from `ytcfg` (`INNERTUBE_CONTEXT`)
- API key: `INNERTUBE_API_KEY`
- `clickTrackingParams`: from the UI element that spawned the action
- Message-specific params: whatever YouTube gives you for that message/menu item (`params`, `trackingParams`, etc.)
- Account identity: `x-goog-authuser` must match the active YouTube account (multi-login breaks without it)
- Visitor identity: `x-goog-visitor-id`
- Client identity: `x-youtube-client-name` and `x-youtube-client-version`

If you are unsure where a value comes from, stop and find it in:

- `ytcfg` on the page (`ytcfg.get(...)`)
- the context menu response tree
- the message renderer tree that created the menu

## Auth: SAPISIDHASH Still Matters

Some actions require a valid `Authorization: SAPISIDHASH ...` header (computed from cookies).

Do not remove SAPISIDHASH support just because a specific action seems to work without it on your machine. It can break on:

- different accounts
- different regions
- different browsers
- multi-login sessions

Treat "native works" as the ground truth: if native sends SAPISIDHASH for that call, we should too.

## Endpoint Discovery: Never Hardcode Indices

YouTube reorders context menu items. Never assume "block is item 3".

Instead:

- request `get_item_context_menu`
- search the response tree for endpoint *types*
- prefer endpoint/type checks over label checks

Examples:

- block: `moderateLiveChatEndpoint` (and friends)
- report: `getReportFormEndpoint` (flow can be multi-step)
- delete/retract: look for the delete/retract endpoint in the same way

If an endpoint is missing, log enough context to diagnose:

- which endpoint types we found
- which ones we did not
- which message/menu payload we used to ask for the menu

## Keep Requests Correlated

If you proxy Innertube calls through a background/service worker, keep request/response events correlated by request id.

Do not use global listeners or "last response wins" patterns. Two actions can overlap, and the wrong response breaks the UI in confusing ways.

## UI State: Be Honest

When we apply an action locally, do it only when YouTube confirms success.

For delete/retract:

- on success: remove the message from display (and tolerate YouTube later echoing a "retracted" update)
- on failure: keep it visible and surface an error

If you fake success, users will trust the UI less than the native UI.

## HAR + DevTools Tips (So You Do Not Lose The Payload)

- Enable "Preserve log" before doing the flow.
- Export as "HAR with content" so request/response bodies are included.
- If a body looks truncated, open the request and use the raw view in DevTools (Chrome often still has it).

## Where This Usually Breaks

- Missing `x-goog-authuser` (multi-account sessions)
- Dropped `clickTrackingParams` / message `params`
- Wrong Innertube client name/version (YouTube serves different schemas)
- SAPISIDHASH removed or computed for the wrong origin
- Context menu parsing tied to item index instead of endpoint types

