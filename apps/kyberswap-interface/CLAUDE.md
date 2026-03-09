# KyberSwap Interface App

Main KyberSwap web application - DeFi interface for swapping tokens, providing liquidity, and managing positions across 16+ blockchain networks.

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
└── App.tsx              # Root component with route definitions
```

## State Management

- **Redux Toolkit**: Global app state (`state/swap/`, `state/user/`, `state/wallet/`)
- **RTK Query**: API/server state (`state/apis/`)
- **Local State**: Component-specific state

## Environment Variables

See `.env.example` for required variables (`VITE_INFURA_KEY`, `VITE_ALCHEMY_KEY`, etc.)
