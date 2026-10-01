# Anonymous guestbook

Small native Cloudflare Worker + D1 API for the pen interaction at `https://t1seo.github.io`. Visitors enter a nickname and message; no account, email or password is collected. The website stays on GitHub Pages. The existing browser-local private memo is separate and is never uploaded.

## Provision and deploy

Use an existing **Workers Free** account for the intended zero-monthly-fee setup. D1 does not need a paid database instance. Free quotas can stop service; these protections are not a guarantee of availability under an attack. On a Workers Paid account, aggregate usage can incur charges. Do not upgrade the account to deploy this guestbook.

```sh
cd workers/guestbook
npm ci
npx wrangler login
cp wrangler.example.jsonc wrangler.jsonc
npx wrangler d1 create taewon-guestbook
```

Copy the returned database ID into `wrangler.jsonc`. Set the correct account ID if the login has multiple accounts. Create a **Managed Turnstile** widget restricted to `t1seo.github.io`, and put its public site key in `TURNSTILE_SITE_KEY`. The front end must render the widget with `action: 'guestbook'`. This Worker derives the expected challenge hostname from each exact allowed origin; never add wildcard origins.

Store the production Turnstile secret and a cryptographically random HMAC secret (at least 32 characters) using Wrangler secret prompts. Neither belongs in the repository or Vite environment. The example config is intentionally unusable until real keys and the database binding are supplied. Known Turnstile dummy keys are explicitly rejected by production code.

```sh
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put IP_HASH_SECRET
npm run migrate:remote
npm run check
npm test
npm run deploy
```

Set the website's `VITE_GUESTBOOK_API_URL` to the returned HTTPS Worker URL, then build and deploy the website. No Worker secret is needed by the static site. Keep observability/request logging disabled as in the example; the application does not log IPs, tokens or guestbook text.

For subsequent deployments, apply new migrations before publishing Worker code that uses them. Keep one HMAC secret stable during normal operation: rotating it makes prior abuse identities incomparable until their 48-hour retention expires.

## API

| Route | Response |
| --- | --- |
| `GET /config` | `{siteKey,maxNameLength:40,maxMessageLength:1000}` |
| `GET /entries?cursor=…` | `{entries:[{id,name,message,createdAt}],nextCursor}`; 20 public entries, newest first |
| `POST /entries` | JSON `{name,message,turnstileToken,website:""}` → `201 {entry}` |

Errors use `{error:{code,message,retryAfter?}}`. Rate errors also return `Retry-After` seconds. Messages are untrusted plain text: the front end must use `textContent`, never HTML. A lost POST response can mean the entry was saved; refresh the list instead of automatically resubmitting.

## Abuse controls

- Server-side Turnstile verification on every accepted write: exact hostname and action, maximum five-minute age, single-use Cloudflare validation, five-second timeout, fail closed on outages or missing secrets.
- Exact-origin browser protection and JSON-only requests. Origin checks are not authentication; non-browser clients can forge that header, so Turnstile and database limits remain mandatory.
- Streamed body capped at 8 KiB, nickname at 40 UTF-16 units, message at 1,000; hidden honeypot, link screening, empty/invisible text and excessive character repetition rejection. This is bounded spam screening, not perfect language/content moderation.
- Per visitor: at least 60 seconds between entries, at most five per rolling hour and 20 per UTC day. Same normalized message cannot repeat within 24 hours. Hidden entries still count.
- Entire guestbook: at most 100 entries per UTC day. Before verification, attempts are capped at 30 per rolling ten minutes, 120 per visitor per UTC day and 1,000 total per UTC day.
- Final admission and counter updates happen atomically inside SQLite statements/triggers, so concurrent requests cannot bypass the limits. Global daily counters keep blocked-request database reads small. A short edge block cache avoids repeat database work for already-limited visitors.
- Indexed keyset pages use a 30-second edge cache and canonical cursor keys. Cache hits still consume Worker requests. The browser receives `no-store`; a successful post returns its new entry immediately and invalidates the first page in the current location.

The visitor identity is an HMAC of Cloudflare's trusted `CF-Connecting-IP`; raw IPs are never written, logged or forwarded to Turnstile by this code. IPv6 visitors share a `/64` identity to reduce address rotation. Visitors sharing a network can share a limit. An hourly cleanup deletes attempt records and erases entry IP/content fingerprints once older than 48 hours (up to 49 hours with a healthy cron); public messages remain. If scheduled execution stops, fingerprints remain until the next successful cleanup. Cloudflare can separately process request metadata according to its own policies.

## Owner moderation and emergency pause

There is deliberately no public admin endpoint. Use the Cloudflare D1 console or authenticated Wrangler CLI to inspect and hide a post. Copy its UUID exactly; do not interpolate visitor-provided SQL.

```sh
npx wrangler d1 execute DB --remote --command "SELECT id,name,message,datetime(created_at/1000,'unixepoch') AS created_at FROM guestbook_entries WHERE hidden=0 ORDER BY created_at DESC LIMIT 50"
npx wrangler d1 execute DB --remote --command "UPDATE guestbook_entries SET hidden=1 WHERE id='COPIED-ENTRY-UUID'"
```

Other Cloudflare locations may show a previously cached entry for up to 30 seconds after moderation. To restore a mistaken moderation, set `hidden=0` on that UUID. Prefer hiding over deleting so repeat-message and per-visitor evidence persists until cleanup. Global counters deliberately do not decrease if a row is deleted.

Set `WRITES_ENABLED` to the string `"false"` and redeploy to pause posting while keeping reading available. Restore `"true"` to reopen. This is an operator deployment setting, not an unauthenticated HTTP switch.

## Verification

`npm run check` typechecks the isolated Worker/test project. `npm test` uses the real `workerd` + D1 SQLite implementation in Miniflare, with only the external Turnstile HTTP service replaced in isolated fixtures. There is no production bypass flag. Tests cover concurrent post/attempt limits, global budgets, token rejection/replay/outage, origin and body validation, hashed-IP handling, pagination, public-field privacy, cleanup, cache behavior and emergency pause.

The installed Miniflare 5 release exposes an explicit `convertV4MiniflareOptions` adapter; fixtures use it to keep the documented Worker/D1 setup compatible. Dependencies are development-only; the deployed Worker has no framework or runtime package dependencies.

Official references: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 transactions](https://developers.cloudflare.com/d1/worker-api/d1-database/), [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Cache API scope](https://developers.cloudflare.com/workers/runtime-apis/cache/).
