# Cloudflare anonymous guestbook

## TL;DR

Implement a public, login-free guestbook behind the painted fountain pen using a Cloudflare Worker, D1 and server-verified Turnstile. Keep GitHub Pages hosting, every room asset and the existing private Desk note. Add bounded requests, durable atomic abuse controls, safe plain-text rendering and owner moderation.

- Effort: medium; parallel backend, frontend and account discovery, followed by integration and verification.
- Critical path: account access and API contract → backend/schema and UI → security/DOM/browser checks → Worker deployment → Pages deployment → live verification.
- Implementation authorization is already explicit. Commit, push, main integration and deployment remain authorized; do not introduce another approval gate for routine work.
- Code completion, local verification and live deployment are separate statuses. Missing Cloudflare access must never be described as a working live connection.

## Context

The user requested a guestbook that visitors can sign without logging in, chose Cloudflare, and asked for spam/abuse prevention. They want to avoid additional project costs. Prior giscus research made no code or account changes.

The current project is plain TypeScript, CSS and Vite. `package.json` runs Node's built-in test runner over `src/*.test.ts`; `npm run build` runs strict TypeScript and Vite. `.github/workflows/deploy.yml` builds and publishes `main` to GitHub Pages. There is no existing backend.

Source integration points:

- `src/penthouse-room-markup.ts:20`: fountain pen currently opens `data-action="memo"`.
- `src/penthouse-main.ts:121`: `openPanel` replaces dialog content, restores focus and pauses the pet while open. Any old guestbook controller must be torn down before this replacement.
- `src/penthouse-main.ts:186`: delegated action routing; add `guestbook` without changing other actions.
- `src/penthouse-panel-markup.ts:9`: private memo panel; preserve it and the existing Desk entry at line 13.
- `src/penthouse-personal-storage.ts`: private memo and presets share `taewon.penthouse.personal.v1`. Never migrate, erase, prefill or publish this data.
- `src/penthouse-personal-ui.ts`: private note autosave continues unchanged.

No further preference interview is needed. Tests-after with targeted attack and concurrent-write scenarios follows the established Node test infrastructure.

### Metis-style review addressed

A separate read-only reviewer identified the following gaps, incorporated below: actual Workers Free/Paid status; atomic write controls instead of check-then-insert; cache and bounds for public reads; CORS not being authentication; trusted Cloudflare IP headers only; token expiry/replay/error handling; actual streamed body-byte limits; owner moderation; preservation of the private memo; and explicit distinction between local and live evidence.

## Work objectives and guardrails

The pen opens an English, accessible guestbook drawer. A visitor enters a nickname and message, passes Turnstile and publishes without an account. Messages appear as text only. The private Desk note remains local and available from Desk.

- Do not change room plates, object art, Milky, sound, climate, focus timer or other interactions.
- No guestbook request, Turnstile script, iframe or backend warmup on initial page load. Load only after opening the guestbook; no polling.
- No automatic paid upgrades, new paid subscription, broad Cloudflare DNS changes or unrelated Supabase changes.
- No secret in `VITE_*`, GitHub Pages artifacts, commits, screenshots or logs. The public API URL and public Turnstile sitekey are not secrets.
- No public administrative API. Owner moderation uses authenticated Cloudflare D1/Wrangler SQL.
- No claim that CORS stops scripts or that spam prevention guarantees complete protection.

## API and security contract

The frontend receives only `VITE_GUESTBOOK_API_URL`, the deployed Worker HTTPS origin/base. Runtime configuration supplies the sitekey. Backend files belong under `workers/guestbook/`; frontend modules under `src/penthouse-guestbook*`.

| Endpoint | Request | Response |
| --- | --- | --- |
| `GET /config` | None | `{siteKey, maxNameLength:40, maxMessageLength:1000}` |
| `GET /entries?cursor=...` | Optional bounded opaque keyset cursor | `{entries:[{id,name,message,createdAt}],nextCursor:string|null}`; `createdAt` is ISO text |
| `POST /entries` | JSON `{name,message,turnstileToken,website:''}` | HTTP 201 `{entry}` |
| Errors | Appropriate 400/403/409/413/415/429/503 | `{error:{code,message,retryAfter?}}`; no internal data |

Implementation defaults are fixed for meaningful tests:

