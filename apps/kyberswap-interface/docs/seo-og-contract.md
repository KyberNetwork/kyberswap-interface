# SEO, Sitemap, and OG-Service Contract

This document defines the shared SEO contract between KyberSwap Interface and KyberSwap OG Service. It describes
stable ownership and runtime expectations, not a release checklist or a snapshot of a particular commit.

The Interface repository is the source of truth for application routes, browser metadata, sitemap inventory, and
the static build consumed by OG Service. OG Service is the source of truth for crawler-time resolution, complete raw
HTML metadata, and generated preview images.

## Request flow

```text
Regular browser
  -> Interface Nginx
  -> React route + RouteSeo browser metadata

Crawler on swap|limit|pools|cross-chain|user-swap
  -> OG Service
  -> body from the baked Interface build
  -> strict request/token/pool classification
  -> one complete injected SEO head + exact request marker when request-specific classification is needed
     (an already-exact clean static document may pass through)

/buy/:chain/:token or /sell/:chain/:token
  -> Interface Nginx 301 for curated aliases
  -> canonical /swap/:chain/:tokenIn-to-:tokenOut
```

The main product route remains `/swap`. Buy and Sell URLs are aliases and must never become separate canonical
pages. Routes outside the crawler allowlist, including `/buy`, `/sell`, `/`, sitemap files, robots, Earn, Market,
KyberDAO, and About, remain Interface-owned at ingress.

## Ownership

| Concern                    | Interface                                                      | OG Service                                                                |
| -------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Application routing and UI | React routes, URL state, SPA navigation                        | None                                                                      |
| Buy/Sell aliases           | Client fallback plus exact curated Nginx redirects             | No Buy/Sell handler                                                       |
| Discovery                  | Checked-in sitemap XML and curated route catalogs              | Consumes only the baked curated Swap sitemap                              |
| Static HTML                | Distinct pages, shared product shells, skeletons, fallback     | Reads the immutable Interface build from `/app/static`                    |
| Browser metadata           | Route policy, DOM updates, structured data                     | None for normal browser traffic                                           |
| Raw crawler metadata       | Safe generic heads in build artifacts                          | Strict injection when needed; exact static documents may pass through     |
| Dynamic validity           | Lightweight synchronous guards                                 | Token identity, chain capability, pool existence, and upstream resolution |
| Hydration handoff          | Preserve an exact server marker, then own later SPA navigation | Emit the marker for the exact request represented by the injected head    |
| Preview images             | Static fallback image asset                                    | Dynamic Swap, Limit, pool, and cross-chain PNG generation                 |

Do not move asynchronous token or pool resolution into Interface metadata code. Interface must remain conservative
when it cannot prove identity synchronously; OG Service performs strict resolution before promoting crawler responses.

## Discovery inventory

The maintained discovery inventory currently contains:

- 46 landing URLs from `SITEMAP_PAGE_ROUTES`;
- 46 curated canonical Swap pairs from `CURATED_SWAP_PAIR_ROUTES`;
- 46 Buy/Sell aliases derived from 23 approved token intents across 18 Swap chains.

The route catalogs, generated redirect map, checked-in XML, and contract tests must change together. Do not copy the
full URL list into another source file or manually maintain a second route manifest.

Authoritative inputs:

- `src/components/Seo/sitemapRoutes.ts`: landing discovery inventory;
- `src/components/Seo/curatedSwapCatalog.ts`: curated pairs and Buy/Sell redirects;
- `public/sitemap-pages.xml`: landing URLs submitted for discovery;
- `public/sitemap-swap.xml`: curated canonical Swap URLs and OG's curated pathname input;
- `public/sitemap.xml`: sitemap index.

`sitemap-swap.xml` membership selects approved Buy/Sell copy and provides a bounded identity fallback for those exact
curated paths. It is not a general allowlist for indexing arbitrary Swap pairs.

## Interface build contract

The Interface image copied into OG Service must contain a complete build, not selected files copied by hand.

| Artifact                          | Contract                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| `build/index-root.html`           | Exact homepage document; `/` is not routed through OG                                      |
| `build/<route>/index.html`        | Distinct prerendered Interface pages declared by the prerender manifest                    |
| `build/swap/index.html`           | Shared Swap body with generic `/swap` canonical and `noindex,follow`                       |
| `build/limit/index.html`          | Shared Limit body with generic `/limit` canonical and `noindex,follow`                     |
| `build/index.html`                | Generic SPA fallback; OG must not return its head untouched for a recognized dynamic route |
| `build/skeletons/swap.html`       | Fail-soft Swap/pair loading fragment                                                       |
| `build/skeletons/pool.html`       | Fail-soft pool loading fragment                                                            |
| `build/sitemap-swap.xml`          | OG's only curated Swap pathname input                                                      |
| `build/swap-intent-redirects.map` | Interface Nginx redirect map; OG does not consume it                                       |

`src/entry-server.tsx` defines the prerender manifest and shared body renderers. `scripts/prerender.mjs` orchestrates
that manifest and must not grow a separate product-route catalog.

## Canonical and robots expectations

