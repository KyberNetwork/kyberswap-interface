# Danh sách Public API được sử dụng trong KyberSwap Interface Monorepo

## 1. KyberSwap Internal APIs

### 1.1. KyberSwap Setting API

- **Base URL**: `https://ks-setting.kyberswap.com/api`
- **Endpoints**:
  - `/v1/configurations/fetch` - Lấy cấu hình KyberSwap theo chain
  - `/v1/configurations/fetch` - Lấy cấu hình global
  - `/v1/dexes` - Danh sách DEX
  - `/v1/tokens` - Danh sách tokens
  - `/v1/tokens/import` - Import token
  - `/v1/tokens/popular` - Top tokens

### 1.2. KyberSwap BFF API (Backend For Frontend)

- **Base URL**: Từ env variable `VITE_BFF_API`
- **Endpoints**:
  - `/v1/pools` - Thông tin pools
  - `/v1/coingecko/api/v3/*` - Proxy cho CoinGecko API
  - `/v1/profile/me` - User profile
  - `/v1/profile/me/connected-wallets` - Connected wallets
  - `/v1/profile/me/link-email` - Link email
  - `/v1/profile/me/confirm-email` - Verify email
  - `/v1/profile/me/notification-subscriptions` - Notification subscriptions
  - `/v1/profile/me/watched-wallets` - Watched wallets
  - `/v1/notification/me` - Private announcements
  - `/v1/notification/me/number-unread` - Số lượng unread notifications
  - `/v1/notification/me/read` - Mark as read
  - `/v1/notification/me/clear-all` - Clear all notifications
  - `/v1/price-alert` - Price alerts
  - `/v1/price-alert/statistics` - Price alert stats
  - `/v1/cross-chain-history/squid-transfers` - Cross-chain transaction history
  - `/v1/cross-chain-history/multichain-transfers` - Bridge transaction history
  - `/v1/ks-setting/buckets/signed-url-put` - Upload image
  - `/v1/referral/shared-links` - Referral shared links

### 1.3. Aggregator API

- **Base URL**: Từ env variable `VITE_AGGREGATOR_API`
- **Endpoints**:
  - `/{chain}/route` - Get swap route
  - `/{chain}/route/build` - Build swap transaction

### 1.4. Aggregator Stats API

- **Base URL**: Từ env variable `VITE_AGGREGATOR_STATS_API`
- **Endpoints**:
  - `/api/max-apr-and-total-earning` - Max APR và total earnings
  - `/api/volume` - Volume statistics

### 1.5. Token API

- **Base URL**: Từ env variable `VITE_TOKEN_API_URL`
- **Endpoints**:
  - `/v1/public/tokens/prices` - Token prices
  - `/v1/public/tokens/config` - Token configuration
  - `/v1/public/tokens/honeypot-fot-info` - Honeypot/FOT info
  - `/v1/public/category/token` - Token category
  - `/v1/public/category/pair` - Pair category
  - `/v1/public/assets` - Market overview assets
  - `/v1/public/assets/favorite` - Favorite assets (POST/DELETE)

### 1.6. Zap API

- **Base URL**: `https://zap-api.kyberswap.com`
- **Endpoints**:
  - `/{chain}/api/v1/create/route` - Create liquidity route
  - `/{chain}/api/v1/create/route/build` - Build create liquidity transaction
  - `/{chain}/api/v1/in/route` - Add liquidity route
  - `/{chain}/api/v1/in/route/build` - Build add liquidity transaction
  - `/{chain}/api/v1/out/route` - Remove liquidity route
  - `/{chain}/api/v1/out/route/build` - Build remove liquidity transaction
  - `/{chain}/api/v1/migrate/route` - Migrate liquidity route
  - `/{chain}/api/v1/migrate/route/build` - Build migrate liquidity transaction
  - `/{chain}/api/v1/compound/route/build` - Build compound transaction

### 1.7. Zap Earn API

