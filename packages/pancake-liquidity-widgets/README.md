# Kyber Pancake Liquidity Widgets

The `@kyberswap/pancake-liquidity-widgets` package provides a React component to add or increase liquidity into PancakeSwap pools using KyberSwap's Zap engine. It supports PancakeSwap V3 and Pancake Infinity CL variants with a small, configurable UI.

Exports: `LiquidityWidget`, `PoolType`.

Demo: https://pancake-liq-widget-demo.vercel.app/

## Installation

Install with your preferred package manager.

```
pnpm add @kyberswap/pancake-liquidity-widgets
```

```
yarn add @kyberswap/pancake-liquidity-widgets
```

```
npm i --save @kyberswap/pancake-liquidity-widgets
```

## Usage

Minimal example:

```tsx
import {
  LiquidityWidget,
  PoolType,
} from "@kyberswap/pancake-liquidity-widgets";
import "@kyberswap/pancake-liquidity-widgets/dist/style.css";
import { useAccount, useChainId, useWalletClient } from "wagmi";

export default function Example() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();

  return (
    <div style={{ width: 840, height: 720 }}>
      <LiquidityWidget
        // Theme: 'dark' | 'light' or omit for default
        theme="dark"
        walletClient={walletClient}
        account={address as any}
        chainId={chainId}
        networkChainId={chainId}
        poolType={PoolType.DEX_PANCAKESWAPV3}
        poolAddress={"0xPoolAddress"}
        // Optional: to increase liquidity into an existing position
        positionId={"12345"}
        source="my-dapp"
        // Comma-separated token addresses and amounts
        initDepositTokens={""}
        initAmounts={""}
        onConnectWallet={() => {
          /* open your wallet modal */
        }}
        onAddTokens={(tokenAddresses: string) => {
          /* update initDepositTokens */
        }}
        onRemoveToken={(tokenAddress: string) => {
          /* remove from initDepositTokens */
        }}
        onAmountChange={(tokenAddress: string, amount: string) => {
          /* update initAmounts */
        }}
        onOpenTokenSelectModal={() => {
          /* open your token selector */
        }}
        onTxSubmit={(txHash?: string) => {
          /* optional tx hash callback */
        }}
        onDismiss={() => {
          /* close modal */
        }}
      />
    </div>
  );
}
```

For a more detailed example, refer to [PancakeZapIn.tsx (demo)](https://github.com/KyberNetwork/kyberswap-interface/blob/main/apps/zap-widgets-demo/src/components/PancakeZapIn.tsx).

### Props

| Property               | Description                                                                    | Type                                             | Required / Default |
| ---------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------ | ------------------ |
| theme                  | Theme mode or theme object                                                     | `'dark' \| 'light' \| Theme`                     | Optional           |
| walletClient           | Wallet client (e.g. wagmi `useWalletClient()`)                                 | `WalletClient \| undefined`                      | Required           |
| account                | Connected account address                                                      | `Address \| undefined`                           | Required           |
| chainId                | ChainId to route and add liquidity                                             | `number`                                         | Required           |
| networkChainId         | Current network of user wallet (for mismatch detection)                        | `number`                                         | Required           |
| poolType               | Pancake pool type                                                              | `PoolType`                                       | Required           |
| poolAddress            | Pool address                                                                   | `string`                                         | Required           |
| positionId             | Existing position to increase liquidity into                                   | `string`                                         | Optional           |
| source                 | Identifier for your integration                                                | `string`                                         | Required           |
| includedSources        | Restrict liquidity sources (comma-separated)                                   | `string`                                         | Optional           |
| excludedSources        | Exclude liquidity sources (comma-separated)                                    | `string`                                         | Optional           |
| initTickLower          | Initial lower tick (new position)                                              | `number`                                         | Optional           |
| initTickUpper          | Initial upper tick (new position)                                              | `number`                                         | Optional           |
| initDepositTokens      | Initial deposit token addresses, separated by commas                           | `string`                                         | Required           |
| initAmounts            | Initial deposit token amounts, separated by commas                             | `string`                                         | Required           |
| feeAddress             | Fee receiver address                                                           | `string`                                         | Optional           |
| feePcm                 | Fee in per cent mille. `1` = 0.001% (1 in 100,000). Ignored if no `feeAddress` | `number`                                         | Optional           |
| onDismiss              | Called when the widget is closed                                               | `() => void`                                     | Required           |
| onTxSubmit             | Called when a tx was submitted (optional)                                      | `(txHash: string) => void`                       | Optional           |
| onConnectWallet        | Trigger your wallet connect flow                                               | `() => void`                                     | Required           |
| onAddTokens            | Called when tokens are added (update `initDepositTokens`)                      | `(tokenAddresses: string) => void`               | Required           |
| onRemoveToken          | Called when a token is removed (update `initDepositTokens`/`initAmounts`)      | `(tokenAddress: string) => void`                 | Required           |
| onAmountChange         | Called when a token amount changes (update `initAmounts`)                      | `(tokenAddress: string, amount: string) => void` | Required           |
| onOpenTokenSelectModal | Open your token selection modal                                                | `() => void`                                     | Required           |
| farmContractAddresses  | Additional farm contracts to detect deposit eligibility                        | `string[]`                                       | Optional           |

Notes:

- `PoolType` for Pancake variants is exported from this package. See constants for supported values.
- Included/Excluded sources use KyberSwap Aggregator DEX IDs. See: https://docs.kyberswap.com/kyberswap-solutions/kyberswap-aggregator/dex-ids

### Styling

- You must import the stylesheet once in your app: `@kyberswap/pancake-liquidity-widgets/dist/style.css`.
- You can override the theme via the `theme` prop (CSS variables under the `--pcs-lw-*` namespace). A light theme is available via `theme="light"`.
