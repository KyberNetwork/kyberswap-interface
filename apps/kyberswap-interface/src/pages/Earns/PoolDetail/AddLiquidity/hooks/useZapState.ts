import { NATIVE_TOKEN_ADDRESS, PoolType, Token, Pool as ZapPool } from '@kyber/schema'
import { getPoolPrice } from '@kyber/utils'
import { ChainId as AppChainId, Token as SDKToken } from '@kyberswap/ks-sdk-core'
import { skipToken } from '@reduxjs/toolkit/query'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { useEffect, useMemo, useState } from 'react'
import { GetZapInRouteApiArgs, prepareGetZapInRouteRequest, useGetZapInRouteQuery } from 'services/zap'

import { useInitialTokensIn } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useInitialTokensIn'
import { useSlippageManager } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useSlippageManager'
import { useTickPrice } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useTickPrice'
import {
  ADD_LIQUIDITY_ERROR,
  getNetworkInfo,
  getParsedTokensIn,
  getPrimaryValidationError,
  hasPositiveAmount,
  isUniV3PoolType,
  validateAddLiquidityInput,
} from 'pages/Earns/PoolDetail/AddLiquidity/utils'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useNativeBalance, useTokenBalances } from 'state/wallet/hooks'

const getTokenBalanceKey = (address: string) =>
  address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
    ? NATIVE_TOKEN_ADDRESS.toLowerCase()
    : address.toLowerCase()

const createTrackedBalanceConfig = (tokens: Token[], chainId: number) => {
  const trackedTokens = tokens.filter(token => getTokenBalanceKey(token.address) !== NATIVE_TOKEN_ADDRESS.toLowerCase())
  const sdkTokens = trackedTokens.map(
    token => new SDKToken(chainId as AppChainId, token.address, token.decimals, token.symbol, token.name),
  )

  return {
    sdkTokens,
    addressMap: trackedTokens.reduce<Record<string, string>>((acc, token, index) => {
      acc[getTokenBalanceKey(token.address)] = sdkTokens[index]?.address || token.address
      return acc
    }, {}),
  }
}

const getDefaultNativeToken = (chainId: number): Token => {
  const network = getNetworkInfo(chainId)
  const wrappedToken = network.wrappedToken

  return {
    ...wrappedToken,
    address: NATIVE_TOKEN_ADDRESS.toLowerCase(),
    logo: network.nativeLogo,
    symbol: wrappedToken.symbol.slice(1) || wrappedToken.symbol,
    name: network.name,
  }
}

const getDefaultRevertPrice = (pool: ZapPool | null, chainId: number) => {
  if (!pool) return false

  const wrappedNativeTokenAddress = getNetworkInfo(chainId)?.wrappedToken?.address?.toLowerCase()
  const isToken0Native = pool.token0.address.toLowerCase() === wrappedNativeTokenAddress
  const isToken0Stable = pool.token0.isStable
  const isToken1Stable = pool.token1.isStable

  return Boolean(isToken0Stable || (isToken0Native && !isToken1Stable))
}

const getErrorMessage = (error?: FetchBaseQueryError | { error?: string }) => {
  if (!error) return ''
  if ('error' in error && typeof error.error === 'string') return error.error
  if ('data' in error && typeof error.data === 'string') return error.data
  return 'Failed to get zap route'
}

type UseZapStateProps = {
  chainId: number
  pool: ZapPool | null
  poolAddress: string
  poolType: PoolType
  account?: string
  source?: string
}

