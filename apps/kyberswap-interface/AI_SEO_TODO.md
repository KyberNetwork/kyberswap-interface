# AI SEO TODO

This document turns the external AI Traffic Growth Initiative into an actionable repo-local checklist for `apps/kyberswap-interface`.

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
- `public/llms.txt` (to be added if approved)
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

## Added Priority Tasks Not Explicitly Covered In The Original Plan

- [ ] `P1` Audit important internal links to ensure they resolve to crawlable HTML links.
  Assignee: `Engineer`
  Touchpoints: nav, footer, comparison links, chain hubs, learn hub, detail page links.
  Goal: make discovery of important pages deterministic for bots.

- [ ] `P1` Add freshness, authorship, and source attribution to high-value pages.
  Assignee: `Engineer + Content`
  Touchpoints: `/about/kyberswap`, future comparison pages, future learn/blog pages, future chain pages.
  Goal: improve trust signals and make facts easier to verify and cite.

## Recommended Initial Target Pages

- [x] `/`
- [x] `/about/kyberswap`
- [x] `/swap`
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

- [ ] `P2` Add FAQ content plus FAQPage JSON-LD to `/about/kyberswap`.
  Assignee: `Engineer + Content`
  Source plan impact: `High`
  Local assessment: `Medium`
  Notes: the FAQ content matters more than the schema itself.

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
  Notes: start with `/`, `/about/kyberswap`, `/swap`, and `/pools`; expand only after the first wave is validated.

- [ ] `P1` Add per-chain sections to `/pools`.
  Assignee: `Engineer + Content`
  Source plan impact: `High`
  Local assessment: `High`
  Notes: keep sections concrete with chain-specific pools, APR ranges, TVL, and links.

- [ ] `P0` Rebuild `/about/kyberswap` with full static content.
  Assignee: `Engineer + Content`
  Source plan impact: `High`
  Local assessment: `Very High`
  Notes: treat this page as the AI-facing source of truth for KyberSwap.

- [ ] `P1` Add per-chain sections to `/swap`.
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
5. Add comparison content and top-chain sections to `/swap` and `/pools`.
6. Scale new page types only after the first wave shows measurable impact.

## Explicit Deprioritizations

- Avoid launching 17 chain pages and 50 token pages in one pass.
- Avoid treating `llms.txt` as a major ranking lever.
- Avoid assuming schema markup can compensate for weak rendered content.
- Avoid building AI widgets before crawlability and measurement are solved.
