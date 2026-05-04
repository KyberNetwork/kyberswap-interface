# Searchable Audit TODO

This document turns the Searchable findings for `kyberswap.com` into an issue-first repo-local checklist for `apps/kyberswap-interface`.

## Goals

- Use reported Searchable issues as the source of truth.
- Make each issue easy to triage without a wide table.
- Mark whether each issue needs Growth/Product content, SSR/prerender, or can be improved in the SPA.
- Avoid changing public-facing claims, headings, descriptions, trust language, or marketing copy without approval.

## Audited Pages

- `/`
- `/about/kyberswap`
- `/earn`
- `/earn/pools`
- `/swap/ethereum`

## Working Principles

- Do not invent or rewrite content claims without Growth/Product approval.
- Prefer semantic HTML and crawlable links when existing copy can be reused unchanged.
- Defer SPA code changes while the Earn pages are being migrated from styled-components to Tailwind CSS.
- Treat SSR/prerender as the root fix for raw-crawler false positives.
- Add schema only when it matches visible page content.
- Prefer useful `alt`/ARIA labels over low-value image `title` attributes.
- Measure performance before optimizing.

## P0 - Raw SPA / SSR Issues

- [ ] `P0` Content-to-code ratio is too low.
  Pages: `all audited routes`
  Decision: mostly a raw SPA-shell artifact.
  Needs: `SSR/prerender`, `Growth/Product content if adding visible copy`
  Action: serve route-specific HTML for priority pages; do not stuff hidden text.

- [ ] `P0` Insufficient Content Length.
  Pages: `all audited routes`
  Decision: true for raw HTML; rendered pages vary.
  Needs: `SSR/prerender`, `Growth/Product content`
  Action: add approved visible content, then render it in initial HTML.

- [ ] `P0` Missing H1 Tag.
  Pages: `/`, `/about/kyberswap`, `/earn`, `/earn/pools`, `/swap/ethereum`
  Decision: often false for rendered DOM but true for raw scanners.
  Needs: `SSR/prerender`; `Growth/Product` only if wording changes.
  Action: reuse existing copy for semantic `h1` where possible; get approved copy for missing/weak headings.
  Status: *Not started; previous SPA edits were reverted to avoid conflict with Tailwind CSS migration.*

- [ ] `P0` No H2 Headings.
  Pages: `all audited routes`
  Decision: can be improved with semantic HTML, but raw scanners still need SSR/prerender.
  Needs: `SSR/prerender`; `Growth/Product` only if new section wording is needed.
  Action: convert existing section titles to `h2` when copy is already visible and approved.
  Status: *Not started; previous SPA edits were reverted to avoid conflict with Tailwind CSS migration.*

- [ ] `P0` Navigation links not detected.
  Pages: `all audited routes`
  Decision: partly raw-SPA artifact, partly caused by programmatic navigation.
  Needs: `SSR/prerender`
  Action: convert crawl-relevant navigation to real `Link`/anchor elements; keep transaction actions as buttons.
  Status: *Not started; previous SPA edits were reverted to avoid conflict with Tailwind CSS migration.*

- [ ] `P0` No Internal Links.
  Pages: `all audited routes`
  Decision: same root cause as navigation detection.
  Needs: `SSR/prerender`
  Action: ensure key public routes are linked with real HTML links.

- [ ] `P0` No External Links.
  Pages: `all audited routes`
  Decision: add only useful official links; do not add links only for the scanner.
  Needs: `SSR/prerender`; `Growth/Product` for trust/security/legal links.
  Action: use official docs links where helpful; defer trust/security links until approved.

## P0 - Schema Issues

- [ ] `P0` WebPage schema is missing.
  Pages: `/earn`, `/earn/pools`
  Decision: worthwhile as low-risk page-level schema, but not fully visible to raw crawlers without SSR/prerender.
  Needs: `SSR/prerender` for full scanner resolution.
  Action: use consistent page-level schema from existing route metadata.
  Status: *Not started; previous SPA edits were reverted to avoid conflict with Tailwind CSS migration.*

- [ ] `P0` BreadcrumbList schema is missing.
  Pages: `/`, `/about/kyberswap`, `/earn`, `/earn/pools`, `/swap/ethereum`
  Decision: skip/defer because the app does not expose visible breadcrumb UI.
  Needs: `Product/Design` only if adding breadcrumb UI.
  Action: do not add BreadcrumbList JSON-LD only to satisfy the scanner.

- [ ] `P0` Service schema is missing.
  Pages: `/about/kyberswap`
  Decision: requires visible service description and approved wording.
  Needs: `Growth/Product content`, `SSR/prerender`
  Action: defer until `/about/kyberswap` content explicitly describes the service.

- [ ] `P0` Product schema is missing.
  Pages: `/swap/ethereum`
  Decision: do not force Product schema unless Product approves that framing.
  Needs: `Growth/Product content`, `SSR/prerender`
  Action: consider `WebApplication` or `Service` later if visible content supports it.