- Maximum body **8 KiB**, verified while reading the actual body, not only `Content-Length`. JSON only. Trim and normalize text; name **1–40** characters and message **1–1,000** characters. Reject control characters except ordinary message newline/tab handling. Validate all parsed objects as `unknown`; reject malformed shapes.
- Public output uses `textContent`, never visitor-controlled `innerHTML`. No Markdown, automatic links, embedded HTML, uploads or SQL interpolation.
- `website` is a hidden honeypot; nonempty or malformed values are rejected before external verification. It must not enter keyboard navigation or screen-reader form flow.
- Only Cloudflare's `CF-Connecting-IP` determines network identity in production. Missing identity fails closed for writes. Do not accept a client body field or generic forwarded header as a fallback. Local tests explicitly inject trusted test requests; never ship a production bypass.
- HMAC the IP with a high-entropy Worker secret. Store only its pseudonymous digest in abuse records, never plaintext IP. Do not emit it in public responses or routine logs. Keep abuse metadata separate from public entry data and expire it after 48 hours; keep guestbook entries until owner moderation.
- Rate-limit rejected and accepted POST attempts before expensive verification: at most **30 attempts / 10 minutes** and **120 attempts / UTC day / IP**. Use a bounded atomic update, not process memory.
- Successful posting: minimum **60 seconds** between posts, at most **5 / rolling hour / IP**, **20 / UTC day / IP**, and **100 / UTC day globally**. Include hidden entries in abuse checks so moderation does not reset allowance.
- Reject the same normalized message from the same IP within **24 hours**, even when nicknames differ. An equivalent retry after a lost success response must not create another entry.
- Admission checks and accepted INSERT must form a single atomic database operation/transaction. A sequence of awaited read checks followed by an unconditional insert is unacceptable. Use parameterized SQL, necessary indexes and bound queries; verify the exact SQL against real local SQLite/D1 under concurrent submissions.
- Turnstile Siteverify runs server-side with a **5-second** timeout. Require `success`, the configured production hostname and action **`guestbook`**. Expired/reused tokens, mismatches, malformed upstream results and network failures do not save a message. Never enable a production test key or fail-open flag.
- Set exact allowlisted production origins, normally `https://t1seo.github.io`; development origins exist only in local configuration. Require allowed Origin on POST. CORS is a browser policy, while verification and durable limits apply to every POST.
- List at most **20 entries** per request, newest first, with indexed stable keyset pagination. Reject malformed/overlong cursors. Read queries only expose visible public fields. Cache safe list responses for **30 seconds** with correct origin variation; no full-table counts, unlimited lists or repeated-offset scans. Successful POST immediately adds the returned entry in the active UI.
- A configuration switch can close writes without destroying data. Return an honest unavailable response when required secrets/bindings are absent. Do not fall back to local-only fake posting.

## Verification strategy

All checks are agent-executed. Existing Node tests remain the primary runner. Worker tests need a separate explicit script included in CI because current `npm test` only discovers `src/*.test.ts`. Keep deployment tooling in development dependencies; no new frontend runtime framework is needed.

Evidence should record commands, results and deployment identifiers in `plans/evidence/cloudflare-guestbook-20261001.json` or a similarly dated file. Store detailed transient logs under `/tmp`; never capture tokens or secrets. Official Codex Computer Use in Chrome is the only allowed GUI path. If unavailable, record the limitation and complete local DOM/API checks without substituting another GUI provider.

## Execution strategy

| Task | Owner/files | Dependencies |
| --- | --- | --- |
| 1. Account/deployment discovery | Root, read-only Cloudflare/GitHub discovery | None |
| 2. Worker, schema, security tests | Backend worker: `workers/guestbook/` | Contract above |
| 3. Guestbook frontend and tests | Frontend worker: `src/penthouse-guestbook*` | Contract above |
| 4. Scene wiring, scripts and CI | Root: main/room/panel, package/lock, workflows | 2 and 3 |
| 5. Integrated QA and security audit | Root plus read-only reviewers | 2–4 |
| 6. Deployment, live verification, handoff | Root | 1 and 5 |

Workers are not alone in the shared codebase. Each owns only the assigned paths, commits explicit files and preserves others' edits. Root integrates worker commits and resolves shared configuration changes.

## TODOs