- **Base URL**: `https://zap-earn-service-v3.kyberengineering.io/api` hoặc từ env `VITE_ZAP_EARN_URL`
- **Endpoints**:
  - `/v1/explorer/landing-page` - Landing page data
  - `/v1/protocol` - Supported protocols
  - `/v1/explorer/pools` - Pools explorer
  - `/v1/userPositions` - User positions
  - `/v1/apr-estimation` - APR estimation

### 1.8. Reward Service API

- **Base URL**: Từ env variable `VITE_REWARD_SERVICE_API`
- **Endpoints**:
  - `/kem/batch-claim/erc721` - Batch claim rewards
  - `/kem/claim/erc721` - Claim reward
  - `/kem/owner/claim-status` - Claim status
  - `/rewards/claim` - Claim rewards

### 1.9. Limit Order API

- **Base URL**: Từ env variable `VITE_LIMIT_ORDER_API`
- **Endpoints**:
  - `/read-ks/api/v1/configs/contract-address` - Contract address config
  - `/read-ks/api/v1/orders` - List orders
  - `/read-ks/api/v1/orders/insufficient-funds` - Insufficient fund orders
  - `/read-ks/api/v1/orders/active-making-amount` - Active making amount
  - `/read-ks/api/v1/encode/cancel-batch-orders` - Encode cancel batch
  - `/read-ks/api/v1/encode/increase-nonce` - Encode increase nonce
  - `/read-partner/api/v1/orders/allchains` - Orders by token pair
  - `/write/api/v1/orders` - Create order
  - `/write/api/v1/orders/sign-message` - Sign message
  - `/write/api/v1/orders/cancel-sign` - Cancel order signature
  - `/write/api/v1/orders/cancel` - Cancel orders
  - `/write/api/v1/orders/cancelling` - Insert cancelling order
  - `/write/api/v1/events/filled` - Acknowledge filled order
  - `/write/api/v1/events/cancelled` - Acknowledge cancelled order
  - `/write/api/v1/events/expired` - Acknowledge expired order

### 1.10. KyberDAO Stats API

- **Base URL**: Từ env variable `VITE_KYBER_DAO_STATS_API`
- **Endpoints**:
  - `/api/v1/stakers/{account}/refunds/total` - Gas refund total
  - `/api/v1/stakers/{account}/refunds/eligible-transactions` - Eligible transactions
  - `/api/v1/stakers/{account}/refund-info` - Refund info
  - `/api/v1/stakers/{account}/votes` - Staker votes
  - `/api/v1/stakers/{account}/actions` - Staker actions
  - `/api/v1/gas-refund/program/next-cycle-info` - Next cycle info
  - `/api/v1/gas-refund/program/info` - Program info
  - `/api/v1/reward-stats` - Reward statistics
  - `/dao-info` - DAO info
  - `/proposals` - Proposals list
  - `/proposals/{id}` - Proposal detail
  - `/stakers/{account}` - Staker info

### 1.11. KyberData API

- **Base URL**: Từ env variable `VITE_KYBERDATA_API`
- **Endpoints**:
  - `/{chain}/api/v1/reward-config/{poolAddress}` - Reward cycle config

### 1.12. Campaign API

- **Base URL**: Từ env variable `VITE_CAMPAIGN_URL`
- **Endpoints**:
  - `/v1/{program}/leader-boards` - Leaderboards
  - `/v1/{program}/rewards/{wallet}/weekly` - Weekly rewards
  - `/v1/{program}/rewards/{wallet}/all` - All rewards

### 1.13. Campaign Raffle API

- **Base URL**: `https://raffle-campaign.kyberswap.com/api`
- **Endpoints**:
  - `/stats` - Campaign stats
  - `/participant` - Participant info
  - `/txs` - Transactions
  - `/join/week_1` - Join week 1
  - `/join/week_2` - Join week 2

### 1.14. Referral API

- **Base URL**: Từ env variable `VITE_REFERRAL_URL`
- **Endpoints**:
  - `/v3/participants` - Get/create participant
  - `/v3/auth/nonce/{wallet}` - Get nonce
  - `/v3/referrals` - Referrals dashboard
  - `/v3/shared-links/{code}` - Get shared link
  - `/v3/shared-links` - Create shared link

### 1.15. Common Service API

