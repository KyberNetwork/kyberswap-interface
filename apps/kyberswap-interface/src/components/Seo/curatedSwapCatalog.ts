import { WETH } from '@kyberswap/ks-sdk-core'

import { SITEMAP_SWAP_CHAIN_SLUGS } from 'components/Seo/sitemapRoutes'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies, STABLE_TOKENS } from 'constants/tokens'
import { SwapIntent, resolveSwapIntentPair } from 'utils/routes'
import { getChainIdFromSlug } from 'utils/string'

type CuratedSwapChainSlug = (typeof SITEMAP_SWAP_CHAIN_SLUGS)[number]

type CuratedSwapSubject = {
  id: string
  symbol: string
}

export type CuratedSwapPair = {
  chainName: string
  intent: SwapIntent
  path: string
  subjectToken: CuratedSwapSubject
}

export type CuratedSwapIntentRedirect = {
  intent: SwapIntent
  sourcePath: string
  subjectToken: CuratedSwapSubject
  targetPath: string
}

type CuratedSwapChainCatalog = {
  pairs: CuratedSwapPair[]
  redirects: CuratedSwapIntentRedirect[]
}

// Curated inputs. Everything below is derived from these subjects and the supported intents.
const CURATED_SWAP_INTENTS = [SwapIntent.BUY, SwapIntent.SELL]

const CURATED_SWAP_SUBJECT_IDS_BY_CHAIN: Record<CuratedSwapChainSlug, readonly string[]> = {
  ethereum: ['eth', 'wbtc'],
  arbitrum: ['eth', 'arb'],
  base: ['eth', 'wbtc'],
  optimism: ['eth', 'op'],
  polygon: ['pol'],
  bnb: ['bnb', 'wbtc'],
  avalanche: ['avax'],
  linea: ['eth'],
  sonic: ['s'],
  berachain: ['bera'],
  ronin: ['ronin'],
  unichain: ['eth'],
  hyperevm: ['eth'],
  plasma: ['eth'],
  etherlink: ['xtz'],
  megaeth: ['eth'],
  monad: ['mon'],
  robinhood: ['eth'],
}

// Build each chain catalog once, including its pair targets and buy/sell redirects.
const buildCuratedSwapChainCatalog = (chainSlug: CuratedSwapChainSlug): CuratedSwapChainCatalog | undefined => {
  const chainId = getChainIdFromSlug(chainSlug)
  if (chainId === undefined) return undefined

  const nativeSymbol = NativeCurrencies[chainId].symbol
  const wrappedNative = WETH[chainId]
  const wrappedSymbol = wrappedNative?.symbol
  const stableCounter = STABLE_TOKENS[chainId]
  if (!nativeSymbol || !wrappedNative || !wrappedSymbol || !stableCounter?.symbol) return undefined

  const nativeId = nativeSymbol.toLowerCase()
  const wrappedSymbolId = wrappedSymbol.toLowerCase()
  const stableId = stableCounter.symbol.toLowerCase()
  const wrappedAliases = [wrappedNative.address.toLowerCase(), wrappedSymbolId]
  const subjectTokens: CuratedSwapSubject[] = CURATED_SWAP_SUBJECT_IDS_BY_CHAIN[chainSlug].map(id => {
    let symbol = id.toUpperCase()
    if (id === nativeId) {
      symbol = nativeSymbol
    } else if (wrappedAliases.includes(id)) {
      symbol = wrappedSymbol
    }
    return { id, symbol }
  })
  const knownTokenIds = new Set([nativeId, stableId, ...subjectTokens.map(({ id }) => id)])

  const redirects = subjectTokens.flatMap(subjectToken =>
    CURATED_SWAP_INTENTS.map(intent => {
      const { fromCurrency, toCurrency } = resolveSwapIntentPair({
        intent,
        subjectToken: subjectToken.id,
        nativeToken: nativeId,
        stableCounterToken: stableId,
        wrappedNativeAliases: wrappedAliases,
      })

      return {
        intent,
        sourcePath: `/${intent}/${chainSlug}/${subjectToken.id}`,
        subjectToken,
        targetPath: `${APP_PATHS.SWAP}/${chainSlug}/${fromCurrency}-to-${toCurrency}`,
      }
    }),
  )

  const pairByPath = new Map<string, CuratedSwapPair>()
  for (const { intent, subjectToken, targetPath } of redirects) {
    if (pairByPath.has(targetPath)) continue
    const [fromId, toId] = targetPath.slice(targetPath.lastIndexOf('/') + 1).split('-to-')
    if (!knownTokenIds.has(fromId) || !knownTokenIds.has(toId)) continue

    pairByPath.set(targetPath, {
      chainName: NETWORKS_INFO[chainId].name,
      intent,
      path: targetPath,
      subjectToken,
    })
  }

  return { pairs: [...pairByPath.values()], redirects }
}

// Materialized catalogs consumed by metadata, sitemaps, prerender and redirects.
const CURATED_SWAP_CATALOG: CuratedSwapChainCatalog[] = SITEMAP_SWAP_CHAIN_SLUGS.map(
  buildCuratedSwapChainCatalog,
).filter((chain): chain is CuratedSwapChainCatalog => Boolean(chain))

export const CURATED_SWAP_PAIR_ROUTES = CURATED_SWAP_CATALOG.flatMap(({ pairs }) => pairs.map(({ path }) => path))

export const CURATED_SWAP_INTENT_REDIRECTS = CURATED_SWAP_CATALOG.flatMap(({ redirects }) => redirects)

const CURATED_SWAP_PAIR_BY_PATH = new Map(
  CURATED_SWAP_CATALOG.flatMap(({ pairs }) => pairs.map(pair => [pair.path, pair] as const)),
)

export const getCuratedSwapPairByPath = (pathname: string) => CURATED_SWAP_PAIR_BY_PATH.get(pathname)