export const useZapState = ({ chainId, pool, poolAddress, poolType, account, source }: UseZapStateProps) => {
  const nativeToken = useMemo(() => getDefaultNativeToken(chainId), [chainId])
  const defaultRevertPrice = useMemo(() => getDefaultRevertPrice(pool, chainId), [chainId, pool])
  const [revertPrice, setRevertPrice] = useState(defaultRevertPrice)

  useEffect(() => {
    setRevertPrice(defaultRevertPrice)
  }, [defaultRevertPrice, pool?.address])

  const tokenInputState = useInitialTokensIn({
    pool,
    chainId,
    account,
    nativeToken,
  })

  const nativeBalance = useNativeBalance(chainId as AppChainId)
  const isUniV3 = useMemo(() => isUniV3PoolType(poolType), [poolType])
  const selectedBalanceConfig = useMemo(
    () => createTrackedBalanceConfig(tokenInputState.tokensIn, chainId),
    [chainId, tokenInputState.tokensIn],
  )
  const selectedTokenBalances = useTokenBalances(selectedBalanceConfig.sdkTokens, chainId as AppChainId)
  const tokenPriceAddresses = useMemo(
    () => tokenInputState.tokensIn.map(token => token.address.toLowerCase()),
    [tokenInputState.tokensIn],
  )

  const tokenPrices = useTokenPrices(tokenPriceAddresses, chainId as AppChainId)
  const tokenBalances = useMemo(
    () =>
      tokenInputState.tokensIn.reduce<Record<string, bigint>>((acc, token) => {
        const balanceKey = getTokenBalanceKey(token.address)
        if (balanceKey === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
          acc[balanceKey] = BigInt(nativeBalance?.quotient?.toString() || '0')
          return acc
        }

        const balanceAddress = selectedBalanceConfig.addressMap[balanceKey] || token.address
        acc[balanceKey] = BigInt(selectedTokenBalances[balanceAddress]?.quotient?.toString() || '0')
        return acc
      }, {}),
    [nativeBalance?.quotient, selectedBalanceConfig.addressMap, selectedTokenBalances, tokenInputState.tokensIn],
  )

  const tickPriceState = useTickPrice({
    token0: pool?.token0,
    token1: pool?.token1,
    revertPrice,
    position: null,
  })
  const { setTickLower, setTickUpper } = tickPriceState

  const poolPrice = useMemo(() => {
    if (!pool) return null

    return getPoolPrice({ pool, revertPrice })
  }, [pool, revertPrice])

  const slippageState = useSlippageManager({
    chainId,
    pool,
    tokensIn: tokenInputState.tokensIn,
  })

  useEffect(() => {
    setTickLower(null)
    setTickUpper(null)
  }, [pool?.address, setTickLower, setTickUpper])

  const validationErrors = useMemo(
    () =>
      validateAddLiquidityInput({
        tokens: tokenInputState.tokensIn,
        amounts: tokenInputState.debouncedAmountsIn,
        balances: tokenBalances,
        isUniV3,
        tickLower: tickPriceState.tickLower,
        tickUpper: tickPriceState.tickUpper,
      }),
    [
      isUniV3,
      tickPriceState.tickLower,
      tickPriceState.tickUpper,
      tokenBalances,
      tokenInputState.debouncedAmountsIn,
      tokenInputState.tokensIn,
    ],
  )

  const hasPositiveInput = useMemo(
    () => hasPositiveAmount(tokenInputState.debouncedAmountsIn),
    [tokenInputState.debouncedAmountsIn],
  )

  const routeDisabled = useMemo(
    () =>
      !slippageState.slippage ||
      !pool ||
      validationErrors.some(error =>
        [
          ADD_LIQUIDITY_ERROR.SELECT_TOKEN_IN,
          ADD_LIQUIDITY_ERROR.ENTER_MIN_PRICE,
          ADD_LIQUIDITY_ERROR.ENTER_MAX_PRICE,
          ADD_LIQUIDITY_ERROR.INVALID_PRICE_RANGE,
          ADD_LIQUIDITY_ERROR.ENTER_AMOUNT,
          ADD_LIQUIDITY_ERROR.INVALID_INPUT_AMOUNT,
        ].includes(error as (typeof ADD_LIQUIDITY_ERROR)[keyof typeof ADD_LIQUIDITY_ERROR]),
      ),
    [pool, slippageState.slippage, validationErrors],
  )

  const routeQueryArgs = useMemo<{ request: GetZapInRouteApiArgs | typeof skipToken; error: string }>(() => {
    if (!pool || routeDisabled || !slippageState.slippage || !tokenInputState.tokensIn.length || !hasPositiveInput) {
      return {
        request: skipToken,
        error: '',
      }
    }

    if ('minTick' in pool && 'maxTick' in pool) {
      if (
        tickPriceState.debouncedTickLower == null ||
        tickPriceState.debouncedTickUpper == null ||
        tickPriceState.debouncedTickLower >= tickPriceState.debouncedTickUpper
      ) {
        return {
          request: skipToken,
          error: '',
        }
      }
    }

    const request = prepareGetZapInRouteRequest({
      chainId,
      poolAddress,
      poolType,
      pool,
      tokensIn: tokenInputState.tokensIn,
      amountsIn: tokenInputState.debouncedAmountsIn,
      slippage: slippageState.slippage,
      tickLower: tickPriceState.debouncedTickLower,
      tickUpper: tickPriceState.debouncedTickUpper,
      account,
      source,
    })

    return {
      request: request.data || skipToken,
      error: request.error || '',
    }
  }, [
    account,
    chainId,
    hasPositiveInput,
    pool,
    poolAddress,
    poolType,
    routeDisabled,
    slippageState.slippage,
    source,
    tickPriceState.debouncedTickLower,
    tickPriceState.debouncedTickUpper,
    tokenInputState.debouncedAmountsIn,
    tokenInputState.tokensIn,
  ])

  const routeResult = useGetZapInRouteQuery(routeQueryArgs.request, {
    pollingInterval: 10_000,
    refetchOnMountOrArgChange: true,
  })
  const routeData = routeDisabled ? null : routeResult.data?.data || null
  const routeError =
    routeQueryArgs.error ||
    routeResult.data?.message ||
    getErrorMessage(routeResult.error as FetchBaseQueryError | { error?: string })

  const route = {
    data: routeData,
    error: routeDisabled || routeData ? '' : routeError,
    loading: routeDisabled ? false : routeResult.isLoading || routeResult.isFetching,
    refetch: routeDisabled ? undefined : routeResult.refetch,
  }

  return {
    tokenInput: {
      tokens: tokenInputState.tokensIn,
      amounts: tokenInputState.amountsIn,
      balances: tokenBalances,
      prices: tokenPrices,
      setTokens: tokenInputState.setTokensIn,
      setAmounts: tokenInputState.setAmountsIn,
    },
    priceRange: {
      isUniV3,
      poolPrice,
      revertPrice,
      tickLower: tickPriceState.tickLower,
      tickUpper: tickPriceState.tickUpper,
      minPrice: tickPriceState.minPrice,
      maxPrice: tickPriceState.maxPrice,
      toggleRevertPrice: () => setRevertPrice(prev => !prev),
      setTickLower,
      setTickUpper,
    },
    slippage: {
      value: slippageState.slippage,
      suggestedValue: routeDisabled ? undefined : route.data?.zapDetails.suggestedSlippage,
      setValue: slippageState.setSlippage,
    },
    route,
    validation: {
      errors: validationErrors,
      error: getPrimaryValidationError(validationErrors),
      hasPositiveInput,
      parsedTokensIn: getParsedTokensIn(tokenInputState.tokensIn, tokenInputState.amountsIn),
      routeDisabled,
    },
  }
}

export type ZapState = ReturnType<typeof useZapState>