- **Base URL**: Từ env variable `VITE_COMMON_SERVICE_API`
- **Endpoints**:
  - `/v1/treasury-grant/zkme-access-token` - ZKME access token
  - `/v1/treasury-grant/options` - User options (GET/POST)
  - `/v1/treasury-grant/options?walletAddress={address}` - Get user option

### 1.16. Blackjack API

- **Base URL**: Từ env variable `VITE_BLACKJACK_API`
- **Endpoints**:
  - `/v1/check` - Check blacklist

### 1.17. Block Service API

- **Base URL**: Từ env variable `VITE_BLOCK_SERVICE_API`
- **Endpoints**: (Sử dụng trong các service khác)

### 1.18. Notification API

- **Base URL**: Từ env variable `VITE_NOTIFICATION_API`
- **Endpoints**:
  - `/v1/messages/announcements` - Public announcements

### 1.19. Affiliate Service API

- **Base URL**: Từ env variable `VITE_AFFILIATE_SERVICE`
- **Endpoints**: (Sử dụng trong các service khác)

### 1.20. Cross-Chain Aggregator API

- **Base URL**: Từ env variable `VITE_CROSSCHAIN_AGGREGATOR_API`
- **Endpoints**:
  - `/api/v1/quotes` - Cross-chain quotes

## 2. External Third-Party APIs

### 2.1. CoinGecko API

- **Base URL**: `https://api.coingecko.com/api/v3`
- **Endpoints**:
  - `/coins/{id}` - Coin information
  - `/coins/{network}/contract/{address}` - Token by contract address
  - `/coins/{id}/tickers` - Liquidity markets

### 2.2. GoPlus Labs API (Token Security)

- **Base URL**: `https://api.gopluslabs.io/api/v1/token_security`
- **Endpoints**:
  - `/{chainId}?contract_addresses={address}` - Token security info

### 2.3. GeckoTerminal API (via Proxy)

- **Base URL**: `https://proxy.kyberswap.com/geckoterminal/api/v2`
- **Endpoints**:
  - `/networks/{network}/tokens/{address}/pools` - Token top pools
  - `/networks/{network}/pools/{poolAddress}/ohlcv/{timeframe}` - OHLCV data

### 2.4. Merkl API

- **Base URL**: `https://api.merkl.xyz/v4`
- **Endpoints**:
  - `/users/{address}/rewards` - Merkl rewards

### 2.5. Relay API

- **Base URL**: Từ constant `MAINNET_RELAY_API` (Reservoir SDK)
- **Endpoints**:
  - `/intents/status/v2` - Transaction status
  - (SDK methods: `getQuote`, `execute`)

### 2.6. Bungee API

- **Base URL**:
  - Production: `https://backend.bungee.exchange`
  - Public: `https://public-backend.bungee.exchange`
- **Endpoints**:
  - `/api/v1/bungee/quote` - Get quote
  - `/api/v1/bungee/status?requestHash={hash}` - Transaction status

### 2.7. XY Finance API

- **Base URL**: `https://aggregator-api.xy.finance/v1`
- **Endpoints**:
  - `/quote` - Get quote
  - `/buildTx` - Build transaction
  - `/crossChainStatus` - Transaction status

### 2.8. Symbiosis API

- **Base URL**: `https://api.symbiosis.finance/crosschain/v1`
- **Endpoints**:
  - `/swap` - Get swap quote
  - `/tx/{chainId}/{txHash}` - Transaction status

### 2.9. Across API

- **Base URL**: `https://app.across.to/api`
- **Endpoints**:
  - `/suggested-fees` - Get suggested fees
  - `/deposit/status?depositTxHash={hash}` - Transaction status
- **SDK**: `@across-protocol/app-sdk` (getSwapQuote, executeSwapQuote)

### 2.10. deBridge API

- **Base URL**: `https://dln.debridge.finance/v1.0/dln/order`
- **Endpoints**:
  - `/quote` - Get quote
  - `/create-tx` - Create transaction
  - `/{orderId}/status` - Order status

### 2.11. Optimex API

