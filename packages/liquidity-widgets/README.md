# Kyber Liquidity Widgets

The `@kyberswap/liquidity-widgets` package provides a React component to add or increase LP liquidity using KyberSwap's Zap engine (multi-token in, route + add liquidity). It is small, configurable, and easy to embed in a modal or page.

Exports: `LiquidityWidget`, `ChainId`, `PoolType`, `TxStatus`.

## Installation

Install with your preferred package manager.

```
pnpm add @kyberswap/liquidity-widgets
```

```
yarn add @kyberswap/liquidity-widgets
```

```
npm i --save @kyberswap/liquidity-widgets
```

## Usage

Minimal example:

```tsx
import { ChainId, LiquidityWidget, PoolType } from '@kyberswap/liquidity-widgets';
import '@kyberswap/liquidity-widgets/dist/style.css';

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
      <LiquidityWidget
        chainId={ChainId.MAINNET}
        poolType={PoolType.DEX_UNISWAPV3}
        poolAddress={'0xPoolAddress'}
        // Optional: pass to increase liquidity on an existing position
        positionId={'12345'}
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

| Property           | Description                                                                                                        | Type                                                                                                       | Required / Default |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------ |
| chainId            | Network for the add-liquidity workflow                                                                             | `ChainId` \| `number`                                                                                      | Required           |
| rpcUrl             | Use your own RPC endpoint                                                                                          | `string`                                                                                                   | Optional           |
| poolType           | Protocol/pool type                                                                                                 | `PoolType`                                                                                                 | Required           |
| poolAddress        | Pool address                                                                                                       | `string`                                                                                                   | Required           |
| positionId         | Existing position to increase liquidity into                                                                       | `string`                                                                                                   | Optional           |
| connectedAccount   | Current connected account info                                                                                     | `{ address?: string; chainId: number }`                                                                    | Required           |
| source             | Identifier for your integration (used for attribution/analytics)                                                   | `string`                                                                                                   | Required           |
| aggregatorOptions  | Restrict/allow specific liquidity sources for routes                                                               | `{ includedSources?: string[]; excludedSources?: string[] }`                                               | Optional           |
| feeConfig          | Integration fee in per cent mille. `1` = 0.001% (1 in 100,000). Ignored if no `feeAddress`                         | `{ feePcm: number; feeAddress: string }`                                                                   | Optional           |
| referral           | Referral code (if any)                                                                                             | `string`                                                                                                   | Optional           |
| initialTick        | Initial tick range when creating a new position                                                                    | `{ tickLower: number; tickUpper: number }`                                                                 | Optional           |
| initDepositTokens  | Initial deposit token addresses, separated by commas                                                               | `string`                                                                                                   | Optional           |
| initAmounts        | Initial deposit amounts for tokens, separated by commas                                                            | `string`                                                                                                   | Optional           |
| theme              | Optional theme tokens to override widget styles (CSS variables)                                                    | `Theme`                                                                                                    | Optional           |
| onConnectWallet    | Trigger your wallet connect flow                                                                                   | `() => void`                                                                                               | Required           |
| onSwitchChain      | Trigger your chain switch flow                                                                                     | `() => void`                                                                                               | Required           |
| onOpenZapMigration | Trigger opening the Zap Migration widget (if you implement it in host app)                                         | `(position, initialTick?, initialSlippage?) => void`                                                       | Optional           |
| onSubmitTx         | Submit the provided transaction object and return the tx hash. A `gasLimit` value is provided.                     | `(txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>` | Required           |
| signTypedData      | Sign EIP-712 typed data for permit-based approvals (gasless NFT approval). Return signature hex string.            | `(account: string, typedDataJson: string) => Promise<string>`                                              | Optional           |
| onSuccess          | Called after success with tx hash and position info                                                                | `({ txHash, position }: OnSuccessProps) => void`                                                           | Optional           |
| onViewPosition     | Called after success with tx hash                                                                                  | `(txHash: string) => void`                                                                                 | Optional           |
| onClose            | Called when the widget is closed                                                                                   | `() => void`                                                                                               | Optional           |
| zapStatus          | Controls the widget's transaction state; pass a map of `txHash -> TxStatus`, or omit to let the widget poll itself | `Record<string, TxStatus>`                                                                                 | Optional           |

Notes:

- Included/Excluded sources use KyberSwap Aggregator DEX IDs. See: https://docs.kyberswap.com/kyberswap-solutions/kyberswap-aggregator/dex-ids
- `PoolType` enumerates supported protocols (e.g. Uniswap V3, PancakeSwap V3, Sushi V3, Algebra forks, Uniswap V2, Uniswap V4, etc.). Import it from this package and pick the one matching your pools.

### Styling

- You must import the stylesheet once in your app: `@kyberswap/liquidity-widgets/dist/style.css`.
- You can override the theme via the `theme` prop (CSS variables under the `--ks-lw-*` namespace). Example keys include `text`, `subText`, `icons`, `layer1`, `dialog`, `layer2`, `stroke`, `chartRange`, `chartArea`, `accent`, `warning`, `error`, `success`, `blue`, `fontFamily`, `borderRadius`, `buttonRadius`, `boxShadow`.