- [ ] `P1` FAQ schema is missing.
  Pages: `/about/kyberswap`, `/swap/ethereum`
  Decision: schema should follow visible FAQ content.
  Needs: `Growth/Product content`, `SSR/prerender`
  Action: add FAQPage only after approved FAQ content exists.

## P1 - Content / Growth Issues

- [ ] `P1` Meta description is too long.
  Pages: `/`, `/about/kyberswap`, `/earn`, `/earn/pools`, `/swap/ethereum`
  Decision: do not rewrite descriptions without approval.
  Needs: `Growth/Product content`; `SSR/prerender` if scanner reads raw `index.html`.
  Action: prepare route metadata plumbing; final wording needs approval.

- [ ] `P1` Meta description and on-page content are misaligned.
  Pages: `/`, `/earn/pools`
  Decision: content alignment needs approved copy and initial HTML rendering.
  Needs: `Growth/Product content`, `SSR/prerender`
  Action: align title/description/H1/body copy after content approval.

- [ ] `P1` Title and on-page content are misaligned.
  Pages: `/`, `/earn/pools`
  Decision: wording issue; do not change headings/titles without approval.
  Needs: `Growth/Product content`, `SSR/prerender`
  Action: approve title/H1/content alignment, then render it consistently.

- [ ] `P1` Main heading does not provide a clear summary of the content.
  Pages: `/earn/pools`
  Decision: valid wording concern.
  Needs: `Growth/Product content`
  Action: approve improved H1 before changing copy.

- [ ] `P1` Intent-aligned headings are not used throughout the content.
  Pages: `/earn`, `/earn/pools`
  Decision: partly semantic, partly wording.
  Needs: `Growth/Product content` for new wording; `SSR/prerender` for raw scanners.
  Action: keep semantic heading fixes; get approved wording for stronger headings.

- [ ] `P1` No clear problem or answer at the beginning of the content.
  Pages: `/earn`, `/earn/pools`
  Decision: content strategy issue.
  Needs: `Growth/Product content`, `SSR/prerender`
  Action: add approved intro copy and render it in initial HTML.

- [ ] `P1` No competitive differentiators are highlighted.
  Pages: `/`, `/about/kyberswap`, `/earn/pools`, `/swap/ethereum`
  Decision: requires approved positioning and factual claims.
  Needs: `Growth/Product content`, likely `Legal/Compliance` review for claims.
  Action: Engineering can prepare layout slots only.

- [ ] `P1` No section with use cases, examples, or case studies.
  Pages: `/`, `/about/kyberswap`, `/earn/pools`, `/swap/ethereum`
  Decision: requires approved examples/use cases.
  Needs: `Growth/Product content`, `SSR/prerender`
  Action: build section structure after copy direction is approved.

- [ ] `P1` No FAQ or common objections handling section.
  Pages: `/`, `/about/kyberswap`, `/swap/ethereum`
  Decision: requires approved FAQ/common objection content.
  Needs: `Growth/Product content`, `SSR/prerender`
  Action: create FAQ section only after content approval.

- [ ] `P1` No social proof, testimonials, or client logos mentioned.
  Pages: `/`, `/about/kyberswap`, `/swap/ethereum`
  Decision: do not invent proof.
  Needs: `Growth/Product content`, likely `Legal/Compliance`
  Action: use only approved metrics, logos, partners, or public proof.

- [ ] `P1` No trust signals such as security badges, guarantees, or certifications mentioned.
  Pages: `/about/kyberswap`, `/earn/pools`
  Decision: trust/security language needs approval.
  Needs: `Growth/Product content`, `Legal/Compliance`
  Action: avoid guarantees unless explicitly approved.

- [ ] `P1` Pricing or features table is missing.
  Pages: `/about/kyberswap`
  Decision: features table may be useful; pricing table may not fit.
  Needs: `Growth/Product content`
  Action: Product must approve feature list and comparison framing.

## P2 - Performance / Accessibility Issues

- [ ] `P2` Page load time is slow.
  Pages: `all audited routes`
  Decision: needs measurement.
  Needs: `Engineering`
  Action: run Lighthouse/Web Vitals before optimizing.

- [ ] `P2` Interaction response time is slow.
  Pages: `all audited routes`
  Decision: needs INP profiling.
  Needs: `Engineering`
  Action: profile interactions before changing UI.

- [ ] `P2` Render-blocking resources detected.
  Pages: `all audited routes`
  Decision: needs measurement.
  Needs: `Engineering`
  Action: inspect fonts, scripts, route chunks, and critical CSS only after measurement.

- [ ] `P2` No data visuals (tables, figures with captions, video, audio, etc.).
  Pages: `/swap/ethereum`
  Decision: mostly low priority; swap already has conditional chart/route visuals.
  Needs: `Engineering`; `Growth/Product` only if adding new explanatory visuals.
  Action: improve labels/captions around existing visuals where useful.

- [ ] `P2` Image title attributes not found.
  Pages: `all audited routes`
  Decision: low-value finding.
  Needs: `Engineering`
  Action: prefer meaningful `alt`/ARIA labels; do not prioritize image `title`.
