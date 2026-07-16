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

export type ProductSitemapSection = {
  title: string
  routes: string[]
}

/**
 * The bounded, PO-approved product URL inventory advertised by the sitemap, grouped in the same order
 * as the requirement. Section titles are also emitted as XML comments in sitemap-pages.xml.
 * Runtime chain routes outside this matrix remain available but are intentionally not promoted here.
 */
export const PRODUCT_SITEMAP_SECTIONS: ProductSitemapSection[] = [
  {
    title: 'Core',
    routes: ['/'],
  },
  {
    title: 'Swap - per chain',
    routes: SITEMAP_SWAP_CHAIN_SLUGS.map(chain => `/swap/${chain}`),
  },
  {
    title: 'Limit Orders - per chain',
    routes: SITEMAP_LIMIT_CHAIN_SLUGS.map(chain => `/limit/${chain}`),
  },
  {
    title: 'Cross-chain and Earn',
    routes: ['/cross-chain', '/earn', '/earn/pools', '/earn/positions', '/earn/smart-exit'],
  },
  {
    title: 'Market, KyberDAO, and About',
    routes: [
      '/market-overview',
      '/kyberdao/stake-knc',
      '/kyberdao/vote',
      '/kyberdao/knc-utility',
      '/about/kyberswap',
      '/about/knc',
    ],
  },
]

export const PRODUCT_SITEMAP_ROUTES = PRODUCT_SITEMAP_SECTIONS.flatMap(section => section.routes)
