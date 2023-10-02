import { CurrencyAmount, NativeCurrency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Box, Flex, Text } from 'rebass'
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

export default function ZapDetail({
  pool,
  zapResult: result,
  position,
  zapLoading,
  amountIn,
  tokenIn,
  tokenId,
  sx,
  poolAddress,
  tickLower,
  tickUpper,
  previousTicks,
}: {
  pool: Pool | null | undefined
  tokenIn: string | undefined
  zapResult: ZapResult | undefined
  position: Position | null | undefined
  zapLoading: boolean
  amountIn: CurrencyAmount<NativeCurrency | Token> | undefined
  sx?: CSSProperties
  poolAddress: string | undefined
  tokenId?: string
  tickLower?: number
  tickUpper?: number
  previousTicks?: number[]
}) {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const { readProvider } = useKyberSwapConfig()

  const skeleton = (width?: number) => (
    <Skeleton
      height="13px"
      width={`${width || 169}px`}
      baseColor={theme.border}
      highlightColor={theme.buttonGray}
      borderRadius="999px"
    />
  )

  const currency0 = pool?.token0 && unwrappedToken(pool.token0)
  const currency1 = pool?.token1 && unwrappedToken(pool.token1)
  const symbol0 = getTokenSymbolWithHardcode(
    pool?.token0.chainId,
    pool?.token0?.wrapped.address,
    currency0?.symbol || '',
  )
  const symbol1 = getTokenSymbolWithHardcode(
    pool?.token0.chainId,
    pool?.token1?.wrapped.address,
    currency1?.symbol || '',
  )

  const newPosDraft =
    pool && result && tickLower !== undefined && tickUpper !== undefined
      ? new Position({
          pool,
          tickLower,
          tickUpper,
          liquidity: result.liquidity.toString(),
        })
      : undefined

  const newPooledAmount0 = newPosDraft?.amount0
  const newPooledAmount1 = newPosDraft?.amount1

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

  const amountUSDAfterSwap =
    currency0 && currency1
      ? +(newPooledAmount0?.toExact() || 0) * (prices[currency0.wrapped.address] || 0) +
        +(newPooledAmount1?.toExact() || 0) * (prices[currency1.wrapped.address] || 0)
      : 0

  const priceImpact = ((amountInUsd - amountUSDAfterSwap) * 100) / amountInUsd
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
          usedAmount0: result.usedAmount0.toString(),
          usedAmount1: result.usedAmount1.toString(),
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
    amountIn?.currency.isNative,
    zapIn,
    tokenIn,
    poolAddress,
    tokenId,
    tickLower,
    tickUpper,
    previousTicks,
    readProvider,
    result,
    pool,
  ])

  const estimateGasUsd =
    gas && prices[WETH[chainId].address] ? ((+gasPrice * +gas) / 1e18) * prices[WETH[chainId].address] : 0

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
        <Text color={theme.subText}>Pooled {symbol0}</Text>

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
        <Text color={theme.subText}>Pooled {symbol1}</Text>

        {zapLoading ? (
          skeleton()
        ) : !result ? (
          '--'
        ) : (
          <Flex fontWeight="500" alignItems="center" sx={{ gap: '4px' }}>
            {position && (
              <>
                <CurrencyLogo currency={currency0} size="14px" />
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
        <Text color={theme.subText}>Liquidity Balance</Text>
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
        ) : (
          <Text
            fontWeight="500"
            color={priceImpactRes.isVeryHigh ? theme.red : priceImpactRes.isHigh ? theme.warning : theme.text}
          >
            {priceImpactRes.isInvalid ? '--' : priceImpact < 0.01 ? '<0.01%' : priceImpact.toFixed(2) + '%'}
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
