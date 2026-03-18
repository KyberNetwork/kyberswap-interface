import { formatUnits } from '@ethersproject/units'
import {
  NATIVE_TOKEN_ADDRESS,
  NETWORKS_INFO,
  PoolType,
  Token,
  Pool as ZapPool,
  univ2Types,
  univ3Types,
} from '@kyber/schema'

import { formatDisplayNumber } from 'utils/numbers'

export const ADD_LIQUIDITY_ERROR = {
  SELECT_TOKEN_IN: 'Select token in',
  ENTER_MIN_PRICE: 'Enter min price',
  ENTER_MAX_PRICE: 'Enter max price',
  INVALID_PRICE_RANGE: 'Invalid price range',
  ENTER_AMOUNT: 'Enter amount',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  INVALID_INPUT_AMOUNT: 'Invalid input amount',
} as const

export const countDecimals = (value: string) => {
  if (!value.includes('.')) return 0
  return value.split('.')[1]?.length || 0
}

export const getNetworkInfo = (chainId: number) => NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]

export const isUniV3PoolType = (poolType?: PoolType) =>
  poolType !== undefined && univ3Types.some(type => type === poolType)

export const isUniV2PoolType = (poolType?: PoolType) =>
  poolType !== undefined && univ2Types.some(type => type === poolType)

export const hasPositiveAmount = (amounts: string) =>
  amounts.split(',').some(amount => Number.isFinite(Number(amount.trim())) && Number(amount.trim()) > 0)

export const parseTokensAndAmounts = (tokens: Token[], amounts: string) => {
  const amountList = amounts.split(',')
  const parsedTokens: Token[] = []
  const parsedAmounts: string[] = []

  tokens.forEach((token, index) => {
    const amount = amountList[index]?.trim() || ''
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return

    parsedTokens.push(token)
    parsedAmounts.push(amount)
  })

  return {
    tokens: parsedTokens,
    amounts: parsedAmounts,
  }
}

export const getParsedTokensIn = (tokens: Token[], amounts: string) => {
  const { tokens: parsedTokens, amounts: parsedAmounts } = parseTokensAndAmounts(tokens, amounts)

  return parsedTokens.map((token, index) => ({
    symbol: token.symbol,
    logoUrl: token.logo,
    amount: formatDisplayNumber(parsedAmounts[index], {
      significantDigits: 6,
    }),
  }))
}

export const validateAddLiquidityInput = ({
  tokens,
  amounts,
  balances,
  isUniV3,
  tickLower,
  tickUpper,
}: {
  tokens: Token[]
  amounts: string
  balances: Record<string, bigint | number | string | undefined>
  isUniV3: boolean
  tickLower: number | null
  tickUpper: number | null
}) => {
  const errors: string[] = []

  if (!tokens.length) errors.push(ADD_LIQUIDITY_ERROR.SELECT_TOKEN_IN)

  if (isUniV3) {
    if (tickLower === null) errors.push(ADD_LIQUIDITY_ERROR.ENTER_MIN_PRICE)
    if (tickUpper === null) errors.push(ADD_LIQUIDITY_ERROR.ENTER_MAX_PRICE)
    if (tickLower !== null && tickUpper !== null && tickLower >= tickUpper) {
      errors.push(ADD_LIQUIDITY_ERROR.INVALID_PRICE_RANGE)
    }
  }

  if (!hasPositiveAmount(amounts)) errors.push(ADD_LIQUIDITY_ERROR.ENTER_AMOUNT)

  const { tokens: parsedTokens, amounts: parsedAmounts } = parseTokensAndAmounts(tokens, amounts)

  try {
    for (let index = 0; index < parsedTokens.length; index++) {
      const token = parsedTokens[index]
      const amount = parsedAmounts[index] || ''
      const balanceKey =
        token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? NATIVE_TOKEN_ADDRESS.toLowerCase()
          : token.address.toLowerCase()
      const balance = formatUnits(balances[balanceKey]?.toString() || '0', token.decimals)

      if (countDecimals(amount) > token.decimals) {
        errors.push(ADD_LIQUIDITY_ERROR.INVALID_INPUT_AMOUNT)
        break
      }

      if (Number(amount) > Number(balance)) {
        errors.push(ADD_LIQUIDITY_ERROR.INSUFFICIENT_BALANCE)
        break
      }
    }
  } catch {
    errors.push(ADD_LIQUIDITY_ERROR.INVALID_INPUT_AMOUNT)
  }

  return errors
}

export const getPrimaryValidationError = (errors: string[]) =>
  errors.find(error =>
    [
      ADD_LIQUIDITY_ERROR.SELECT_TOKEN_IN,
      ADD_LIQUIDITY_ERROR.ENTER_MIN_PRICE,
      ADD_LIQUIDITY_ERROR.ENTER_MAX_PRICE,
      ADD_LIQUIDITY_ERROR.INVALID_PRICE_RANGE,
      ADD_LIQUIDITY_ERROR.ENTER_AMOUNT,
      ADD_LIQUIDITY_ERROR.INSUFFICIENT_BALANCE,
      ADD_LIQUIDITY_ERROR.INVALID_INPUT_AMOUNT,
    ].includes(error as (typeof ADD_LIQUIDITY_ERROR)[keyof typeof ADD_LIQUIDITY_ERROR]),
  ) || ''

export const formatAmountWithDecimals = (amount: string | number, decimals: number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (Number.isNaN(numAmount) || numAmount <= 0) return '0'

  const factor = Math.pow(10, decimals)
  const truncated = Math.floor(numAmount * factor) / factor
  return truncated.toFixed(decimals).replace(/\.?0+$/, '') || '0'
}

export const getSecurityWarnings = ({
  tokens,
  honeypotInfoMap,
}: {
  tokens: ZapPool['token0'][]
  honeypotInfoMap?: Record<string, { isHoneypot?: boolean; isFOT?: boolean; tax: number }>
}) =>
  tokens.flatMap(token => {
    const info = honeypotInfoMap?.[token.address.toLowerCase()]
    if (!info) return []

    const warnings: string[] = []

    if (info.isHoneypot) {
      warnings.push(
        `Our security checks detected that ${token.symbol} may be a honeypot token (cannot be sold or carries extremely high sell fee). Please research carefully before adding liquidity or trading.`,
      )
    }

    if (info.isFOT) {
      warnings.push(
        `${token.symbol} is a Fee-On-Transfer token with a ${Math.round(
          info.tax * 100,
        )}% transaction fee applied on every transfer. Please beware before triggering trades with this token.`,
      )
    }

    return warnings
  })

export const getSlippageStorageKey = (token0Symbol: string, token1Symbol: string, chainId: number, feeTier: number) => {
  const sortedSymbols = [token0Symbol, token1Symbol].sort()
  return `kyber_liquidity_widget_slippage_${sortedSymbols[0]}_${sortedSymbols[1]}_${chainId}_${feeTier}`
}