- **Base URL**: `https://ks-provider.optimex.xyz/v1`
- **Endpoints**:
  - `/tokens` - Get supported tokens
  - `/solver/indicative-quote` - Get indicative quote
  - `/trades/estimate` - Estimate trade
  - `/trades/initiate` - Initiate trade
  - `/trades/{tradeId}/submit-tx` - Submit transaction
  - `/trades/{tradeId}` - Get trade status
- **External**: `https://api.optimex.xyz/v1/tokens/{symbol}` - Token price

### 2.12. Squid Router API

- **Base URL**:
  - Production: `https://apiplus.squidrouter.com`
  - Testnet: `https://testnet.api.0xsquid.com`
- **Endpoints**: (Sử dụng qua SDK)

### 2.13. Axelar Scan API

- **Base URL**:
  - Production: `https://axelarscan.io/gmp/`
  - Testnet: `https://testnet.axelarscan.io/gmp/`
- **Endpoints**: (Sử dụng để track GMP transactions)

### 2.14. Multichain Scan API

- **Base URL**: `https://scanapi.multichain.org/v3`
- **Endpoints**:
  - `/tx/{hash}` - Transaction details

## 3. Analytics & Monitoring APIs

### 3.1. Sentry

- **DNS**: Từ env variable `VITE_SENTRY_DNS`
- **Purpose**: Error tracking và monitoring

### 3.2. Mixpanel

- **Project Token**: Từ env variable `VITE_MIXPANEL_PROJECT_TOKEN`
- **Cross-Chain Token**: Từ env variable `VITE_MIXPANEL_CROSS_CHAIN_PROJECT_TOKEN`
- **Purpose**: Analytics tracking

### 3.3. Google Tag Manager

- **GTM ID**: Từ env variable `VITE_GTM_ID`
- **Purpose**: Analytics và tracking

## 4. Firebase Services

### 4.1. Firebase (Development)

- **Project**: `test-bace2`
- **Database URL**: `https://test-bace2-default-rtdb.asia-southeast1.firebasedatabase.app`

### 4.2. Firebase (Staging)

- **Project**: `notification---staging`

### 4.3. Firebase (Production)

- **Project**: `notification---production`

### 4.4. Firebase Limit Order (Development)

- **Project**: `limit-order-dev`

### 4.5. Firebase Limit Order (Staging)

- **Project**: `staging-339203`

## 5. RPC Providers

### 5.1. Solana RPC

- **Base URL**: Từ env variable `VITE_SOLANA_RPC`
- **Purpose**: Solana blockchain interactions

## 6. Other Services

### 6.1. Transak

- **URL**: Từ env variable `VITE_TRANSAK_URL`
- **API Key**: Từ env variable `VITE_TRANSAK_API_KEY`
- **Purpose**: Fiat on-ramp

### 6.2. WalletConnect

- **Project ID**: Từ env variable `VITE_WALLETCONNECT_PROJECT_ID`
- **Purpose**: Wallet connections

## 7. Documentation URLs

- `https://docs.kyberswap.com/kyberswap-solutions/kyberswap-zap-as-a-service/zap-fee-model` - Zap fee model documentation
- `https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/price-impact` - Price impact explanation
- `https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage` - Slippage explanation
- `https://docs.kyberswap.com/governance/kyberdao` - KyberDAO documentation

## 8. External Links

- `https://analytics.kyberswap.com/classic` - DMM Analytics
- `https://analytics.kyberswap.com/elastic` - PROMM Analytics
- `https://lookerstudio.google.com/reporting/a2a0c9ff-6388-4d3a-bbf0-0fcfce9d5def` - Aggregator Analytics
- `https://discord.gg/kyberswap` - Discord
- `https://twitter.com/KyberNetwork` - Twitter

## Ghi chú

- Tất cả các API URLs có thể thay đổi tùy theo environment (development, staging, production)
- Một số API yêu cầu authentication (OAuth2) thông qua `baseQueryOauth`
- Các API được sử dụng thông qua RTK Query (Redux Toolkit Query) trong hầu hết các trường hợp
- Một số API được gọi trực tiếp qua `fetch` hoặc `axios`
