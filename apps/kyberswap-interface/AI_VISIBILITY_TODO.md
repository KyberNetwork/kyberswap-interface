# AI Visibility TODO

This document turns the external AI Traffic Growth Initiative and agent-readiness findings into an actionable repo-local checklist for `apps/kyberswap-interface`.

## Goals

- Make key KyberSwap pages easier for search and AI crawlers to access, render, and understand.
- Increase the chance that search systems cite `kyberswap.com` instead of third-party sources.
- Focus effort on a small number of high-signal pages before scaling page count.
- Measure citations and AI-referred traffic so this work can be validated.

## Success Metrics

- Increased citation rate for `kyberswap.com` on high-intent prompts.
- Increased sessions from AI referrers such as ChatGPT, Perplexity, and Claude.
- Better crawl coverage for key public URLs.
- Better page-level HTML, metadata, and structured data coverage on core landing pages.

## Current Repo Touchpoints

- `public/robots.txt`
- `public/sitemap.xml`
- `public/llms.txt`
- `public/.well-known/api-catalog`
- `public/.well-known/agent-skills/index.json`
- `public/.well-known/mcp/server-card.json`
- `index.html`
- `src/pages/**`
- `src/components/**`
- analytics/referrer tracking integration points: optional follow-up

## Working Principles

- Prioritize crawlability and rendered HTML before scaling content volume.
- Treat `llms.txt`, FAQ schema, and chat-widget ideas as supporting tactics, not the primary lever.
- Prefer a few strong pages over many thin pages.
- Keep internal links crawlable with standard HTML links.
- Add freshness, authorship, and source attribution to high-value pages.
- Keep heading hierarchy crawlable, unique, and aligned with each page's search intent.

## Agent Readiness Foundation

- [x] `P0` Maintain valid `robots.txt`, `sitemap.xml`, and agent-useful Link headers.
  Assignee: `Engineer`
  Touchpoints: `public/robots.txt`, `public/sitemap.xml`, `etc/nginx.conf`
  Impact: covers the basic IsItAgentReady discovery checks for crawler access, sitemap discovery, and `llms.txt` alternate discovery.
  Status: *Passed in the IsItAgentReady scan.*

- [x] `P0` Add Content Signals to `robots.txt`.
  Assignee: `Engineer + Policy`
  Touchpoint: `public/robots.txt`
  Impact: helps declare AI usage preferences and unlocks the scanner's Level 2 requirement.
  Status: *Implemented with `Content-Signal: ai-train=no, search=yes, ai-input=no`.*

- [x] `P1` Return `404` for missing `.well-known` protocol files instead of the SPA app shell.
  Assignee: `Engineer + DevOps`
  Touchpoint: `etc/nginx.conf`
  Impact: prevents bots and scanners from treating fallback HTML as malformed protocol metadata.
  Status: *Implemented with `try_files $uri =404` for `/.well-known/`.*

## Agent Readiness Deferred Items

- [ ] `P2` Evaluate Cloudflare Markdown for Agents at the edge.
  Assignee: `DevOps + Engineer`
  Touchpoint: Cloudflare zone config outside repo
  Impact: required for the scanner's Level 3, but lower priority than rendered HTML and source-of-truth content.
  Notes: do not implement `Accept: text/markdown` in React runtime. If Cloudflare cannot provide it, consider a narrow static fallback only for source-of-truth pages such as `/` and `/about/kyberswap`.

- [x] `P2` Publish Agent Skills discovery for maintained public workflows.
  Assignee: `Product + Engineer`
  Touchpoints: `public/.well-known/agent-skills/index.json`, `github.com/KyberNetwork/kyberswap-skills`
  Impact: helps agents discover maintained KyberSwap workflows from the root domain without duplicating skill instructions in this repo.
  Status: *Done in repo as a discovery index pointing to the maintained KyberSwap skills repo.*
  Notes: root-domain file is discovery metadata only. Skill instructions remain in the source repo and are pinned by commit URL plus SHA-256 digest.

