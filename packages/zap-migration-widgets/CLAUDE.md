# Zap Migration Widgets Package

## Purpose

Migration widget allowing users to move or reposition LP positions between pools or protocols. Handles removing liquidity from source, swapping tokens if needed, and adding liquidity to destination in optimized transactions.

## Quick Start

```bash
# From monorepo root
pnpm build-package

# Build this package only
pnpm --filter @kyberswap/zap-migration-widgets build

# Run demo
cd apps/zap-widgets-demo && pnpm dev
```

## Public API

```typescript
import { MigrationWidget } from '@kyberswap/zap-migration-widgets';

interface MigrationWidgetProps {
  theme?: Theme;
  chainId: ChainId;
  rpcUrl?: string;
  className?: string;
  from: {
    poolType: PoolType;
    poolAddress: string;
    positionId: string;
  };
  to?: {
    poolType: PoolType;
    poolAddress: string;
    positionId?: string;
  };
  initialSlippage?: number;
  rePositionMode?: boolean;
  initialTick?: {
    tickLower: number;
    tickUpper: number;
  };
  connectedAccount: {
    address: string | undefined;
    chainId: number;
  };
  aggregatorOptions?: {
    includedSources?: string[];
    excludedSources?: string[];
  };
  feeConfig?: {
    feePcm: number;
    feeAddress: string;
  };
  client: string;
  referral?: string;
  zapStatus?: Record<string, TxStatus>;
  locale?: SupportedLocale;
  onExplorePools?: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onSubmitTx: (
    txData: { from: string; to: string; value: string; data: string; gasLimit: string },
    additionalInfo?: {
      sourcePool: string;
      sourceDexLogo: string;
      destinationPool: string;
      destinationDexLogo: string;
    },
  ) => Promise<string>;
  signTypedData?: (account: string, typedDataJson: string) => Promise<string>;
  onViewPosition?: (txHash: string) => void;
  onBack?: () => void;
  onClose: () => void;
}
```

## Testing

```bash
pnpm --filter @kyberswap/zap-migration-widgets type-check
pnpm --filter @kyberswap/zap-migration-widgets lint
```

## Relationship with Other Packages

- Shares types/utilities with sibling packages
- More complex state management due to two-step operation
