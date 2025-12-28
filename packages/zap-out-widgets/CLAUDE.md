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

## Directory Structure

```
src/
├── components/          # React components
│   ├── Widget/          # Main widget component
│   ├── PositionSelector/# LP position selection
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useZapOut.ts     # Core zap out logic
│   └── ...
├── stores/              # Zustand state management
├── types/               # TypeScript definitions
└── index.ts             # Public exports
```

## Key Files

| File                              | Purpose                        |
| --------------------------------- | ------------------------------ |
| `src/components/Widget/index.tsx` | Main widget entry point        |
| `src/hooks/useZapOut.ts`          | Core zap out transaction logic |
| `src/hooks/usePositions.ts`       | Fetch user's LP positions      |

## Public API

```typescript
import { ZapOutWidget } from '@kyberswap/zap-out-widgets';

interface ZapOutWidgetProps {
  positionId: string;
  chainId: number;
  theme?: 'light' | 'dark';
  onClose?: () => void;
  onSuccess?: (txHash: string) => void;
}
```

## Testing

```bash
pnpm --filter @kyberswap/zap-out-widgets test
pnpm --filter @kyberswap/zap-out-widgets type-check
pnpm --filter @kyberswap/zap-out-widgets lint
```

## Relationship with Other Packages

- Shares types/utilities with `@kyberswap/liquidity-widgets`
- Uses same styling patterns and component structure
- Reuses hooks where applicable
