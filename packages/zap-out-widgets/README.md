# Kyber Zap Out Widgets

The `@kyberswap/zap-out-widgets` package provides a React component to zap out of an LP/NFT position into a single token using KyberSwap's Zap engine. It is small, configurable, and easy to embed in a modal or page.

Exports: `ZapOut`, `ChainId`, `PoolType`, `ZapStatus`.

## Installation

Install with your preferred package manager.

```
pnpm add @kyberswap/zap-out-widgets
```

```
yarn add @kyberswap/zap-out-widgets
```

```
npm i --save @kyberswap/zap-out-widgets
```

## Usage

Minimal example:

```tsx
import { ChainId, PoolType, ZapOut } from '@kyberswap/zap-out-widgets';
import '@kyberswap/zap-out-widgets/dist/style.css';

export default function Example() {
  // Provide these from your wallet/context (e.g. wagmi, web3-react, rainbowkit)
  const connectedAccount = { address: '0xYourAddress', chainId: ChainId.Base };

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
    <div style={{ width: 840, height: 680 }}>
      <ZapOut
        chainId={ChainId.Base}
        poolType={PoolType.DEX_UNISWAP_V4}
        poolAddress={'0xPoolAddressOrPoolId'}
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

For a more detailed example, refer to the demo component in this repository: [ZapOut.tsx (demo)](https://github.com/KyberNetwork/kyberswap-interface/blob/main/apps/zap-widgets-demo/src/components/ZapOut.tsx).

### Props

| Property         | Description                                                                                                        | Type                                                                                                       | Required / Default |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------ |
| chainId          | Network for the zap-out workflow                                                                                   | `ChainId` \| `number`                                                                                      | Required           |
| rpcUrl           | Use your own RPC endpoint                                                                                          | `string`                                                                                                   | Optional           |
| poolType         | Protocol/pool type                                                                                                 | `PoolType`                                                                                                 | Required           |
| poolAddress      | Pool address (or pool id for certain protocols like Uniswap v4)                                                    | `string`                                                                                                   | Required           |
| positionId       | Position identifier (NFT tokenId for v3/v4 or LP holder address for v2)                                            | `string`                                                                                                   | Required           |
| connectedAccount | Current connected account info                                                                                     | `{ address?: string; chainId: number }`                                                                    | Required           |
| source           | Identifier for your integration (used for attribution/analytics)                                                   | `string`                                                                                                   | Required           |
| referral         | Referral code (if any)                                                                                             | `string`                                                                                                   | Optional           |
| theme            | Optional theme tokens to override widget styles (CSS variables)                                                    | `Theme`                                                                                                    | Optional           |
| onConnectWallet  | Trigger your wallet connect flow                                                                                   | `() => void`                                                                                               | Required           |
| onSwitchChain    | Trigger your chain switch flow                                                                                     | `() => void`                                                                                               | Required           |
| onSubmitTx       | Submit the provided transaction object and return the tx hash. A `gasLimit` value is provided.                     | `(txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>` | Required           |
| onClose          | Called when the widget is closed                                                                                   | `() => void`                                                                                               | Required           |
| zapStatus        | Controls the widget's transaction state; pass a map of `txHash -> TxStatus`, or omit to let the widget poll itself | `Record<string, TxStatus>`                                                                                 | Optional           |

- `PoolType` enumerates supported protocols (e.g. Uniswap V3, PancakeSwap V3, Sushi V3, Algebra forks, Uniswap V2, Uniswap V4, etc.). Import it from this package and pick the one matching your pools.

### Styling

- You must import the stylesheet once in your app: `@kyberswap/zap-out-widgets/dist/style.css`.
- You can override the theme via the `theme` prop (CSS variables under the `--ks-lw-*` namespace). Example keys include `text`, `subText`, `icons`, `layer1`, `dialog`, `layer2`, `stroke`, `chartRange`, `chartArea`, `accent`, `warning`, `error`, `success`, `blue`, `fontFamily`, `borderRadius`, `buttonRadius`, `boxShadow`.