- [x] `P2` Publish MCP Server Card for docs-backed MCP discovery.
  Assignee: `Engineer`
  Touchpoint: `public/.well-known/mcp/server-card.json`
  Impact: gives agents a root-domain discovery pointer to the real docs-only MCP endpoint.
  Status: *Done in repo as a server card for `https://docs.kyberswap.com/~gitbook/mcp`.*
  Notes: operational MCP repo is linked as related metadata only; no hosted operational endpoint is invented.

- [x] `P3` Evaluate whether KyberSwap should publish an API Catalog.
  Assignee: `Backend/API Owner + Engineer`
  Touchpoints: `public/.well-known/api-catalog`, public API docs
  Impact: useful only if KyberSwap has stable, supported, public APIs to advertise.
  Notes: implemented as a static RFC 9727 Linkset catalog for public docs-backed APIs: Aggregator, Limit Order, and Zap-as-a-Service. API owners should periodically verify OpenAPI spec and health URLs.

## Agent Readiness Explicitly Skipped

- OAuth/OIDC discovery metadata: skipped because KyberSwap is not exposing an OAuth authorization server on the root domain.
- OAuth Protected Resource metadata: skipped because there is no current OAuth-protected resource contract to advertise.
- A2A Agent Card: skipped until KyberSwap has a real agent endpoint and owner.
- WebMCP: skipped/deferred because the docs mention MCP and Documentation MCP, but do not document browser/runtime WebMCP support.
- Web Bot Auth: skipped until bot request authentication becomes a concrete product/security requirement.
- x402, MPP, UCP, ACP, AP2: skipped because the current site is not exposing agentic commerce discovery or paid agent resources.

## Cross-Cutting Priorities

- [ ] `P1` Add freshness, authorship, and source attribution to high-value pages.
  Assignee: `Engineer + Content`
  Touchpoints: `/about/kyberswap`, future comparison pages, future learn/blog pages, future chain pages.
  Goal: improve trust signals and make facts easier to verify and cite.

## Measurement And Accessibility

- [ ] `P3` Measure page load time before optimizing.
  Assignee: `Engineer`
  Tracker status: `Not started`
  Can Dev do now: `Yes`
  Requires SSR/Prerender: `No`
  Requires Content: `No`
  Notes: run Lighthouse/Web Vitals for audited routes before changing performance-sensitive code.

- [ ] `P3` Profile interaction response time before changes.
  Assignee: `Engineer`
  Tracker status: `Not started`
  Can Dev do now: `Yes`
  Requires SSR/Prerender: `No`
  Requires Content: `No`
  Notes: profile INP and interaction bottlenecks before changing UI or state flows.

- [ ] `P3` Inspect render-blocking resources after measurement.
  Assignee: `Engineer`
  Tracker status: `Not started`
  Can Dev do now: `Yes`
  Requires SSR/Prerender: `No`
  Requires Content: `No`
  Notes: after measurement, inspect fonts, scripts, route chunks, and critical CSS.

- [ ] `P3` Prefer meaningful alt and ARIA labels over image title attributes.
  Assignee: `Engineer`
  Tracker status: `Not started`
  Can Dev do now: `Yes`
  Requires SSR/Prerender: `No`
  Requires Content: `No`
  Notes: improve accessibility with useful alt text and ARIA labels; do not add image title attributes only for scanner compliance.

## Semantic HTML And Crawlability

