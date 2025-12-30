# Liquidity Widgets Package

## Purpose

Zap In widget allowing users to add liquidity to concentrated liquidity pools using a single token or multi tokens. The widget handles token swapping, optimal routing, and liquidity provision in one transaction.

## Quick Start

```bash
# From monorepo root
pnpm build-package

# Build this package only
pnpm --filter @kyberswap/liquidity-widgets build

# Run demo
cd apps/zap-widgets-demo && pnpm dev
```

## Public API

```typescript
// Main export
import { LiquidityWidget } from '@kyberswap/liquidity-widgets';

// Props
interface WidgetProps {
  theme?: Theme;
  chainId: ChainId;
  rpcUrl?: string;
  poolAddress: string;
  positionId?: string;
  poolType: PoolType;
  connectedAccount: {
    address?: string | undefined;
    chainId: number;
  };
  initDepositTokens?: string;
  initAmounts?: string;
  source: string;
  aggregatorOptions?: {
    includedSources?: string[];
    excludedSources?: string[];
  };
  feeConfig?: {
    feePcm: number;
    feeAddress: string;
  };
  referral?: string;
  fromCreatePoolFlow?: boolean;
  initialTick?: { tickLower: number; tickUpper: number };
  zapStatus?: Record<string, TxStatus>;
  locale?: SupportedLocale;
  onClose?: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onOpenZapMigration?: (
    position: {
      exchange: string;
      poolId: string;
      positionId: string | number;
    },
    initialTick?: { tickLower: number; tickUpper: number },
    initialSlippage?: number,
  ) => void;
  onSuccess?: ({ txHash, position }: OnSuccessProps) => void;
  onSubmitTx: (
    txData: { from: string; to: string; value: string; data: string; gasLimit: string },
    additionalInfo?: {
      tokensIn: Array<{ symbol: string; amount: string; logoUrl?: string }>;
      pool: string;
      dexLogo: string;
    },
  ) => Promise<string>;
  signTypedData?: (account: string, typedDataJson: string) => Promise<string>;
  onViewPosition?: (txHash: string) => void;
}
```

## Testing

```bash
# Type check
pnpm --filter @kyberswap/liquidity-widgets type-check

# Lint
pnpm --filter @kyberswap/liquidity-widgets lint
```

## Integration Examples

See `apps/zap-widgets-demo/` for complete integration examples.
