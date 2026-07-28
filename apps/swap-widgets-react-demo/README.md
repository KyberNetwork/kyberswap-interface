# swap-widgets-react-demo

Vite + React 18 sandbox for [`@kyberswap/widgets`](../../packages/swap-widgets). Lets you toggle every Widget prop live (theme, chain, charge fee, route options, dexes filter) and connect a real wallet via web3-onboard.

## Run

From the monorepo root:

```bash
pnpm i
pnpm --filter @kyberswap/widgets build      # build the widget once
pnpm --filter kyberswap-widgets-demo dev    # start vite dev server
```

Then open the URL Vite prints (usually `http://localhost:5173`).

If you're iterating on the widget itself, run it in watch mode in a second terminal:

```bash
pnpm --filter @kyberswap/widgets dev
```

## What's in here

| File | Purpose |
|---|---|
| `src/App.tsx` | Single-page demo. Holds all settings state, renders the controls panel + `<Widget>`. |
| `src/App.css` | Tailwind directives + minimal base styles. |
| `src/main.tsx` | React 18 entry point. |
| `index.html` | Vite HTML shell with favicon + Google Fonts link. |
| `tailwind.config.ts` | Tailwind config — `darkMode: 'class'`, brand `accent: #28e0b9`, Work Sans font. |
| `postcss.config.js` | Tailwind + autoprefixer. |
| `vite.config.ts` | Vite config with node polyfills for the widget's bundled deps. |

## Architecture

- **Wallet** — `@web3-onboard/react` with `injected-wallets` + `walletconnect` modules. `init()` runs at module top level; widget receives the connected address through `connectedAccount`.
- **`onSubmitTx`** — constructs a fresh `ethers.providers.Web3Provider` per call so the signer always reflects the current wallet (no stale closures).
- **App theme** — `appTheme` state (`'dark' | 'light'`) toggled by the sun/moon button in the header. Persisted to `localStorage('demoAppTheme')`. Applies the `dark` class to `<html>` so Tailwind `dark:` variants activate.
- **Widget theme** — separate from app theme. Selected via the segmented control inside the Display card; passed to `<Widget theme={...}>`. `'custom'` passes `undefined` so the widget falls back to its built-in default.
- **Chain selector** — `useSetChain()` from web3-onboard triggers the wallet's switch flow when the user clicks the widget's "Switch network" CTA.

## Build for production

```bash
pnpm --filter kyberswap-widgets-demo build
```

Outputs static assets to `dist/`. Serve with any static host.
