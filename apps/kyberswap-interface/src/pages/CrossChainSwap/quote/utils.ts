import { ChainId, Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { parseUnits } from 'viem'

import { ZERO_ADDRESS } from 'constants/index'
import { Chain, Currency, NonEvmChain, NormalizedQuote } from 'pages/CrossChainSwap/adapters'
import { type NearToken } from 'pages/CrossChainSwap/hooks/useNearTokens'
import { type SolanaToken } from 'pages/CrossChainSwap/hooks/useSolanaTokens'
import { Quote } from 'pages/CrossChainSwap/registry'
import { NEAR_STABLE_COINS, SOLANA_STABLE_COINS } from 'pages/CrossChainSwap/utils'

export type PairCategory = 'stablePair' | 'commonPair' | 'highVolatilityPair' | 'exoticPair'

export type EvmCrossChainCurrency = EvmCurrency & {
  chainId: ChainId
  isNative?: boolean
  wrapped: {
    address: string
    decimals: number
    isStable?: boolean
  }
}

type TokenPrice = {
  PriceBuy?: number
  PriceSell?: number
}

export type TokenPricesResponse = {
  data?: Record<string, Record<string, TokenPrice | undefined> | undefined>
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

export const isEvmCurrency = (currency: Currency | undefined): currency is EvmCrossChainCurrency => {
  const value: unknown = currency
  if (!isObject(value)) return false

  const wrapped = value.wrapped
  if (!isObject(wrapped)) return false

  return typeof wrapped.address === 'string' && typeof wrapped.decimals === 'number'
}

const isSolanaToken = (currency: Currency | undefined): currency is SolanaToken => {
  const value: unknown = currency
  return isObject(value) && typeof value.id === 'string'
}

const isNearToken = (currency: Currency | undefined): currency is NearToken => {
  const value: unknown = currency
  return isObject(value) && typeof value.assetId === 'string'
}

export const getTokenMidPriceUsd = (price: TokenPrice | undefined) => {
  const buy = price?.PriceBuy
  const sell = price?.PriceSell

  if (typeof buy === 'number' && typeof sell === 'number') return (buy + sell) / 2
  return buy || sell || 0
}

export const getCurrencyAddress = (currency: Currency) => {
  if (isEvmCurrency(currency)) return currency.isNative ? ZERO_ADDRESS : currency.wrapped.address
  if (isSolanaToken(currency)) return currency.id
  if (isNearToken(currency)) return currency.assetId
  return currency.symbol || ''
}

export const isStableCurrency = (currency: Currency | undefined, chain: Chain | undefined) => {
  if (isEvmCurrency(currency)) return !!currency.wrapped.isStable
  if (chain === NonEvmChain.Solana && isSolanaToken(currency)) return SOLANA_STABLE_COINS.includes(currency.id)
  if (chain === NonEvmChain.Near && isNearToken(currency)) return NEAR_STABLE_COINS.includes(currency.assetId)
  return false
}

export const createTimeoutPromise = (ms: number) =>
  new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), ms)
  })

const getNetOutputAmount = (quote: NormalizedQuote): bigint => {
  const { outputAmount, protocolFee, quoteParams } = quote
  const { tokenOutUsd, toToken } = quoteParams

  if (protocolFee && tokenOutUsd && tokenOutUsd > 0) {
    const decimals = toToken?.decimals || 18
    const protocolFeeInTokens = protocolFee / tokenOutUsd

    try {
      const protocolFeeInSmallestUnit = parseUnits(protocolFeeInTokens.toFixed(decimals), decimals)
      return outputAmount - protocolFeeInSmallestUnit
    } catch (error) {
      console.error('Error converting protocol fee:', error)
    }
  }
  return outputAmount
}

export const sortQuotesByNetOutput = (quotes: Quote[]) =>
  [...quotes].sort((a, b) => (getNetOutputAmount(a.quote) < getNetOutputAmount(b.quote) ? 1 : -1))
