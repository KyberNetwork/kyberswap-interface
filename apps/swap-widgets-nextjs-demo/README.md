# swap-widgets-nextjs-demo

Next.js 13 (Pages Router) sandbox for [`@kyberswap/widgets`](../../packages/swap-widgets). Mirrors [`swap-widgets-react-demo`](../swap-widgets-react-demo) — same settings panel, same UI — but on the Next.js bundler so integrators using App / Pages Router can copy from a working setup.

## Run

From the monorepo root:

```bash
pnpm i
pnpm --filter @kyberswap/widgets build           # build the widget once
pnpm --filter kyberswap-widget-demo-nextjs dev   # next dev
```

Then open `http://localhost:3000`.

If you're iterating on the widget itself, run it in watch mode in a second terminal:

```bash
pnpm --filter @kyberswap/widgets dev
```

## What's in here

| File | Purpose |
|---|---|
| `pages/index.tsx` | Single-page demo. Holds settings state, renders the controls panel + `<Widget>`. |
| `pages/_app.tsx` | App shell with `<Head>` (title + viewport) and global CSS import. |
| `pages/_document.tsx` | Document shell with favicon links, Google Fonts link, and an inline theme-init script (sets the `dark` class on `<html>` before React hydrates to prevent flash for returning users). |
| `styles/globals.css` | Tailwind directives + minimal base styles. |
| `tailwind.config.ts` | Tailwind config — `darkMode: 'class'`, brand `accent: #28e0b9`, Work Sans font. |
| `postcss.config.js` | Tailwind + autoprefixer. |
| `next.config.js` | `styledComponents: true` compiler flag so the bundled widget's SSR styles work. |

## Architecture

- **Wallet** — `@web3-onboard/react` with `injected-wallets` + `walletconnect` modules. `init()` runs at module top level. Wallet state is hydrated client-side.
- **`<Widget>` is dynamically imported with `ssr: false`** — the widget reads `localStorage` and fetches token data on mount, which would otherwise cause hydration mismatches under SSR.
  ```tsx
  const Widget = dynamic(() => import('@kyberswap/widgets').then(m => m.Widget), {
    ssr: false,
  })
  ```
  The surrounding chrome (header, settings panel, footer) is still server-rendered for fast first paint and SEO; only the swap widget is client-only.
- **`onSubmitTx`** — constructs a fresh `ethers.providers.Web3Provider` per call so the signer always reflects the current wallet (no stale closures).
- **App theme** — `appTheme` state (`'dark' | 'light'`) toggled by the sun/moon button in the header. Persisted to `localStorage('demoAppTheme')`. The actual `dark` class is applied by the inline script in `_document.tsx` before React hydrates (no flash); a `useEffect` then syncs React state.
- **Widget theme** — separate from app theme. Selected via the segmented control; `'custom'` passes `undefined` so the widget uses its built-in default.
- **Chain selector** — `useSetChain()` from web3-onboard triggers the wallet's chain-switch flow when the user clicks the widget's "Switch network" CTA.

## Build for production

```bash
pnpm --filter kyberswap-widget-demo-nextjs build
pnpm --filter kyberswap-widget-demo-nextjs start
```

The page is statically optimized (no server functions). Deploy the build output to Vercel, Netlify, or any static host that serves Next.js builds.
