# KyberSwap Interface App

## Purpose

The main KyberSwap web application - a full-featured DeFi interface for swapping tokens, providing liquidity, and managing positions across 16+ blockchain networks.

## Quick Start

```bash
# From monorepo root
pnpm i
pnpm build-package  # Build dependencies first!

# Run development server
cd apps/kyberswap-interface
pnpm dev

# Build for production
pnpm build
```

## Directory Structure

```
src/
├── components/          # Shared React components
├── pages/               # Route pages
├── hooks/               # Custom React hooks
├── state/               # Redux state management
├── services/            # API services
├── utils/               # Utility functions
├── constants/           # App constants, chain configs
├── theme/               # Styled-components theme
└── App.tsx              # Root component
```

## Key Pages

| Route     | Page         | Purpose                       |
| --------- | ------------ | ----------------------------- |
| `/swap`   | Swap         | Token swapping via aggregator |
| `/limit`  | Limit Orders | Gasless limit orders          |
| `/pools`  | Pools        | View and manage liquidity     |
| `/farms`  | Farms        | Yield farming                 |
| `/bridge` | Bridge       | Cross-chain transfers         |

## State Management

- **Redux Toolkit**: Global app state (user, wallet, swap)
- **RTK Query**: API/server state (prices, pools, positions)
- **Local State**: Component-specific state

### Key Redux Slices

```typescript
// state/swap/reducer.ts - Swap form state
// state/user/reducer.ts - User preferences
// state/wallet/reducer.ts - Wallet connection
// state/apis/*.ts - RTK Query API definitions
```

## Environment Variables

See `.env.example` for required environment variables:

```bash
VITE_INFURA_KEY=...
VITE_ALCHEMY_KEY=...
VITE_KYBERSWAP_API=...
```

## Testing

```bash
# Unit tests
pnpm test

# E2E tests (if available)
pnpm test:e2e

# Type check
pnpm type-check

# Lint
pnpm lint
```

## Routing

Uses React Router v6. Route definitions in `src/App.tsx` or `src/routes/`.

## Web3 Integration

- **wagmi** + **viem**: Wallet connection and chain management
- **ethers.js**: Contract interactions (legacy, migrating to viem)

### Wallet Connection Pattern

```typescript
import { useAccount, useConnect } from 'wagmi'

function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  // ...
}
```

## API Integration

### KyberSwap Aggregator API

```typescript
// services/aggregator.ts
const AGGREGATOR_API = 'https://aggregator-api.kyberswap.com'

// Get swap route
GET /api/v1/routes?tokenIn=...&tokenOut=...&amountIn=...
```

## Performance Considerations

- Use `React.memo` for expensive components
- Use `useMemo`/`useCallback` for computed values
- Lazy load routes with `React.lazy()`
- Optimize re-renders with proper dependency arrays

## Deployment

Deployed via CI/CD pipeline. Production builds:

```bash
pnpm build
# Output in dist/
```
