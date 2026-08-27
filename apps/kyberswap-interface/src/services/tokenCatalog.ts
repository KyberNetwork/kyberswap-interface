import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { TOKEN_API_URL } from 'constants/env'
import { PAIR_CATEGORY } from 'constants/trade'

/**
 * Single source of truth for the public `token-api` (token catalog) service: token
 * prices, honeypot/FOT info, token & pair categories, the per-chain quote-token
 * config, and the market-overview assets + favorites. Both the RTK Query hooks (for
 * React consumers) and the plain fetchers (for imperative flows that cannot use hooks
 * — RTK `transformResponse`, cross-chain adapters, chunked price loaders) resolve
 * against the definitions below so the endpoint URLs and response shapes live in one
 * place.
 */

/** Either side can be absent when the price service cannot value that leg of the market. */
export type TokenPriceEntry = { PriceBuy?: number; PriceSell?: number }

export type TokenPricesResponse = {
  data: { [chainId: string]: { [address: string]: TokenPriceEntry } }
}

/** Map of chainId → token addresses to price. Supports multiple chains in one request. */
export type TokenPricesBody = { [chainId: string]: string[] }

export type HoneypotInfo = {
  isHoneypot: boolean
  isFOT: boolean
  tax: number
}

export type TokenCategoryItem = { token: string; category: string }

type TokenCategoryParams = {
  chainId: number | string
  tokens: string
}

type CheckSameAssetResponse = {
  data?: { sameAsset?: boolean }
}

type CheckSameAssetParams = {
  chainIdA: number | string
  addressA: string
  chainIdB: number | string
  addressB: string
}

/** Per-token market metrics embedded in the token-catalog `/tokens` list response. */
export type TokenCatalogMetrics = {
  price?: number
  /** 24h price change in percent (e.g. 1.25 = +1.25%). Can be `null` when unknown. */
  priceChange24h?: number | null
  kyberScore?: number
  liquidityUsd?: number
  /** Market capitalization in USD. Absent for tokens the catalog has no circulating supply for. */
  marketCap?: number
  stats24h?: { volume24h?: number }
}

/** Raw token shape returned by the public token-catalog `/tokens` list endpoint. */
export type TokenCatalogListToken = {
  id: number
  chainId: string
  address: string
  name: string
  symbol: string
  decimals: number
  logoURL?: string
  isWhitelisted?: boolean
  isStable?: boolean
  isStandardERC20?: boolean
  cmcRank?: number
  marketCap?: number
  createdAt?: number
  whitelistedAt?: number
  metrics?: TokenCatalogMetrics
}

export type TokenCatalogListResponse = {
  data: { tokens: TokenCatalogListToken[]; pagination?: { totalItems: number } }
}

type TokenCatalogParams = Record<string, string | number | boolean | undefined>

type TokenConfigResponse = {
  data: { onchainPrice: { usdQuoteTokenByChainId: { [chain: string]: { symbol: string } } } }
}

export interface QueryParams {
  search?: string
  user?: string
  isFavorite?: boolean
  tags: string[]
  sort?: string
  page?: number
  pageSize?: number
  chainId?: number
}

export interface AssetToken {
  id: number
  name: string
  symbol: string
  decimals: number
  logoURL: string
  type: string
  tags: string
  tokens: Array<{
    chainId: number
    address: string
    priceBuy: number
    priceBuyChange24h: number
    priceBuyChange1h: number
    priceBuyChange7d: number
    priceSell: number
    priceSellChange24h: number
    priceSellChange1h: number
    priceSellChange7d: number
  }>
  isStable: string
  volume24h: string
  marketCap: string
  allTimeLow: string
  allTimeHigh: string
  isFavorite: boolean
}

interface MarketAssetsResponse {
  data: {
    assets: Array<AssetToken>
    pagination: {
      totalItems: number
    }
  }
}

interface AddRemoveFavoriteParams {
  user: string
  assetIds: number[]
  message: string
  signature: string
}

/**
 * The single definition of a token's USD price across the app: the mid of the buy/sell spread, or
 * `null` when either side is missing — a one-sided quote comes from a market the price service could
 * only value on one leg and can sit orders of magnitude away from the tradable price.
 */
export const getMidPrice = (entry?: TokenPriceEntry): number | null =>
  entry?.PriceBuy && entry?.PriceSell ? (entry.PriceBuy + entry.PriceSell) / 2 : null

