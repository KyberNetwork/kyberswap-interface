# Kyber Zap Migration Widgets

The `@kyberswap/zap-migration-widgets` package provides a React component to migrate liquidity from one position/pool to another (or reposition within the same pool) using KyberSwap's Zap engine. It is small, configurable, and easy to embed in a modal or page.

Exports: `ZapMigration`, `ChainId`, `PoolType`, `ZapStatus`.

## Installation

Install with your preferred package manager.

```
pnpm add @kyberswap/zap-migration-widgets
```

```
yarn add @kyberswap/zap-migration-widgets
```

```
npm i --save @kyberswap/zap-migration-widgets
```

## Usage

Minimal example:

```tsx
import { ChainId, PoolType, ZapMigration } from '@kyberswap/zap-migration-widgets';
import '@kyberswap/zap-migration-widgets/dist/style.css';

export default function Example() {
  // Provide these from your wallet/context (e.g. wagmi, web3-react, rainbowkit)
  const connectedAccount = { address: '0xYourAddress', chainId: ChainId.MAINNET };

  const sendTx = async (txData: {
    from: string;
    to: string;
    value: string;
    data: string;
    gasLimit?: string;
  }): Promise<string> => {
    // Submit the transaction with your wallet/provider and return the tx hash
    return '0xTransactionHash';
  };

  return (
    <div style={{ width: 832, height: 680 }}>
      <ZapMigration
        chainId={ChainId.MAINNET}
        from={{
          poolType: PoolType.DEX_UNISWAPV3,
          poolAddress: '0xPoolAddress',
          positionId: '12345',
        }}
        // Optional target; omit to migrate into a new position on the same pool type
        to={{
          poolType: PoolType.DEX_UNISWAPV3,
          poolAddress: '0xTargetPool',
        }}
        connectedAccount={connectedAccount}
        client="my-dapp"
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

For a more detailed example, refer to the demo component in this repository: [ZapMigration.tsx (demo)](https://github.com/KyberNetwork/kyberswap-interface/blob/main/apps/zap-widgets-demo/src/components/ZapMigration.tsx).

### Props

| Property          | Description                                                                                                                      | Type                                                                                                        | Required / Default |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------ |
| chainId           | Network for the migration workflow                                                                                               | `ChainId` \| `number`                                                                                       | Required           |
| rpcUrl            | Use your own RPC endpoint                                                                                                        | `string`                                                                                                    | Optional           |
| from              | Source position to migrate from                                                                                                  | `{ poolType: PoolType; poolAddress: string; positionId: string }`                                           | Required           |
| to                | Target pool/position to migrate into. Omit to create a new position                                                              | `{ poolType: PoolType; poolAddress: string; positionId?: string }`                                          | Optional           |
| connectedAccount  | Current connected account info                                                                                                   | `{ address?: string; chainId: number }`                                                                     | Required           |
| client            | Identifier for your integration (e.g. your dapp name)                                                                            | `string`                                                                                                    | Required           |
| referral          | Referral code (if any)                                                                                                           | `string`                                                                                                    | Optional           |
| initialSlippage   | Initial slippage percentage. Example: `1` = 1%                                                                                   | `number`                                                                                                    | Optional           |
| rePositionMode    | Enable migrate-with-reposition flow for the source position                                                                      | `boolean`                                                                                                   | Optional (`false`) |
| initialTick       | Initial tick range when creating/repositioning                                                                                   | `{ tickLower: number; tickUpper: number }`                                                                  | Optional           |
| aggregatorOptions | Restrict/allow specific liquidity sources for routes                                                                             | `{ includedSources?: string[]; excludedSources?: string[] }`                                                | Optional           |
| feeConfig         | Integration fee in per cent mille. `1` = 0.001% (1 in 100,000). Ignored if no `feeAddress`                                       | `{ feePcm: number; feeAddress: string }`                                                                    | Optional           |
| theme             | Optional theme tokens to override widget styles (CSS variables)                                                                  | `Theme`                                                                                                     | Optional           |
| className         | Extra class on root container                                                                                                    | `string`                                                                                                    | Optional           |
| onExplorePools    | Called from the success screen's Explore Pools action                                                                            | `() => void`                                                                                                | Optional           |
| onViewPosition    | Called after success with the tx hash                                                                                            | `(txHash: string) => void`                                                                                  | Optional           |
| onBack            | Called when the back button is clicked                                                                                           | `() => void`                                                                                                | Optional           |
| onConnectWallet   | Trigger your wallet connect flow                                                                                                 | `() => void`                                                                                                | Required           |
| onSwitchChain     | Trigger your chain switch flow                                                                                                   | `() => void`                                                                                                | Required           |
| onSubmitTx        | Submit the provided transaction object and return the tx hash. If `gasLimit` is omitted, your wallet/provider should estimate it | `(txData: { from: string; to: string; value: string; data: string; gasLimit?: string }) => Promise<string>` | Required           |
| onClose           | Called when the widget is closed                                                                                                 | `() => void`                                                                                                | Required           |
| zapStatus         | Controls the widget's transaction state; pass a map of `txHash -> TxStatus`, or omit to let the widget poll itself               | `Record<string, TxStatus>`                                                                                  | Optional           |

- Included/Excluded sources use KyberSwap Aggregator DEX IDs. See: https://docs.kyberswap.com/kyberswap-solutions/kyberswap-aggregator/dex-ids
- `PoolType` enumerates supported protocols (e.g. Uniswap V3, PancakeSwap V3, Sushi V3, Algebra forks, Uniswap V2, Uniswap V4, etc.). Import it from this package and pick the one matching your pools.

### Styling

- You must import the stylesheet once in your app: `@kyberswap/zap-migration-widgets/dist/style.css`.
- You can override the theme via the `theme` prop (CSS variables under the `--ks-lw-*` namespace). Example keys include `text`, `subText`, `icons`, `layer1`, `dialog`, `layer2`, `stroke`, `accent`, `warning`, `error`, `success`, `interactive`, `fontFamily`, `borderRadius`, `buttonRadius`, `boxShadow`.
