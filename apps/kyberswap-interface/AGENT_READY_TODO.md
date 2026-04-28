# Agent Ready TODO

This document tracks repo-local work from the `isitagentready.com` scan for `https://kyberswap.com`.

Scan timestamp: `2026-04-28T02:05:07.306Z`

Current score: `Level 1 - Basic Web Presence`

## Goals

- Improve machine-readable discovery for AI agents without overfitting the product to immature protocols.
- Fix scanner findings that also improve real crawler behavior.
- Avoid implementing auth, MCP, or commerce discovery files unless KyberSwap has a real public capability to expose.
- Keep this separate from `AI_SEO_TODO.md`, which focuses on crawlable content, citations, and SEO/AI visibility.

## Decision Matrix

| Scanner check | Status | Decision | Priority | Rationale |
| --- | --- | --- | --- | --- |
| `robots.txt` | Pass | Keep | Done | `public/robots.txt` exists, allows crawling, and declares the sitemap. |
| `sitemap.xml` | Pass | Keep | Done | `public/sitemap.xml` is discoverable from `robots.txt`. |
| AI bot rules | Pass | Keep | Done | Wildcard `User-agent: *` applies to AI bots. Add named bot sections only if policy needs finer control. |
| Content Signals | Fail | Do | Done | This is the only listed requirement for Level 2. It is cheap and expresses crawler usage preferences clearly. |
| Link headers | Fail | Do if edge config supports it | P1 | Useful for discoverability, especially for `sitemap`, `llms.txt`, and future agent metadata. May require CDN/nginx/header config outside React code. |
| Markdown negotiation | Fail | Consider later | P2 | Useful for content-heavy pages, but KyberSwap is a SPA. Real value depends on prerender/static content work from `AI_SEO_TODO.md`. |
| Web Bot Auth | Neutral | Ignore for now | P3 | Not required unless KyberSwap wants authenticated bot verification workflows. Current scanner result is informational. |
| API Catalog | Fail | Consider only with official public API inventory | P2 | Do not publish an API catalog until the team agrees which APIs are public, supported, stable, and safe to advertise. Missing `.well-known` files should now return 404 if production uses repo nginx config. |
| OAuth discovery | Fail | Ignore | P3 | KyberSwap does not appear to expose a first-party OAuth/OIDC authorization server on `kyberswap.com`. Publishing placeholder metadata would be misleading. |
| OAuth Protected Resource | Fail | Ignore | P3 | Not relevant unless there are protected API resources that use OAuth resource metadata. |
| MCP Server Card | Fail | Ignore until real MCP server exists | P3 | Do not add MCP discovery unless KyberSwap operates a supported MCP server. |
| A2A Agent Card | Fail | Ignore until real agent exists | P3 | Do not claim A2A capability without an agent endpoint and support ownership. |
| Agent Skills | Fail | Consider after stable agent workflows exist | P2 | Could be valuable for documented workflows such as swap, earn, bridge, or token research, but only if maintained and accurate. |
| WebMCP | Unable to check | Ignore | P3 | Scanner failed with a runtime error. No action until a real WebMCP integration is planned. |
| x402 | Neutral | Ignore | P3 | Not relevant unless KyberSwap wants x402-paid resources. |
| MPP | Neutral | Ignore | P3 | Not relevant unless KyberSwap exposes agentic payment discovery. |
| UCP | Neutral | Ignore | P3 | Not relevant for the current site. |
| ACP | Neutral | Ignore | P3 | Not relevant for the current site. |

## Recommended Work

- [x] `P0` Add Content Signals to `public/robots.txt`.
  Assignee: `Engineer + Policy`
  Touchpoint: `public/robots.txt`
  Proposed directive:
  ```txt
  Content-Signal: ai-train=no, search=yes, ai-input=no
  ```
  Notes: confirm the policy stance before shipping. `search=yes` helps search-style AI discovery; `ai-train=no` and `ai-input=no` are conservative defaults.
  Status: *Implemented in `public/robots.txt` using the conservative policy from the scanner prompt.*

- [ ] `P1` Decide and implement discovery `Link` headers.
  Assignee: `Engineer + DevOps`
  Touchpoints: `etc/nginx.conf`, CDN/Cloudflare config outside repo
  Candidate links:
  ```http
  Link: <https://kyberswap.com/sitemap.xml>; rel="sitemap"; type="application/xml"
  Link: <https://kyberswap.com/llms.txt>; rel="alternate"; type="text/plain"
  ```
  Notes: prefer edge/CDN headers if production traffic terminates before nginx.

- [x] `P1` Stop SPA fallback from returning `200 text/html` for missing `.well-known` JSON files.
  Assignee: `Engineer + DevOps`
  Touchpoint: `etc/nginx.conf`
  Goal: missing machine-readable files should return `404`, not the React app shell.
  Notes: this improves scanner accuracy and prevents bots from treating HTML fallback as malformed protocol documents.
  Status: *Repo nginx config now uses `try_files $uri =404` for `/.well-known/`. DevOps still needs to verify this nginx config is on the production request path behind Cloudflare.*

- [ ] `P2` Evaluate whether KyberSwap should publish an API catalog.
  Assignee: `Backend/API Owner + Engineer`
  Touchpoints: potential `public/.well-known/api-catalog`, public API docs
  Decision needed: list only stable, public, documented APIs with ownership and support expectations.

- [ ] `P2` Revisit Markdown negotiation after prerender/static content work.
  Assignee: `Engineer + Content`
  Dependencies: SSR/SSG or generated HTML from `AI_SEO_TODO.md`
  Notes: markdown responses are most valuable for source-of-truth pages such as `/about/kyberswap`, not app-heavy trading screens.

- [ ] `P2` Consider Agent Skills only for maintained public workflows.
  Assignee: `Product + Engineer`
  Candidate workflows: explain KyberSwap, swap tokens, find pools, compare routing, understand risks.
  Notes: do not publish skill instructions that can drift from product behavior or compliance guidance.

## Explicitly Skipped

- OAuth/OIDC discovery metadata: skipped because KyberSwap is not exposing an OAuth authorization server on the root domain.
- OAuth Protected Resource metadata: skipped because there is no current OAuth-protected resource contract to advertise.
- MCP Server Card: skipped until there is a real MCP server and owner.
- A2A Agent Card: skipped until there is a real agent endpoint and owner.
- Web Bot Auth: skipped until bot request authentication becomes a concrete product/security requirement.
- x402, MPP, UCP, ACP: skipped because the current KyberSwap site is not exposing agentic commerce discovery or paid agent resources.

## Suggested Delivery Order

1. Confirm Content Signals policy and update `robots.txt`.
2. Verify `.well-known` soft-404 behavior at nginx/CDN level after deploy.
3. Add discovery `Link` headers if production infrastructure supports them cleanly.
4. Re-run `isitagentready.com` and record the new level.
5. Decide whether API Catalog, Markdown negotiation, or Agent Skills have enough product value to justify maintenance.

## Validation

- Re-run the scanner at `https://isitagentready.com/` for `https://kyberswap.com`.
- Verify direct HTTP responses:
  ```sh
  curl -i https://kyberswap.com/robots.txt
  curl -i https://kyberswap.com/.well-known/api-catalog
  curl -I https://kyberswap.com/
  ```
- Expected near-term result: Level 2 after Content Signals are live, with fewer false protocol failures after `.well-known` paths stop returning SPA HTML.
