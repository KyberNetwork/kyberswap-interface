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
  sourcePositionId: string;
  chainId: number;
  theme?: 'light' | 'dark';
  onClose?: () => void;
  onSuccess?: (txHash: string) => void;
}
```

## Migration Types

1. **Same Protocol Migration**: Move position to different price range
2. **Cross Protocol Migration**: Move from KyberSwap to Uniswap V3 (or vice versa)
3. **Pool Migration**: Move between different token pairs

## Testing

```bash
pnpm --filter @kyberswap/zap-migration-widgets type-check
pnpm --filter @kyberswap/zap-migration-widgets lint
```

## Relationship with Other Packages

- Combines logic from both `liquidity-widgets` (Zap In) and `zap-out-widgets` (Zap Out)
- Shares types/utilities with sibling packages
- More complex state management due to two-step operation
