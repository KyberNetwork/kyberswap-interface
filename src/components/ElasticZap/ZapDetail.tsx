import { Currency, CurrencyAmount, NativeCurrency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { ReactElement, useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Box, Flex, Text } from 'rebass'
import { RouteSummary } from 'services/route/types/getRoute'
import styled, { CSSProperties } from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import { GasStation } from 'components/Icons'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ZapResult, useZapInAction } from 'hooks/elasticZap'
import useTheme from 'hooks/useTheme'
import { useKyberSwapConfig } from 'state/application/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { formatDollarAmount } from 'utils/numbers'
import { checkPriceImpact } from 'utils/prices'
import { getTokenSymbolWithHardcode } from 'utils/tokenInfo'
import { unwrappedToken } from 'utils/wrappedCurrency'

const Detail = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 1rem;
  padding: 12px;
`

export interface ZapDetail {
  estimateGasUsd: number
  priceImpact: {
    value: number
    isHigh: boolean
    isInvalid: boolean
    isVeryHigh: boolean
  }
  position: Position | null | undefined
  pool: Pool | null | undefined
  oldUsdValue: number
  newUsdValue: number
  amountInUsd: number
  newPooledAmount0: CurrencyAmount<Currency> | undefined
  newPooledAmount1: CurrencyAmount<Currency> | undefined
  zapResult: ZapResult | undefined
  skeleton: (w?: number) => ReactElement
  newPosDraft: Position | undefined
  token0IsNative: boolean
  token1IsNative: boolean
}

export const useZapDetail = ({
  pool,
  zapResult: result,
  position,
  amountIn,
  tokenIn,
  tokenId,
  poolAddress,
  tickLower,
  tickUpper,
  previousTicks,
  aggregatorRoute,
}: {
  pool: Pool | null | undefined
  tokenIn: string | undefined
  zapResult: ZapResult | undefined
  position: Position | null | undefined
  amountIn: CurrencyAmount<NativeCurrency | Token> | undefined
  aggregatorRoute: RouteSummary | null
  poolAddress: string | undefined
  tokenId?: string
  tickLower?: number
  tickUpper?: number
  previousTicks?: number[]
}): ZapDetail => {
  const { chainId } = useActiveWeb3React()
  const { readProvider } = useKyberSwapConfig()

  const equivalentQuoteAmount =
    (amountIn &&
      pool &&
      amountIn
        .multiply(
          pool.priceOf(pool.token0.address.toLowerCase() === tokenIn?.toLowerCase() ? pool.token0 : pool.token1),
        )
        ?.quotient.toString()) ||
    '0'

  const currency0 = pool?.token0 && unwrappedToken(pool.token0)
  const currency1 = pool?.token1 && unwrappedToken(pool.token1)

  const newPool =
    pool && result
      ? new Pool(
          pool.token0,
          pool.token1,
          pool.fee,
          result.sqrtP.toString(),
          result.baseL.toString(),
          result.reinvestL.toString(),
          result.currentTick,
        )
      : undefined
  const newPosDraft =
    pool && result && newPool && tickLower !== undefined && tickUpper !== undefined && tickLower < tickUpper
      ? new Position({
          pool: newPool,
          tickLower,
          tickUpper,
          liquidity: result.liquidity.toString(),
        })
      : undefined

  let newPooledAmount0 = newPosDraft?.amount0
  let newPooledAmount1 = newPosDraft?.amount1

  if (position && newPooledAmount0 && newPooledAmount1) {
    newPooledAmount0 = newPooledAmount0.add(position.amount0)
    newPooledAmount1 = newPooledAmount1.add(position.amount1)
  }

  const remainAmount0 =
    pool?.token0 &&
    result?.remainingAmount0 &&
    CurrencyAmount.fromRawAmount(pool.token0, result.remainingAmount0.toString())
  const remainAmount1 =
    pool?.token1 &&
    result?.remainingAmount1 &&
    CurrencyAmount.fromRawAmount(pool.token1, result.remainingAmount1.toString())

  const prices = useTokenPrices(
    [WETH[chainId].address, currency0?.wrapped.address, currency1?.wrapped.address].filter(Boolean) as string[],
  )

  const oldUsdValue =
    +(position?.amount0.toExact() || '0') * (prices[currency0?.wrapped.address || ''] || 0) +
    +(position?.amount1.toExact() || '0') * (prices[currency1?.wrapped.address || ''] || 0)

  const newUsdValue =
    +(newPooledAmount0?.toExact() || '0') * (prices[currency0?.wrapped?.address || ''] || 0) +
    +(newPooledAmount1?.toExact() || '0') * (prices[currency1?.wrapped?.address || ''] || 0)

  const amountInUsd = +(amountIn?.toExact() || '0') * (prices[amountIn?.currency?.wrapped.address || ''] || 0)

  const remainAmountUsd =
    currency0 && currency1
      ? +(remainAmount0?.toExact() || 0) * (prices[currency0.wrapped.address] || 0) +
        +(remainAmount1?.toExact() || 0) * (prices[currency1.wrapped.address] || 0)
      : 0

  const amountUsdAfterSwap =
    (currency0 && currency1
      ? +(newPosDraft?.amount0?.toExact() || 0) * (prices[currency0.wrapped.address] || 0) +
        +(newPosDraft?.amount1?.toExact() || 0) * (prices[currency1.wrapped.address] || 0)
      : 0) + remainAmountUsd

  const priceImpact =
    !prices[currency0?.wrapped?.address || ''] || !prices[currency1?.wrapped?.address || '']
      ? NaN
      : ((amountInUsd - amountUsdAfterSwap) * 100) / amountInUsd
  const priceImpactRes = checkPriceImpact(priceImpact)

  const [gas, setGas] = useState('') // GWei
  const { zapIn } = useZapInAction()

  const amount = amountIn?.quotient.toString()

  const [gasPrice, setGasPrice] = useState('0') // wei
  useEffect(() => {
    readProvider?.getGasPrice().then(res => setGasPrice(res.toString()))
  }, [readProvider])

  useEffect(() => {
    if (
      pool &&
      poolAddress &&
      tokenIn &&
      amount &&
      result &&
      tickLower !== undefined &&
      tickUpper !== undefined &&
      previousTicks?.length
    ) {
      zapIn(
        {
          tokenId: tokenId?.toString() || 0,
          tokenIn,
          amountIn: amount,
          equivalentQuoteAmount,
          poolAddress,
          tickLower,
          tickUpper,
          tickPrevious: [previousTicks[0], previousTicks[1]],
          poolInfo: {
            token0: pool.token0.wrapped.address,
            fee: pool.fee,
            token1: pool.token1.wrapped.address,
          },
          liquidity: result.liquidity.toString(),
          aggregatorRoute,
        },
        {
          zapWithNative: !!amountIn?.currency.isNative,
          estimateOnly: true,
        },
      )
        .then(({ gasEstimated }) => {
          setGas(gasEstimated.toString())
        })
        .catch(() => {
          setGas('')
        })
    } else {
      setGas('')
    }
  }, [
    amount,
    aggregatorRoute,
    amountIn?.currency.isNative,
    zapIn,
    tokenIn,
    poolAddress,
    tokenId,
    tickLower,
    tickUpper,
    previousTicks,
    equivalentQuoteAmount,
    readProvider,
    result,
    pool,
  ])

  const estimateGasUsd =
    gas && prices[WETH[chainId].address] ? ((+gasPrice * +gas) / 1e18) * prices[WETH[chainId].address] : 0

  const theme = useTheme()
  const skeleton = (width?: number) => (
    <Skeleton
      height="13px"
      width={`${width || 169}px`}
      baseColor={theme.border}
      highlightColor={theme.buttonGray}
      borderRadius="999px"
    />
  )

  return {
    estimateGasUsd,
    priceImpact: {
      value: priceImpact,
      ...priceImpactRes,
    },
    zapResult: result,
    position,
    pool,
    oldUsdValue,
    newUsdValue,
    amountInUsd,
    newPooledAmount0,
    newPooledAmount1,
    newPosDraft,
    token0IsNative: !!(amountIn?.currency.isNative && amountIn?.currency.wrapped.address === pool?.token0.address),
    token1IsNative: !!(amountIn?.currency.isNative && amountIn?.currency.wrapped.address === pool?.token1.address),
    skeleton,
  }
}

export default function ZapDetail({
  zapLoading,
  sx,
  zapDetail,
}: {
  sx?: CSSProperties
  zapLoading: boolean
  zapDetail: ZapDetail
}) {
  const {
    pool,
    position,
    estimateGasUsd,
    zapResult: result,
    newPooledAmount0,
    newPooledAmount1,
    oldUsdValue,
    newUsdValue,
    priceImpact,
    skeleton,
    token0IsNative,
    token1IsNative,
  } = zapDetail

  const theme = useTheme()
  const currency0 = pool?.token0 && unwrappedToken(pool.token0)
  const currency1 = pool?.token1 && unwrappedToken(pool.token1)

  const symbol0 = token0IsNative
    ? currency0?.symbol
    : getTokenSymbolWithHardcode(pool?.token0.chainId, pool?.token0?.wrapped.address, currency0?.wrapped.symbol || '')
  const symbol1 = token1IsNative
    ? currency1?.symbol
    : getTokenSymbolWithHardcode(pool?.token0.chainId, pool?.token1?.wrapped.address, currency1?.wrapped.symbol || '')

  return (
    <Detail sx={sx}>
      <Flex justifyContent="space-between">
        <Flex>
          <Text fontWeight="500">
            {symbol0} - {symbol1}
          </Text>
          <FeeTag>FEE {((pool?.fee || 0) * 100) / ELASTIC_BASE_FEE_UNIT}%</FeeTag>
        </Flex>

        {zapLoading ? (
          skeleton(40)
        ) : (
          <Flex alignItems="center" sx={{ gap: '2px' }}>
            <GasStation />
            <Text fontSize={12} fontWeight="500">
              {estimateGasUsd ? '$' + estimateGasUsd.toFixed(2) : '--'}
            </Text>
          </Flex>
        )}
      </Flex>

      <Divider />

      <Flex justifyContent="space-between" fontSize={12}>
        <Text color={theme.subText}>Est. Pooled {symbol0}</Text>

        {zapLoading ? (
          skeleton()
        ) : !result ? (
          '--'
        ) : (
          <Flex fontWeight="500" alignItems="center" sx={{ gap: '4px' }}>
            {position && (
              <>
                <CurrencyLogo currency={currency0} size="14px" />
                <Text color={theme.subText}>{position.amount0.toSignificant(6)} →</Text>
              </>
            )}
            <Text>
              {newPooledAmount0?.toSignificant(6) || '--'} {symbol0}
            </Text>
          </Flex>
        )}
      </Flex>

      <Flex justifyContent="space-between" fontSize={12}>
        <Text color={theme.subText}>Est. Pooled {symbol1}</Text>

        {zapLoading ? (
          skeleton()
        ) : !result ? (
          '--'
        ) : (
          <Flex fontWeight="500" alignItems="center" sx={{ gap: '4px' }}>
            {position && (
              <>
                <CurrencyLogo currency={currency1} size="14px" />
                <Text color={theme.subText}>{position.amount1.toSignificant(6)} →</Text>
              </>
            )}
            <Text>
              {newPooledAmount1?.toSignificant(6) || '--'} {symbol1}
            </Text>
          </Flex>
        )}
      </Flex>

      <Flex justifyContent="space-between" fontSize={12}>
        <Text color={theme.subText}>Est. Liquidity Value</Text>
        {zapLoading ? (
          skeleton(120)
        ) : !result ? (
          '--'
        ) : (
          <Flex sx={{ gap: '4px' }}>
            {position && <Text color={theme.subText}>{formatDollarAmount(oldUsdValue)} →</Text>}
            <Text>{formatDollarAmount(newUsdValue)}</Text>
          </Flex>
        )}
      </Flex>

      <Flex justifyContent="space-between" fontSize={12}>
        <Text color={theme.subText}>Price Impact</Text>
        {zapLoading ? (
          skeleton(40)
        ) : !result ? (
          '--'
        ) : (
          <Text
            fontWeight="500"
            color={priceImpact.isVeryHigh ? theme.red : priceImpact.isHigh ? theme.warning : theme.text}
          >
            {priceImpact.isInvalid ? '--' : priceImpact.value < 0.01 ? '<0.01%' : priceImpact.value.toFixed(2) + '%'}
          </Text>
        )}
      </Flex>

      <Flex justifyContent="space-between" fontSize={12}>
        <Text color={theme.subText}>Zap Fee</Text>
        <Text fontWeight="500" color={theme.primary}>
          Free
        </Text>
      </Flex>
    </Detail>
  )
}
