// Explicit bounded inventories promoted by the checked-in sitemap and prerender pipeline.
export const SITEMAP_SWAP_CHAIN_SLUGS = [
  'ethereum',
  'arbitrum',
  'base',
  'optimism',
  'polygon',
  'bnb',
  'avalanche',
  'linea',
  'sonic',
  'berachain',
  'ronin',
  'unichain',
  'hyperevm',
  'plasma',
  'etherlink',
  'megaeth',
  'monad',
  'robinhood',
] as const

export const SITEMAP_LIMIT_CHAIN_SLUGS = [
  'ethereum',
  'arbitrum',
  'base',
  'optimism',
  'polygon',
  'bnb',
  'avalanche',
  'linea',
  'sonic',
  'berachain',
  'ronin',
  'unichain',
  'hyperevm',
  'megaeth',
  'monad',
  'robinhood',
] as const

/**
 * The bounded landing-page inventory advertised by the checked-in public sitemap.
 * Runtime chain routes outside this matrix remain available but are intentionally not promoted here.
 */
export const SITEMAP_PAGE_ROUTES = [
  '/',
  ...SITEMAP_SWAP_CHAIN_SLUGS.map(chain => `/swap/${chain}`),
  ...SITEMAP_LIMIT_CHAIN_SLUGS.map(chain => `/limit/${chain}`),
  '/cross-chain',
  '/earn',
  '/earn/pools',
  '/earn/positions',
  '/earn/smart-exit',
  '/market-overview',
  '/kyberdao/stake-knc',
  '/kyberdao/vote',
  '/kyberdao/knc-utility',
  '/about/kyberswap',
  '/about/knc',
]