- [ ] `P1` Add or restore semantic H1 tags on priority routes.
  Assignee: `Engineer`
  Tracker status: `Blocked`
  Repo status: `Partially implemented as hidden SEO headings`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Yes`
  Requires Content: `Partial`
  Touchpoints: `/`, `/about/kyberswap`, `/swap/ethereum`, `/earn/pools`.
  Notes: hidden H1 coverage exists for `/swap/*`, `/limit/*`, `/cross-chain`, `/earn/pools`, `/earn/positions`, `/market-overview`, and `/campaigns/*`; `/earn` and `/about/kyberswap` have semantic visible H1s. Raw scanner resolution still depends on SSR/prerender.

- [ ] `P1` Convert section titles to H2 where appropriate.
  Assignee: `Engineer`
  Tracker status: `Blocked`
  Repo status: `Partially implemented as hidden SEO headings`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Yes`
  Requires Content: `Partial`
  Touchpoints: priority landing pages and content sections.
  Notes: hidden H2 coverage exists for `/swap/*`, `/limit/*`, `/cross-chain`, `/earn/pools`, `/earn/positions`, `/market-overview`, and `/campaigns/*`; `/earn` pool sections now use semantic visible H2s. Continue with visible semantic headings as pages are rebuilt or prerendered.

- [ ] `P1` Make navigation links crawl-detectable with real anchors.
  Assignee: `Engineer`
  Tracker status: `Blocked`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Yes`
  Requires Content: `No`
  Touchpoints: header navigation, mobile menu, footer, high-value internal links.
  Notes: convert crawl-relevant navigation/internal links to real HTML anchors or Link elements. Blocked by Tailwind/navigation migration risk and SSR/prerender for raw scanner resolution.

- [ ] `P1` Audit important internal links to ensure they resolve to crawlable HTML links.
  Assignee: `Engineer`
  Tracker status: `Blocked`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Yes`
  Requires Content: `No`
  Touchpoints: nav, footer, comparison links, chain hubs, learn hub, detail page links.
  Goal: make discovery of important pages deterministic for bots.

## Metadata And Schema

- [x] `P2` Fix overlong meta descriptions.
  Assignee: `Content + Engineer`
  Tracker status: `Blocked before Product approval`
  Repo status: `Implemented`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Partial`
  Requires Content: `Yes`
  Touchpoints: `index.html`, `src/components/Seo/RouteSeo.tsx`
  Notes: key route metadata has been updated; raw scanner resolution may still need SSR/prerender.

- [ ] `P2` Align meta descriptions with on-page content.
  Assignee: `Content + Engineer`
  Tracker status: `Blocked`
  Repo status: `Partially implemented via hidden H1/H2 copy only; visible content unchanged`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Yes`
  Requires Content: `Yes`
  Touchpoints: `/`, `/earn/pools`.
  Notes: metadata wording is present in route metadata and hidden SEO headings for the implemented routes. Visible page summaries were intentionally left unchanged; visible alignment still needs UI/content changes and SSR/prerender for raw scanner resolution.

- [ ] `P2` Align title with on-page content.
  Assignee: `Content + Engineer`
  Tracker status: `Blocked`
  Repo status: `Partially implemented for /earn semantic heading and hidden headings`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Yes`
  Requires Content: `Yes`
  Touchpoints: `/`, `/earn/pools`.
  Notes: `/earn` now exposes its visible landing heading as H1, and hidden headings exist for `/earn/pools` plus related high-intent routes. Homepage title/body alignment and visible title/body alignment still need visible copy updates and SSR/prerender.

- [ ] `P1` Add WebPage JSON-LD schema to `/earn` and `/earn/pools`.
  Assignee: `Engineer`
  Tracker status: `Blocked`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Yes`
  Requires Content: `No`
  Notes: use consistent route metadata, but scanner resolution depends on SSR/prerender.

- [ ] `P2` Defer Service schema until `/about/kyberswap` service copy is approved.
  Assignee: `Content + Engineer + Product`
  Tracker status: `Deferred`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Yes`
  Requires Content: `Yes`
  Notes: Service schema needs visible approved service description and SSR/prerender before it is worth adding.

- [ ] `P2` Defer Product schema on `/swap/ethereum` unless Product approves framing.
  Assignee: `Engineer + Product`
  Tracker status: `Deferred`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Yes`
  Requires Content: `Yes`
  Notes: do not force Product schema for swap unless visible content supports that framing; consider WebApplication or Service later.

- [x] `P3` Keep BreadcrumbList schema skipped unless breadcrumb UI exists.
  Assignee: `Engineer + Product`
  Tracker status: `Skipped`
  Can Dev do now: `No`
  Requires SSR/Prerender: `No`
  Requires Content: `Yes`
  Notes: Searchable reports BreadcrumbList missing, but the app does not expose visible breadcrumb UI. Do not add BreadcrumbList JSON-LD only for scanner compliance.

## Content Approval Inputs

- [x] `P2` Improve `/earn/pools` main heading summary.
  Assignee: `Content`
  Tracker status: `Blocked`
  Repo status: `Implemented as hidden SEO heading`
  Can Dev do now: `No`
  Requires SSR/Prerender: `No`
  Requires Content: `Yes`
  Notes: `/earn/pools` description has been split across hidden H1/H2. Visible heading copy remains unchanged.

- [ ] `P2` Use intent-aligned headings on `/earn` and `/earn/pools`.
  Assignee: `Content + Engineer`
  Tracker status: `Blocked`
  Repo status: `Partially implemented for /earn visible semantics and /earn/pools hidden headings`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Yes`
  Requires Content: `Yes`
  Notes: `/earn` visible landing title is now semantic H1, pool sections use semantic H2, and `/earn/pools` has hidden H1/H2 coverage. Visible `/earn/pools` heading remains unchanged; raw scanner resolution still needs SSR/prerender.

- [ ] `P2` Add clear intro on `/earn` and `/earn/pools`.
  Assignee: `Content`
  Tracker status: `Blocked`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Yes`
  Requires Content: `Yes`
  Notes: add a short problem/answer intro only after Growth/Product approves copy; render it in initial HTML when SSR/prerender exists.

- [ ] `P2` Add approved competitive differentiators.
  Assignee: `Content + Legal/Compliance + Product`
  Tracker status: `Blocked`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Yes`
  Requires Content: `Yes`
  Notes: requires factual, defensible positioning and likely Legal/Compliance review; engineering should not invent claims.

- [ ] `P2` Add use cases or examples section.
  Assignee: `Content`
  Tracker status: `Blocked`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Yes`
  Requires Content: `Yes`
  Notes: requires approved examples or case-study direction before building sections.

- [ ] `P3` Add FAQ or common objections section.
  Assignee: `Content`
  Tracker status: `Blocked`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Yes`
  Requires Content: `Yes`
  Notes: requires approved FAQ/common objection content before schema or UI work.

- [ ] `P3` Add FAQPage JSON-LD after visible FAQ content exists.
  Assignee: `Content + Engineer`
  Tracker status: `Blocked`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Yes`
  Requires Content: `Yes`
  Touchpoints: `/about/kyberswap`, `/swap/ethereum`
  Notes: add FAQPage only after approved FAQ content is visible on the page.

- [ ] `P3` Add social proof, testimonials, or logos if approved.
  Assignee: `Content + Legal/Compliance`
  Tracker status: `Blocked`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Yes`
  Requires Content: `Yes`
  Notes: use only approved metrics, logos, partners, testimonials, or public proof. Do not invent social proof.

- [ ] `P3` Add trust signals where approved.
  Assignee: `Content + Legal/Compliance`
  Tracker status: `Blocked`
  Can Dev do now: `No`
  Requires SSR/Prerender: `Yes`
  Requires Content: `Yes`
  Notes: trust/security language for `/about/kyberswap` and `/earn/pools` needs Product/Legal approval; avoid guarantees unless explicitly approved.

- [ ] `P3` Add features table on `/about/kyberswap`.
  Assignee: `Content + Product`
  Tracker status: `Blocked`
  Can Dev do now: `No`
  Requires SSR/Prerender: `No`
  Requires Content: `Yes`
  Notes: feature table may be useful; pricing table likely does not fit. Product must approve feature list and framing.

- [ ] `P3` Improve data visuals and captions on `/swap/ethereum`.
  Assignee: `Engineer`
  Tracker status: `Not started`
  Can Dev do now: `Yes`
  Requires SSR/Prerender: `No`
  Requires Content: `Partial`
  Notes: improve labels or captions around existing swap visuals only where they clarify meaning; low priority.

## Recommended Initial Target Pages

- [x] `/`
- [x] `/about/kyberswap`
- [x] `/swap/ethereum`
- [x] `/earn/pools`
- [ ] highest-intent comparison anchors on `/about/kyberswap`

## Phase 1 - Foundation

- [x] `P0` Allowlist search and AI bots in both `robots.txt` and edge security rules.
  Assignee: `Engineer`
  Touchpoints: `public/robots.txt`, CDN/WAF config outside repo.
  Goal: make sure `OAI-SearchBot`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Perplexity-User`, `Googlebot`, and `Bingbot` are not blocked.
  Status: *Repo-local portion completed in robots.txt. Edge/CDN allowlisting remains outside the scope of this repo.*

- [x] `P0` Add `noindex` or crawl controls for thin, duplicate, filter, and utility URLs.
  Assignee: `Engineer`
  Touchpoints: route metadata, head management, router/stateful URLs, pages that generate low-value variants.
  Goal: concentrate crawl/index effort on pages worth citing.
  Status: *Implemented via RouteSeo runtime metadata and route/query-based noindex rules.*

- [x] `P0` Fix canonicalization and duplicate URL handling.
  Assignee: `Engineer`
  Touchpoints: `index.html`, page head metadata, redirects, parameter handling.
  Goal: prevent multiple URL versions from splitting signals.
  Status: *Implemented via route-level canonical tags and duplicate URL handling in head metadata.*

- [x] `P1` Add JSON-LD schema to home and about pages.
  Assignee: `Engineer`
  Source plan impact: `High`
  Local assessment: `High`
  Notes: add only schema that matches visible content; avoid speculative markup.
  Status: *Implemented for home and about pages using Organization/WebSite/AboutPage structured data.*

- [ ] `P1` Add a "How KyberSwap compares" table to `/about/kyberswap`.
  Assignee: `Content`
  Source plan impact: `High`
  Local assessment: `Very High`
  Notes: prioritize factual comparisons against the most common competitors and cite sources where possible.

- [ ] `P2` Add a "Compare" column to the site footer.
  Assignee: `Engineer`
  Source plan impact: `Medium`
  Local assessment: `Medium`
  Notes: footer links should point to crawlable comparison anchors.

- [x] `P3` Add `llms.txt` to the domain root.
  Assignee: `Engineer + Content`
  Source plan impact: `High`
  Local assessment: `Low`
  Touchpoint: `public/llms.txt`
  Notes: treat as a low-cost experiment, not a core KPI driver.
  Status: *Implemented as a lightweight root-domain experiment.*

## Phase 2 - Core Pages

- [ ] `P2` Add HowTo schema to swap and earn guides.
  Assignee: `Engineer + Content`
  Source plan impact: `High`
  Local assessment: `Medium`
  Notes: only after the underlying guide content is strong enough to deserve step-by-step markup.

- [ ] `P0` Enable SSR, SSG, or equivalent pre-rendered HTML for the initial target pages first.
  Assignee: `Engineer`
  Source plan impact: `High`
  Local assessment: `Very High`
  Notes: start with `/`, `/about/kyberswap`, `/swap/ethereum`, and `/earn/pools`; expand only after the first wave is validated.

- [ ] `P1` Add per-chain sections to `/earn/pools`.
  Assignee: `Engineer + Content`
  Source plan impact: `High`
  Local assessment: `High`
  Notes: keep sections concrete with chain-specific pools, APR ranges, TVL, and links.

- [ ] `P0` Rebuild `/about/kyberswap` with full static content.
  Assignee: `Engineer + Content`
  Source plan impact: `High`
  Local assessment: `Very High`
  Notes: treat this page as the AI-facing source of truth for KyberSwap.

- [ ] `P1` Add per-chain sections to `/swap/*`.
  Assignee: `Engineer + Content`
  Source plan impact: `High`
  Local assessment: `High`
  Notes: prioritize the highest-demand chains first instead of writing all chains at once.

## Phase 3 - New Pages

- [x] `P2` Publish a refreshed `sitemap.xml` including all approved public pages.
  Assignee: `Engineer`
  Source plan impact: `Medium`
  Local assessment: `Medium`
  Notes: sitemap updates should follow URL quality decisions, not lead them.
  Status: *Implemented for the current approved public routes in scope.*

- [ ] `P1` Expand `/about/kyberswap` with anchor-linked comparison sections.
  Assignee: `Engineer + Content`
  Source plan impact: `High`
  Local assessment: `High`
  Notes: this is stronger than a short comparison table because it gives AI systems more citeable context.

- [ ] `P2` Build a `/learn` hub with educational articles.
  Assignee: `Engineer + Content`
  Source plan impact: `High`
  Local assessment: `High`
  Notes: publish only differentiated content backed by real product knowledge and data.

- [ ] `P1` Build `/chains/[chain]` landing pages.
  Assignee: `Engineer + Content`
  Source plan impact: `High`
  Local assessment: `High`
  Notes: start with a small batch of priority chains before attempting full coverage.

- [ ] `P3` Evaluate whether an AI search widget on `/about/kyberswap` is worth building.
  Assignee: `Engineer`
  Source plan impact: `Medium`
  Local assessment: `Low`
  Notes: deprioritized until crawlability, core content, and measurement are in place.

- [ ] `P2` Build `/token/[symbol]` pages only for a small set of high-value tokens.
  Assignee: `Engineer + Content`
  Source plan impact: `High`
  Local assessment: `Medium`
  Notes: avoid mass-producing thin token pages.

## Phase 4 - Ongoing

- [ ] `P2` Publish chain-specific blog posts targeting verified query gaps.
  Assignee: `Content`
  Source plan impact: `Medium`
  Local assessment: `Medium`
  Notes: quality and freshness matter more than volume.

- [ ] `P1` Expand `/learn` based on observed AI query gaps and missing citations.
  Assignee: `Content`
  Source plan impact: `High`
  Local assessment: `High`
  Notes: this should become the main ongoing content loop.

- [ ] `P0` Monitor AI citation rate for core brand and category prompts.
  Assignee: `Engineer`
  Source plan impact: `High`
  Local assessment: `Very High`
  Notes: without this, it is hard to validate whether the work is producing visibility gains.

- [ ] `P1` Review AI-referred sessions in analytics on a recurring cadence.
  Assignee: `Engineer`
  Source plan impact: `High`
  Local assessment: `Very High`
  Notes: setup should happen before implementation starts; this task covers the ongoing review cadence after launch.

- [ ] `P1` Update comparison tables on a fixed review cadence.
  Assignee: `Content`
  Source plan impact: `Medium`
  Local assessment: `High`
  Notes: outdated comparisons can become a trust liability quickly.

- [ ] `P3` Refresh `llms.txt` if the file proves useful.
  Assignee: `Content`
  Source plan impact: `Medium`
  Local assessment: `Low`
  Notes: do not spend recurring time here until the tactic shows value.

## Suggested Delivery Order

1. Crawler access and index controls.
2. Canonicalization, crawlable links, and key-page metadata.
3. Rendered HTML improvements for the initial target pages.
4. Rebuild `/about/kyberswap` as the source-of-truth page.
5. Add comparison content and top-chain sections to `/swap/ethereum` and `/earn/pools`.
6. Scale new page types only after the first wave shows measurable impact.

## Explicit Deprioritizations

- Avoid launching 17 chain pages and 50 token pages in one pass.
- Avoid treating `llms.txt` as a major ranking lever.
- Avoid assuming schema markup can compensate for weak rendered content.
- Avoid building AI widgets before crawlability and measurement are solved.
