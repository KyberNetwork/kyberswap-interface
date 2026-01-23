# Zap Out Widgets Package

## Purpose

Zap Out widget allowing users to remove liquidity from concentrated liquidity pools and receive a single token. Handles LP token burning, token swapping, and optimal routing in one transaction.

## Quick Start

```bash
# From monorepo root
pnpm build-package

# Build this package only
pnpm --filter @kyberswap/zap-out-widgets build

# Run demo
cd apps/zap-widgets-demo && pnpm dev
```

## Public API

```typescript
import { ZapOutWidget } from '@kyberswap/zap-out-widgets';

interface ZapOutWidgetProps {
  theme?: Theme;
  chainId: ChainId;
  rpcUrl?: string;
  poolAddress: string;
  poolType: PoolType;
  positionId: string;
  connectedAccount: {
    address?: string | undefined;
    chainId: number;
  };
  source: string;
  referral?: string;
  zapStatus?: Record<string, TxStatus>;
  locale?: SupportedLocale;
  onClose: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onSubmitTx: (
    txData: { from: string; to: string; value: string; data: string; gasLimit: string },
    additionalInfo?: {
      pool: string;
      dexLogo: string;
      tokensOut: Array<{ symbol: string; amount: string; logoUrl?: string }>;
    },
  ) => Promise<string>;
  onExplorePools?: () => void;
  signTypedData?: (account: string, typedDataJson: string) => Promise<string>;
}
```

## Testing

```bash
pnpm --filter @kyberswap/zap-out-widgets type-check
pnpm --filter @kyberswap/zap-out-widgets lint
```

## Relationship with Other Packages

- Shares types/utilities with `@kyberswap/liquidity-widgets`
- Uses same styling patterns and component structure
- Reuses hooks where applicable