- [ ] **1. Discover actual Cloudflare deployment capability and cost boundary.**
  - Inspect available credentials and official tools without printing secret values; identify the intended account, Workers plan, existing resources and deploy permissions. Reuse the user's account without enabling paid services. A Paid account is not a hard no-spend guarantee: report included usage accurately and keep the service bounded.
  - Record planned Worker/D1 names, Pages hostname, origin allowlist and Turnstile hostname registration. Do not create unrelated resources or change DNS merely to obtain an endpoint.
  - References: current Git remote/Pages workflow; [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).
  - Acceptance/QA: authenticated read returns account and plan evidence with secrets redacted; absent or insufficient credentials are recorded as a concrete deployment limitation while code work continues.
  - Commit: no discovery-only commit; deployment documentation belongs in task 6.

- [ ] **2. Implement Worker, D1 migrations and meaningful security tests.**
  - Use strict typed fetch bindings and small modules, parameterized migrations, indexed entries and expiring pseudonymous abuse records. Implement the complete API/security contract above and an authenticated owner hide/delete procedure. Put production secrets in Worker secret bindings, local examples in non-secret templates and local actual values in ignored files.
  - Tests must exercise actual SQL, not only mocks that mirror query strings. Include accepted insertion and list pagination, every validation/Turnstile error, exact boundary rollover, rate and duplicate behavior, and storage failures.
  - References: [D1 Worker API](https://developers.cloudflare.com/d1/worker-api/d1-database/), [Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/); current strict `tsconfig.json`.
  - Happy QA: submit `A visitor` / `A quiet evening in Seoul.` with a valid injected verification response; receive 201 and find exactly one text entry through GET.
  - Failure QA: simultaneously submit 20 valid requests from one identity at the same instant; exactly one is accepted because of the 60-second interval. Repeat near hourly/day/global boundaries with different tokens and compare persisted counts to limits. Honeypot, expired/replayed token, wrong hostname/action, oversized streaming JSON and database failure never insert.
  - Acceptance: backend typecheck/tests and local real database integration pass; public results contain no IP digest, token or administrative flag.
  - Commit: `feat(guestbook): add guarded Cloudflare guestbook API`, only assigned backend files.

- [ ] **3. Implement the lazy English guestbook drawer.**
  - Match existing dark drawer typography and spacing. Include heading, visible labels, name/message form, character count, concise public-posting notice, verification, submit state, entry list, load-more and clear errors/retry. Preserve draft inputs in memory while errors occur and when practical across drawer switching; never read the private note as a draft.
  - Fetch configuration and entries on opening, then load/render Turnstile explicitly. Disable submitting until ready and while in flight. Reset consumed/expired tokens. Keep user's text after every failed submit; clear it only after confirmed success. No automatic resubmission after an uncertain network response.
  - Use abort/disposal and generation guards so close/switch/reopen cannot populate the wrong panel or leave duplicate widgets/listeners. Avoid polling and permanent timers. Support keyboard focus, `aria-live` status, reduced motion and narrow screens.
  - References: existing `src/penthouse-personal-markup.ts`, `src/penthouse-personal-ui.ts`, `src/penthouse-personal.css` and root dialog lifecycle.
  - Happy QA: mount with a typed API fake, open, type a nickname and multiline message, complete verification, submit once, confirm new text entry and keyboard-accessible load-more.
  - Failure QA: configuration/script/API failure, 429 retry guidance, token expiry, missing API URL and closing during fetch all preserve a working room and show truthful recoverable status. XSS payload `<img src=x onerror=alert(1)>` appears only as text.
  - Acceptance: targeted Node/DOM tests prove zero guestbook network/script work before opening and safe teardown/reopen; rendered 390px and desktop layouts have no overflow.
  - Commit: `feat(guestbook): add lazy anonymous guestbook panel`, only assigned frontend files.

- [ ] **4. Integrate the pen, private Desk memo, build and deployment configuration.**
  - Root changes the pen to `data-action="guestbook"` and an accessible guestbook name; add panel routing and lifecycle cleanup. Keep the existing `memo` action under Desk and the same localStorage key/data. Wire frontend public API URL into Pages build only when the real endpoint is known.
  - Add pinned/reproducible Worker development tooling, backend test/typecheck scripts and required CI checks. Do not include Worker secrets or deployment auth in the browser build. Keep Worker deployment separate and scoped; website remains GitHub Pages.
  - References: `src/penthouse-main.ts:121`, `src/penthouse-room-markup.ts:20`, `src/penthouse-panel-markup.ts:13`, `.github/workflows/deploy.yml`, `package.json`.
  - Happy QA: populate a private note and one preset, open guestbook through the pen, switch to Desk and reopen the same private note; contents remain local and unchanged.
  - Failure QA: missing backend settings show unavailable guestbook state; monitor, climate, Milky and private note continue functioning. No private note text occurs in outgoing guestbook payloads.
  - Acceptance: complete `npm test`, build and backend scripts pass; `git diff` has no room/Milky asset changes; a dist secret scan passes.
  - Commit: `feat(studio): connect the pen to the public guestbook` with explicit integration paths.

- [ ] **5. Execute integrated abuse, lifecycle and visual QA; obtain independent review.**
  - Run the real Worker locally against migrations and the actual frontend root through a DOM harness. Exercise simultaneous writes, duplicate retries, SQL content, hidden-entry exclusion, pagination ties, rejected attempts, UTC boundaries and fail-closed dependencies. Re-run only affected checks after fixes, then the final full suite/build.
  - Use official Codex Computer Use with Chrome for desktop and narrow layout, pen opening, labels/focus, submit/retry and private-note preservation. Do not post permanent public test comments; use a disposable local/test database and remove test rows created for live smoke verification.
  - Independent security review must inspect code paths rather than only test output: trusted identity, atomicity, production test-key/bypass rejection, secret exposure and safe rendering. Record browser limitations honestly if the official provider cannot operate.
  - References: prior `plans/evidence/living-room-20261001.json` evidence style and all task 2–4 files.
  - Acceptance/QA: all targeted and existing tests pass; rejection scenarios create zero entries; actual concurrency remains within limits; visual evidence or exact GUI limitation is recorded; no high-severity review finding remains.
  - Commit: fixes only in the appropriate scoped ownership; evidence consolidated by root.

- [ ] **6. Deploy and verify the real connection.**
  - Create/bind the scoped D1 database, apply migrations, register Turnstile for the production hostname/action and store separate Turnstile/HMAC secrets. Deploy the Worker, verify config/list/rejection behavior, then build Pages with the actual public URL. Do not replace production verification with test credentials to make checks pass.
  - Commit, push and integrate to `main` as already authorized; wait for the exact commit's Pages deployment. Verify live asset versions, API origins, GET output and unauthenticated invalid-post rejection. If valid live posting is tested, hide/delete its known test entry afterward using owner auth.
  - References: `.github/workflows/deploy.yml`, Worker deployment config, [Cloudflare Turnstile hostname management](https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/).
  - Happy QA: production pen opens the real configured guestbook, allowed browser origin loads verified posting UI and live API serves entries; deployed versions match the reported commit.
  - Failure QA: forged direct POST without a valid token remains rejected; disallowed Origin has no write permission; secrets are absent from frontend artifact/search. Confirm emergency write-disable and owner moderation commands are documented and tested locally.
  - Acceptance: report exact commit SHA, Worker endpoint, Pages deployment identifier, checks and remaining limits. If access is blocked, clearly distinguish code-ready/local-tested from not live-connected, with the exact missing capability; never report full deployment success.
  - Commit: `docs(guestbook): record setup, moderation and verification` for scoped documentation/evidence.

## Final verification wave

- [ ] F1 — Plan compliance: anonymous public posting and abuse controls meet the contract.
- [ ] F2 — Security/code review: real atomic limits, strict verification, minimal dependencies and secret isolation.
- [ ] F3 — Real UI/operational QA: keyboard, drawer lifecycle, mobile sizing, errors and live deployment evidence; record any actual provider limitation.
- [ ] F4 — Scope fidelity: old private memo and presets remain private, no initial network burden or unrelated artwork/feature changes.

The user's existing implementation/deployment authorization is sufficient. Final verification is an evidence gate for the agents, not a new user approval request.

## Success criteria

The deployed pen guestbook accepts a verified visitor's name and message without login, rejects invalid/bot/repeated/excessive writes on the server, and renders public content safely. The private memo still works from Desk. No new paid plan is enabled, no secret is exposed, room performance remains unchanged before the guestbook opens, and reported deployment status matches actual evidence.
