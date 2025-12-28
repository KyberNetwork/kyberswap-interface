# PancakeSwap Liquidity Widgets Package

## Purpose

PancakeSwap-specific Zap In widget for adding liquidity to PancakeSwap V3 pools using a single token or multi tokens. Customized for PancakeSwap's UI patterns, and specific requirements.

## Quick Start

```bash
# From monorepo root
pnpm build-package

# Build this package only
pnpm --filter @kyberswap/pancake-liquidity-widgets build
```

## Public API

```typescript
import { PancakeLiquidityWidget } from "@kyberswap/pancake-liquidity-widgets";

interface PancakeLiquidityWidgetProps {
  theme?: Theme | "dark" | "light";
  walletClient: WalletClient | undefined;
  account: Address | undefined;
  chainId: number;
  networkChainId: number;
  initTickLower?: number;
  initTickUpper?: number;
  poolAddress: string;
  positionId?: string;
  feeAddress?: string;
  feePcm?: number;
  source: string;
  includedSources?: string;
  excludedSources?: string;
  initDepositTokens: string;
  initAmounts: string;
  poolType: PoolType;
  onDismiss: () => void;
  onTxSubmit?: (txHash: string) => void;
  onConnectWallet: () => void;
  onAddTokens: (tokenAddresses: string) => void;
  onRemoveToken: (tokenAddress: string) => void;
  onAmountChange: (tokenAddress: string, amount: string) => void;
  onOpenTokenSelectModal: () => void;
  farmContractAddresses?: string[];
}
```

## PancakeSwap Specifics

### Supported Chains

- BNB Smart Chain (56) - Primary
- Ethereum (1) - Secondary

## Testing

```bash
pnpm --filter @kyberswap/pancake-liquidity-widgets type-check
pnpm --filter @kyberswap/pancake-liquidity-widgets lint
```

## Relationship with Other Packages

- Fork/adaptation of `@kyberswap/liquidity-widgets`
- Similar structure and patterns
- Different contract integrations and branding
