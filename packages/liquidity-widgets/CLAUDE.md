# Liquidity Widgets Package

## Purpose

Zap In widget allowing users to add liquidity to concentrated liquidity pools using a single token. The widget handles token swapping, optimal routing, and liquidity provision in one transaction.

## Quick Start

```bash
# From monorepo root
pnpm build-package

# Build this package only
pnpm --filter @kyberswap/liquidity-widgets build

# Run demo
cd apps/zap-widgets-demo && pnpm dev
```

## Directory Structure

```
src/
├── components/          # React components
│   ├── Widget/          # Main widget component
│   ├── Preview/         # Transaction preview
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useZapIn.ts      # Core zap logic
│   ├── useTokenBalance.ts
│   └── ...
├── stores/              # Zustand state management
├── types/               # TypeScript definitions
├── constants/           # Chain configs, addresses
└── index.ts             # Public exports
```

## Key Files

| File                              | Purpose                    |
| --------------------------------- | -------------------------- |
| `src/components/Widget/index.tsx` | Main widget entry point    |
| `src/hooks/useZapIn.ts`           | Core zap transaction logic |
| `src/stores/widget.ts`            | Widget state management    |
| `src/types/index.ts`              | Shared TypeScript types    |

## Public API

```typescript
// Main export
import { LiquidityWidget } from '@kyberswap/liquidity-widgets';

// Props
interface WidgetProps {
  poolAddress: string;
  chainId: number;
  theme?: 'light' | 'dark';
  onClose?: () => void;
  onSuccess?: (txHash: string) => void;
}
```

## Testing

```bash
# Run tests
pnpm --filter @kyberswap/liquidity-widgets test

# Type check
pnpm --filter @kyberswap/liquidity-widgets type-check

# Lint
pnpm --filter @kyberswap/liquidity-widgets lint
```

## Code Patterns

### Adding a new hook

```typescript
// src/hooks/useNewHook.ts
import { useCallback, useMemo } from 'react';

import { useWidgetStore } from '../stores/widget';

export function useNewHook() {
  const { state } = useWidgetStore();

  const computedValue = useMemo(() => {
    // ...
  }, [state]);

  return { computedValue };
}
```

### Adding a new component

```typescript
// src/components/NewComponent/index.tsx
import styled from 'styled-components'

const Container = styled.div`
  // styles
`

export function NewComponent({ prop }: Props) {
  return <Container>{/* content */}</Container>
}
```

## Integration Examples

See `apps/zap-widgets-demo/` for complete integration examples.

## Dependencies

Key external dependencies:

- `@kyberswap/ks-sdk-core` - Token/chain utilities
- `ethers` - Ethereum interactions
- `styled-components` - Styling
- `zustand` - State management
