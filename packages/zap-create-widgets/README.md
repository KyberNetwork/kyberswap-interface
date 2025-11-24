# Kyber Zap Create Widgets

The `@kyberswap/zap-create-widgets` package provides a React component to create new pools using KyberSwap's Zap engine (multi-token in, route + add liquidity). It is small, configurable, and easy to embed in a modal or page.

Exports: `ZapCreateWidget`, `ChainId`, `PoolType`, `TxStatus`.

## Installation

Install with your preferred package manager.

```
pnpm add @kyberswap/zap-create-widgets
```

```
yarn add @kyberswap/zap-create-widgets
```

```
npm i --save @kyberswap/zap-create-widgets
```

## Usage

Minimal example:

```tsx
import { ChainId, PoolType, ZapCreateWidget } from '@kyberswap/zap-create-widgets';
import '@kyberswap/zap-create-widgets/dist/style.css';

export default function Example() {
  // Provide these from your wallet/context (e.g. wagmi, web3-react, rainbowkit)
  const connectedAccount = { address: '0xYourAddress', chainId: ChainId.MAINNET };

  const sendTx = async (txData: {
    from: string;
    to: string;
    value: string;
    data: string;
    gasLimit: string;
  }): Promise<string> => {
    // Submit the transaction with your wallet/provider and return the tx hash
    return '0xTransactionHash';
  };

  return (
    <div style={{ width: 840, height: 720 }}>
      <ZapCreateWidget
        chainId={ChainId.MAINNET}
        poolType={PoolType.DEX_UNISWAPV3}
        createPoolConfig={{
          token0: TOKEN_A,
          token1: TOKEN_B,
          poolCategory: POOL_CATEGORY.CLASSIC,
          fee: 500,
        }}
        connectedAccount={connectedAccount}
        source="my-dapp"
        onConnectWallet={() => {
          /* open your wallet modal */
        }}
        onSwitchChain={() => {
          /* switch network in your app */
        }}
        onSubmitTx={sendTx}
        onClose={() => {
          /* close modal */
        }}
      />
    </div>
  );
}
```

For a more detailed example, refer to the demo in the widgets repo.

### Props

| Property         | Description                                                                                      | Type                                                                                                       | Required / Default |
| ---------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------ |
| chainId          | Network for the zap-create workflow                                                              | `ChainId` \| `number`                                                                                      | Required           |
| rpcUrl           | Use your own RPC endpoint                                                                        | `string`                                                                                                   | Optional           |
| poolType         | Protocol/pool type                                                                               | `PoolType`                                                                                                 | Required           |
| createPoolConfig | Pool creation config                                                                             | `{ token0: Token; token1: Token; poolCategory: POOL_CATEGORY; fee: number }`                               | Required           |
| connectedAccount | Current connected account info                                                                   | `{ address?: string; chainId: number }`                                                                    | Required           |
| source           | Identifier for your integration (used for attribution/analytics)                                 | `string`                                                                                                   | Required           |
| locale           | Locale for the widget                                                                            | `SupportedLocale`                                                                                          | Optional           |
| theme            | Optional theme tokens to override widget styles (CSS variables)                                  | `Theme`                                                                                                    | Optional           |
| zapStatus        | Controls the widget's transaction state; pass a map of `txHash -> TxStatus` to override polling  | `Record<string, TxStatus>`                                                                                 | Optional           |
| onConnectWallet  | Trigger your wallet connect flow                                                                 | `() => void`                                                                                               | Required           |
| onSwitchChain    | Trigger your chain switch flow                                                                   | `() => void`                                                                                               | Required           |
| onSubmitTx       | Submit the provided transaction object and return the tx hash. A `gasLimit` value is provided.   | `(txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>` | Required           |
| onSuccess        | Called after success with tx hash and liquidity info (no positionId)                             | `({ txHash, position }: OnSuccessProps) => void`                                                           | Optional           |
| onViewPosition   | Called after success with tx hash (use to deep-link to the created position if applicable)       | `(txHash: string) => void`                                                                                 | Optional           |
| onClose          | Called when the widget is closed                                                                 | `() => void`                                                                                               | Optional           |

Notes:

- Included/Excluded sources use KyberSwap Aggregator DEX IDs. See: https://docs.kyberswap.com/kyberswap-solutions/kyberswap-aggregator/dex-ids
- `PoolType` enumerates supported protocols (e.g. Uniswap V3, PancakeSwap V3, Sushi V3, Algebra forks, Uniswap V2, Uniswap V4, etc.). Import it from this package and pick the one matching your pools.

### Styling

- You must import the stylesheet once in your app: `@kyberswap/zap-create-widgets/dist/style.css`.
- You can override the theme via the `theme` prop (CSS variables under the `--ks-lw-*` namespace). Example keys include `text`, `subText`, `icons`, `layer1`, `dialog`, `layer2`, `stroke`, `chartRange`, `chartArea`, `accent`, `warning`, `error`, `success`, `blue`, `fontFamily`, `borderRadius`, `buttonRadius`, `boxShadow`.