/** Fetch buy/sell prices for one or more chains. */
export const fetchTokenPrices = async (
  body: TokenPricesBody,
  options?: { signal?: AbortSignal },
): Promise<TokenPricesResponse> => {
  const res = await fetch(`${TOKEN_API_URL}/v1/public/tokens/prices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: options?.signal,
  })
  // Error replies carry a JSON envelope too, so without this check they parse into a response with
  // no `data` and read back as "these tokens have no price" instead of as a failure to retry.
  if (!res.ok) throw new Error(`Token prices request failed with status ${res.status}`)
  return res.json()
}

/** Fetch the category (stable/common/exotic/high-volatility) of one or more tokens on a chain. */
export const fetchTokenCategories = async ({ chainId, tokens }: TokenCategoryParams): Promise<TokenCategoryItem[]> => {
  const res = await fetch(`${TOKEN_API_URL}/v1/public/category/token?tokens=${tokens}&chainId=${chainId}`)
  const json = await res.json()
  return json?.data ?? []
}

/**
 * Fetch tokens straight from the public token-catalog list endpoint, bypassing ks-setting.
 * Used where ks-setting does not expose the needed fields/sort (e.g. `createdAt` for the New tab).
 */
export const fetchTokenCatalogTokens = async (params: TokenCatalogParams): Promise<TokenCatalogListResponse> => {
  const search = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString()
  const res = await fetch(`${TOKEN_API_URL}/v1/public/tokens?${search}`)
  return res.json()
}

const tokenCatalogApi = createApi({
  reducerPath: 'tokenCatalogApi',
  baseQuery: fetchBaseQuery({
    baseUrl: TOKEN_API_URL,
  }),
  keepUnusedDataFor: 60,
  endpoints: builder => ({
    getPrices: builder.query<TokenPricesResponse, TokenPricesBody>({
      queryFn: async body => {
        try {
          return { data: await fetchTokenPrices(body) }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } }
        }
      },
    }),

    getQuoteByChain: builder.query<TokenConfigResponse, void>({
      query: () => ({ url: '/v1/public/tokens/config' }),
    }),

    getHoneypotInfo: builder.query<{ data?: HoneypotInfo }, { chainId: number; address: string }>({
      query: ({ chainId, address }) => ({
        url: '/v1/public/tokens/honeypot-fot-info',
        params: { address, chainId },
      }),
    }),

    getTokenCategory: builder.query<TokenCategoryItem[], TokenCategoryParams>({
      queryFn: async args => {
        try {
          return { data: await fetchTokenCategories(args) }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } }
        }
      },
    }),

    checkSameAsset: builder.query<boolean, CheckSameAssetParams>({
      query: ({ chainIdA, addressA, chainIdB, addressB }) => ({
        url: '/v1/public/asset-groups/same-asset',
        params: {
          chainIdA,
          addressA: addressA.toLowerCase(),
          chainIdB,
          addressB: addressB.toLowerCase(),
        },
      }),
      transformResponse: (response: CheckSameAssetResponse) => response.data?.sameAsset === true,
    }),

    checkPair: builder.query<
      { data: { category: PAIR_CATEGORY } },
      { chainId: number; tokenIn: string; tokenOut: string }
    >({
      query: ({ chainId, tokenIn, tokenOut }) => ({
        url: '/v1/public/category/pair',
        params: { chainId, tokenIn, tokenOut },
      }),
    }),

    marketOverview: builder.query<MarketAssetsResponse, QueryParams>({
      query: params => ({
        url: '/v1/public/assets',
        params: {
          ...params,
          chainIds: params.chainId,
          isFavorite: params.isFavorite || undefined,
          search: (params.search || '').trim(),
          tags: params.tags.length ? params.tags.join(',') : undefined,
        },
      }),
    }),

    addFavorite: builder.mutation<void, AddRemoveFavoriteParams>({
      query: body => ({
        method: 'POST',
        body,
        url: '/v1/public/assets/favorite',
      }),
    }),

    removeFavorite: builder.mutation<void, AddRemoveFavoriteParams>({
      query: body => ({
        method: 'DELETE',
        body,
        url: '/v1/public/assets/favorite',
      }),
    }),
  }),
})

export const {
  useGetPricesQuery,
  useGetQuoteByChainQuery,
  useGetHoneypotInfoQuery,
  useGetTokenCategoryQuery,
  useLazyCheckSameAssetQuery,
  useCheckPairQuery,
  useMarketOverviewQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} = tokenCatalogApi

export default tokenCatalogApi
