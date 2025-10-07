# KyberSwap Interface

An open source interface for KyberSwap -- a protocol for decentralized exchange.

- Website: [kyberswap.com](https://kyberswap.com/)
- Docs: [docs.kyberswap.com](https://docs.kyberswap.com/)

## Prerequisites

- Node.js 18+
- pnpm (workspace uses pnpm)

## Accessing the KyberSwap Interface

To access the KyberSwap Interface, visit [kyberswap.com](https://kyberswap.com/)

## Development

### Install Dependencies

```bash
# from repo root
pnpm i
```

### Build shared packages (from repo root)

```bash
pnpm build-package
```

### Run

```bash
# from this directory
pnpm start         # production mode
pnpm start-dev     # development mode
pnpm start-stg     # staging mode
```

### Other scripts

- Build app: `pnpm build`
- Preview build: `pnpm preview`
- Lint: `pnpm lint`
- Storybook: `pnpm storybook` / `pnpm build-storybook`

## Contributions

**Please open all pull requests against the `main` branch.**
CI checks will run against all PRs.