| Request family                             | Canonical                                     | Interface robots               | Final crawler robots                                          |
| ------------------------------------------ | --------------------------------------------- | ------------------------------ | ------------------------------------------------------------- |
| Clean supported Swap/Limit landing         | Lowercase clean self path                     | `index,follow`                 | `index,follow`                                                |
| Unsupported product/chain landing          | Route-safe clean path                         | `noindex,follow`               | `noindex,follow`                                              |
| Clean curated Swap pair                    | Normalized full pair path                     | `index,follow`                 | `index,follow` with approved Buy/Sell copy                    |
| Clean non-curated Swap pair                | Full request pair path                        | `noindex,follow`               | `index,follow` only after two strict, distinct tokens resolve |
| Clean Limit pair                           | Full request pair path                        | `noindex,follow`               | `index,follow` only after two strict, distinct tokens resolve |
| Complete legacy pair query                 | Equivalent normalized full pair path          | `noindex,follow`               | Same canonical and `noindex,follow`                           |
| Invalid legacy pair query                  | Product landing fallback                      | `noindex,follow`               | Route-safe `noindex,follow`                                   |
| Clean `/cross-chain`                       | `/cross-chain`                                | `index,follow`                 | `index,follow`                                                |
| Complete valid-looking cross-chain state   | Ordered four-key state URL                    | `noindex,follow`               | Resolved normalized state URL and `noindex,follow`            |
| Junk or incomplete cross-chain query       | `/cross-chain`                                | `noindex,follow`               | `/cross-chain` and `noindex,follow`                           |
| Complete but unsupported cross-chain state | Four-key state URL                            | `noindex,follow`               | `/cross-chain` after OG validation and `noindex,follow`       |
| Valid-looking clean pool path              | Normalized self path after lightweight guards | May be `index,follow`          | `index,follow` only after exact pool resolution               |
| Pool query variant                         | Normalized clean pool path                    | `noindex,follow`               | `noindex,follow`                                              |
| Malformed, unsupported, or unresolved pool | Route-safe path                               | `noindex,follow`               | `noindex,follow`                                              |
| Query on an Interface-only distinct page   | Clean page path                               | Meta and HTTP `noindex,follow` | Not routed through OG                                         |

Every query-bearing variant is a duplicate and must remain `noindex,follow`, even when it has a normalized canonical.
A timeout, parser rejection, resolver miss, or handler failure must also fail closed to route-family-safe metadata.

## URL normalization

- Curated path-form Swap pairs match the exact maintained catalog. Other path-form Swap/Limit pairs stay noindex in
  Interface and leave strict identity resolution to OG Service.
- Complete legacy pair state requires exactly one non-empty, distinct `inputCurrency` and `outputCurrency` value.
  Neither value may contain a nested `-to-`; the canonical URI-encodes normalized values.
- Complete Interface cross-chain state requires exactly one `from`, `to`, `tokenIn`, and `tokenOut`. Interface
  lowercases `from`/`to`, preserves token IDs, removes unrelated keys, and keeps the request noindex.
- Interface pool guards require a maintained chain, a non-empty protocol segment, and a 40-hex contract address or
  64-hex v4 pool ID. OG additionally validates protocol support and exact pool existence.
- Duplicate required state keys are invalid. Unrelated attribution keys may be discarded during canonicalization.

## Metadata copy policy

`src/components/Seo/routeMetadata.ts` is the Interface source of truth for titles, descriptions, canonicals, robots,
and structured data. `src/components/Seo/seoHead.ts` serializes the server-safe head.

- Swap and Limit landing copy is network-aware.
- Curated Swap targets use Buy/Sell intent copy from `curatedSwapCatalog.ts`.
- Interface does not promote unresolved generic Swap or Limit pairs.
- OG may apply generic product-specific pair copy only after strict resolution.
- Documentation should describe templates and ownership; it should not duplicate every current title, description,
  or curated URL. Tests and source catalogs enforce the exact current values.

## Server marker lifecycle

OG emits:

```html
<meta name="kyberswap:server-seo-path" content="/exact/path?exact=query" />
```

The marker content is the exact `pathname + search`; hashes are excluded.

1. On initial mount, `RouteSeo` compares the marker with the browser's current path and search.
2. An exact match means the Interface must preserve the complete server head. The marker remains so StrictMode or a
   remount cannot immediately overwrite it.
3. `PoolSeoTitle` follows the same guard and must not replace an exact OG pool title after data loads.
4. A path or search navigation makes the marker stale. Interface removes it, writes destination metadata, and owns
   subsequent SPA navigation.
5. OG failure responses still carry a matching marker and intentional safe noindex head; Interface must preserve it.

## Change and release expectations

Changes that affect routes, sitemap membership, canonicalization, robots, shared shell contents, marker behavior, or
OG classification are cross-repository contract changes.

For such a change:

1. Update Interface catalogs, XML, metadata policy, prerender artifacts, and contract tests together.
2. Update OG parsing/resolution behavior and tests where the crawler result changes.
3. Publish one reviewed immutable Interface image.
4. Build OG Service against that exact image tag; never validate a paired release against a mutable `latest` tag.
5. On pre-release, verify raw and hydrated heads, intended bodies/assets, aliases, preview images, failure paths, and
   ingress routing for a regular browser plus representative search, social, AI, and unknown crawlers.
6. Submit expanded sitemap discovery only after the paired deployment passes these checks.

Minimum regression coverage should include catalogs/XML synchronization, representative normalization cases, shared
shell safety, SSR rendering, exact marker ownership, strict resolver failure, complete head deduplication, and a loop
over every curated Swap pathname using the exact paired Interface artifact.

## Non-goals

- Per-pair prerendered HTML documents.
- A second `seo-routes.json`-style manifest.
- OG ownership of React routing or SPA navigation.
- Asynchronous resolver calls inside Interface route metadata.
- Separate canonical Buy/Sell pages.
- Indexing query variants or unresolved dynamic identities.
