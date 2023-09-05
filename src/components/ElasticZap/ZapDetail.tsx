import { CurrencyAmount, NativeCurrency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { BigNumber } from 'ethers'
import Skeleton from 'react-loading-skeleton'
import { Box, Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ZapResult } from 'hooks/elasticZap'
import useTheme from 'hooks/useTheme'
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
  sx,
}: {
  pool: Pool | null | undefined
  zapResult: ZapResult | undefined
  position: Position | null | undefined
  zapLoading: boolean
  amountIn: CurrencyAmount<NativeCurrency | Token> | undefined
  sx?: CSSProperties
}) {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()

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

  const usedAmount0 = pool?.token0 && CurrencyAmount.fromRawAmount(pool.token0, result?.usedAmount0.toString() || '0')
  const usedAmount1 = pool?.token1 && CurrencyAmount.fromRawAmount(pool.token1, result?.usedAmount1.toString() || '0')

  let newPooledAmount0 = usedAmount0
  if (position && newPooledAmount0) newPooledAmount0 = newPooledAmount0.add(position.amount0)

  let newPooledAmount1 = usedAmount1
  if (position && newPooledAmount1) newPooledAmount1 = newPooledAmount1.add(position.amount1)

  const prices = useTokenPrices(
    [WETH[chainId].address, currency0?.wrapped.address, currency1?.wrapped.address].filter(Boolean) as string[],
  )

  const oldUsdValue =
    +(position?.amount0.toExact() || '0') * (prices[currency0?.wrapped.address || ''] || 0) +
    +(position?.amount1.toExact() || '0') * (prices[currency1?.wrapped.address || ''] || 0)

  const newUsdValue =
    +(newPooledAmount0?.toExact() || '0') * (prices[currency0?.wrapped?.address || ''] || 0) +
    +(newPooledAmount1?.toExact() || '0') * (prices[currency1?.wrapped?.address || ''] || 0)

  const totalAmount0 = BigNumber.from(result?.usedAmount0 || '0').add(BigNumber.from(result?.remainingAmount0 || '0'))
  const totalAmount1 = BigNumber.from(result?.usedAmount1 || '0').add(BigNumber.from(result?.remainingAmount1 || '0'))

  const amountInUsd = +(amountIn?.toExact() || '0') * (prices[amountIn?.currency?.wrapped.address || ''] || 0)
  const amountUSDAfterSwap =
    currency0 && currency1
      ? +CurrencyAmount.fromRawAmount(currency0, totalAmount0.toString()).toExact() *
          (prices[currency0.wrapped.address] || 0) +
        +CurrencyAmount.fromRawAmount(currency1, totalAmount1.toString()).toExact() *
          (prices[currency1.wrapped.address] || 0)
      : 0

  const priceImpact = ((amountInUsd - amountUSDAfterSwap) * 100) / amountInUsd
  const priceImpactRes = checkPriceImpact(priceImpact)

  return (
    <Detail sx={sx}>
      <Flex justifyContent="space-between">
        <Flex>
          <Text fontWeight="500">
            {symbol0} - {symbol1}
          </Text>
          <FeeTag>FEE {((pool?.fee || 0) * 100) / ELASTIC_BASE_FEE_UNIT}%</FeeTag>
        </Flex>
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
