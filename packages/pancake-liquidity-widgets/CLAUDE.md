# PancakeSwap Liquidity Widgets Package

## Purpose

PancakeSwap-specific Zap In widget for adding liquidity to PancakeSwap V3 pools using a single token. Customized for PancakeSwap's contracts, UI patterns, and specific requirements.

## Quick Start

```bash
# From monorepo root
pnpm build-package

# Build this package only
pnpm --filter @kyberswap/pancake-liquidity-widgets build
```

## Directory Structure

```
src/
├── components/          # React components (PancakeSwap themed)
│   ├── Widget/          # Main widget component
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useZapIn.ts      # PancakeSwap-specific zap logic
│   └── ...
├── stores/              # Zustand state management
├── types/               # TypeScript definitions
├── constants/           # PancakeSwap contract addresses
└── index.ts             # Public exports
```

## Key Differences from liquidity-widgets

| Aspect           | liquidity-widgets   | pancake-liquidity-widgets |
| ---------------- | ------------------- | ------------------------- |
| Target Protocol  | KyberSwap Elastic   | PancakeSwap V3            |
| Contract ABIs    | KyberSwap contracts | PancakeSwap contracts     |
| Theming          | KyberSwap brand     | PancakeSwap brand         |
| Supported Chains | Multi-chain         | BSC-focused               |

## Public API

```typescript
import { PancakeLiquidityWidget } from "@kyberswap/pancake-liquidity-widgets";

interface PancakeLiquidityWidgetProps {
  poolAddress: string;
  chainId: number; // Primarily 56 (BSC)
  theme?: "light" | "dark";
  onClose?: () => void;
  onSuccess?: (txHash: string) => void;
}
```

## PancakeSwap Specifics

### Supported Chains

- BNB Smart Chain (56) - Primary
- Ethereum (1) - Secondary

### Contract Addresses

See `src/constants/contracts.ts` for PancakeSwap-specific addresses.

## Testing

```bash
pnpm --filter @kyberswap/pancake-liquidity-widgets test
pnpm --filter @kyberswap/pancake-liquidity-widgets type-check
pnpm --filter @kyberswap/pancake-liquidity-widgets lint
```

## Relationship with Other Packages

- Fork/adaptation of `@kyberswap/liquidity-widgets`
- Similar structure and patterns
- Different contract integrations and branding
