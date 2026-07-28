# @kyberswap/widgets

Embeddable swap widget powered by the KyberSwap aggregator. Drop the `<Widget>` component into any React app to give users a one-tap swap experience across 20+ EVM chains, with on-chain routing through KyberSwap's meta-aggregator.

## Install

```bash
pnpm add @kyberswap/widgets
# peers
pnpm add react react-dom
```

## Quick start

```tsx
import { Widget } from '@kyberswap/widgets'

function Swap() {
  return (
    <Widget
      client="my-integration"
      chainId={1}
      connectedAccount={{
        address: wallet?.address,
        chainId: wallet?.chainId ?? 1,
      }}
      onSubmitTx={async txData => {
        const tx = await signer.sendTransaction(txData)
        return tx.hash
      }}
    />
  )
}
```

That's the minimum. Integrators supply the wallet (any provider — wagmi, web3-onboard, ethers, raw window.ethereum) by handing the widget a connected address and an `onSubmitTx` callback that signs and broadcasts the transaction.

## Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `client` | `string` | ✅ | Identifier sent as `x-client-id` to the aggregator API for analytics. |
| `chainId` | `number` | ✅ | Chain the widget should target. Must be in [Supported chains](#supported-chains). |
| `connectedAccount` | `{ address?: string; chainId: number }` | ✅ | Wallet address + chain currently selected. When `connectedAccount.chainId !== chainId`, the widget shows a "Switch network" prompt and calls `onSwitchChain`. |
| `onSubmitTx` | `(data: TxData) => Promise<string>` | ✅ | Sign + broadcast handler. Returns the tx hash. |
| `theme` | `Theme \| undefined` | – | Custom color palette. Omit to use the default (dark). See [Theming](#theming). |
| `tokenList` | `TokenInfo[]` | – | Override the default token list. Empty/undefined → widget fetches from the KyberSwap settings API. |
| `defaultTokenIn` | `string` | – | Token-in address preset (default: native). |
| `defaultTokenOut` | `string` | – | Token-out address preset. |
| `defaultAmountIn` | `string` | – | Amount-in preset (default: `"1"`). |
| `defaultSlippage` | `number` | – | Slippage in bps (`50` = 0.5%). |
| `feeSetting` | `FeeSetting` | – | Charge a fee on each swap. See [Fee setting](#fee-setting). |
| `enableRoute` | `boolean` | – | Show "View routes" link. Default `true`. |
| `enableDexes` | `string` | – | Comma-separated DEX ids to whitelist (filters aggregator routes). |
| `showRate` | `boolean` | – | Show the exchange-rate row. Default `true`. |
| `showDetail` | `boolean` | – | Show the price-impact / gas detail panel. Default `true`. |
| `title` | `string \| ReactNode` | – | Title above the widget. Default `"Swap"`. |
| `width` | `number` | – | Widget width in px. Default `375`. |
| `rpcUrl` | `string` | – | Override the chain's default RPC. See [RPC behavior](#rpc-behavior). |
| `onSwitchChain` | `() => void` | – | Called when user clicks "Switch network". Use to trigger your wallet's chain-switch flow. |
| `onSourceTokenChange` | `(token: TokenInfo) => void` | – | Fired when token-in changes. |
| `onDestinationTokenChange` | `(token: TokenInfo) => void` | – | Fired when token-out changes. |
| `onAmountInChange` | `(amount: string) => void` | – | Fired when amount-in changes. |
| `onError` | `(e: any) => void` | – | Tx error callback. |

### `TxData`

```ts
type TxData = {
  from: string
  to: string
  value: string  // hex-prefixed
  data: string
  gasLimit: string  // hex-prefixed
}
```

### `FeeSetting`

```ts
type FeeSetting = {
  chargeFeeBy: 'currency_in' | 'currency_out'
  feeReceiver: string  // address that receives the fee
  feeAmount: number    // 10 = 0.1% when isInBps, else a fixed token amount
  isInBps: boolean     // true: feeAmount in basis points (10_000 = 100%)
}
```

## Theming

Pass a `Theme` object to restyle the widget end-to-end. Every field is required when overriding.

```tsx
import { Widget } from '@kyberswap/widgets'

const darkTheme = {
  text: '#FFFFFF',
  subText: '#A9A9A9',
  primary: '#1C1C1C',
  dialog: '#313131',
  secondary: '#0F0F0F',
  interactive: '#292929',
  stroke: '#505050',
  accent: '#28E0B9',
  success: '#189470',
  warning: '#FF9901',
  error: '#FF537B',
  fontFamily: 'Inter, sans-serif',
  borderRadius: '16px',
  buttonRadius: '999px',
  boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.04)',
}

<Widget theme={darkTheme} ... />
```

Omit `theme` to use the built-in default (a warm light palette).

## RPC behavior

- **If you pass `rpcUrl`**: the widget dials your endpoint directly. Use this if you have a reliable private RPC (e.g. Alchemy, Infura, Quicknode).
- **If you don't pass `rpcUrl`**: the widget routes through `@kyber/rpc-client` with automatic rotation across public RPCs, the KyberSwap public node, and a hardcoded fallback per chain. Resilient against any single endpoint going down.

## CSS isolation

The widget renders inside a styled-components root that explicitly resists element-selector resets from the host page (Tailwind preflight, Bootstrap reset, etc.). In particular it neutralizes `svg { display: block; max-width: 100%; }`-style rules that would otherwise collapse the widget's icons.

For full isolation you can also render the widget inside a Shadow DOM (e.g. via `react-shadow`). Not required for typical usage.

## Supported chains

| Chain | ID |
|---|---|
| Ethereum | 1 |
| BSC | 56 |
| Arbitrum | 42161 |
| Optimism | 10 |
| Polygon | 137 |
| Avalanche | 43114 |
| Base | 8453 |
| Linea | 59144 |
| Polygon zkEVM | 1101 |
| zkSync Era | 324 |
| Blast | 81457 |
| Mantle | 5000 |
| Fantom | 250 |
| Berachain | 80094 |
| Sonic | 146 |
| HyperEVM | 999 |
| Plasma | 9745 |
| Etherlink | 42793 |
| Monad | 143 |
| MegaETH | 4326 |
| Rise | 4153 |

Other listed chains (Cronos, BTTC) are deprecated.

## Demos

Two live examples ship in this monorepo:

- [`apps/swap-widgets-react-demo`](../../apps/swap-widgets-react-demo) — Vite + React 18 + web3-onboard.
- [`apps/swap-widgets-nextjs-demo`](../../apps/swap-widgets-nextjs-demo) — Next.js Pages Router + web3-onboard.

Both expose every prop so you can experiment with theming, fee settings, chain selection, etc. before integrating.

## Development

From the monorepo root:

```bash
pnpm i
pnpm --filter @kyberswap/widgets dev       # tsup watch
pnpm --filter @kyberswap/widgets build
pnpm --filter @kyberswap/widgets type-check
pnpm --filter @kyberswap/widgets lint
```
