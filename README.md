# KyberSwap Interface

KyberSwap Interface is the unified frontend for the entire Kyber Network suite of products. This monorepo houses all KyberSwap frontend projects, allowing for a modular, scalable, and collaborative development environment.

- Website: [kyberswap.com](https://kyberswap.com/)
- Document: [docs.kyberswap.com](https://docs.kyberswap.com/)

## Prerequisites

- Node.js 18+
- pnpm (the repo uses pnpm workspaces)

## Accessing the KyberSwap Interface

To access the KyberSwap Interface, visit [kyberswap.com](https://kyberswap.com/)

## Development

### Install Dependencies

```bash
pnpm i
```

### Build packages

```bash
pnpm build-package
```

### Run

```bash
cd apps/kyberswap-interface && pnpm start
```

### Other Apps

- Zap Widgets Demo
  ```bash
  cd apps/zap-widgets-demo && pnpm dev
  ```
- Swap Widgets React Demo
  ```bash
  cd apps/swap-widgets-react-demo && pnpm dev
  ```
- Swap Widgets Next.js Demo
  ```bash
  cd apps/swap-widgets-nextjs-demo && pnpm dev
  ```

### Common Scripts

- Build all: `pnpm build`
- Lint: `pnpm lint`
- Type check: `pnpm type-check`

### Monorepo Packages

- Liquidity Widget: `packages/liquidity-widgets` — Add/Increase LP liquidity (Zap In)
- Zap Out Widget: `packages/zap-out-widgets` — Remove LP into a single token (Zap Out)
- Zap Migration Widget: `packages/zap-migration-widgets` — Migrate/reposition LP positions
- Pancake Liquidity Widget: `packages/pancake-liquidity-widgets` — PancakeSwap-specific Zap In

Refer to each package README for installation, usage, props, and examples.

## Contributions

**Please open all pull requests against the `main` branch.**
CI checks will run against all PRs.
