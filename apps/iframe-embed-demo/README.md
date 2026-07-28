# iframe-embed-demo

A small harness that embeds KyberSwap's **`/partner-swap`** widget in an `<iframe>`, the way a
partner site does — to eyeball the widget and check whether an origin is allowed to frame KyberSwap.
If the widget renders, the current origin may frame KyberSwap; if the frame stays blank, the browser
console shows the `frame-ancestors` block.

> `/partner-swap` redirects to `/` without a `clientId`, so every embed URL here carries one.

## Run

```bash
pnpm i
pnpm build-package                    # build @kyber/utils, @kyber/tailwind-config
pnpm --filter iframe-embed-demo dev   # http://localhost:5173
```

## Pointing at a different KyberSwap

By default the iframe loads production (`https://kyberswap.com`). Override the target origin with a
`ks` query param — handy for the allow-path test against a local KyberSwap:

```
http://localhost:5173/?ks=http://localhost:8080
```

`frame-ancestors` is only emitted when KyberSwap is served by its **nginx container** (production,
staging, or a local Docker build of `apps/kyberswap-interface`). A KyberSwap started with `pnpm dev`
sends no such header and frames everywhere.
