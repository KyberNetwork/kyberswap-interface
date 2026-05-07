import { Pool } from '@kyber/schema'
import { Text } from 'rebass'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { CurrentPriceHeader } from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection/PriceInfo'
import { getPriceRangeToShow } from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection/utils'
import type { ZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { formatDisplayNumber } from 'utils/numbers'

const Card = styled(Stack)`
  background: ${({ theme }) => theme.buttonGray};
  border-radius: 12px;
  padding: 12px 16px;
`

const RangeBox = styled(HStack)`
  flex: 1 1 0;
  min-width: 0;
  align-items: stretch;
  border-radius: 12px;
  background: ${({ theme }) => theme.tabActive};
`

const RangeLabelBox = styled(Stack)`
  justify-content: center;
  padding: 8px 12px;
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
  background: ${({ theme }) => theme.darkText};
`

const RangeValueBox = styled(HStack)`
  flex: 1 1 0;
  min-width: 0;
  justify-content: center;
  padding: 8px 12px;
`

const RangeValue = styled(Text)`
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

type PriceInfoProps = {
  pool: Pool
  priceRange: ZapState['priceRange']
}

const PriceInfo = ({ pool, priceRange }: PriceInfoProps) => {
  const theme = useTheme()
  const rangeToShow = getPriceRangeToShow({
    pool,
    revertPrice: priceRange.revertPrice,
    tickLower: priceRange.tickLower,
    tickUpper: priceRange.tickUpper,
    minPrice: priceRange.minPrice,
    maxPrice: priceRange.maxPrice,
  })

  return (
    <Card gap={12}>
      <CurrentPriceHeader
        pool={pool}
        poolPrice={priceRange.poolPrice}
        revertPrice={priceRange.revertPrice}
        formattedPrice={formatDisplayNumber(priceRange.poolPrice, { significantDigits: 8 })}
        onRevertPriceToggle={priceRange.toggleRevertPrice}
      />

      {rangeToShow && (
        <HStack gap={12}>
          <RangeBox>
            <RangeLabelBox>
              <Text fontSize={12} color={theme.subText}>
                MIN
              </Text>
            </RangeLabelBox>
            <RangeValueBox>
              <RangeValue fontWeight={500} title={rangeToShow.minPrice?.toString()}>
                {rangeToShow.minPrice}
              </RangeValue>
            </RangeValueBox>
          </RangeBox>

          <RangeBox>
            <RangeLabelBox>
              <Text fontSize={12} color={theme.subText}>
                MAX
              </Text>
            </RangeLabelBox>
            <RangeValueBox>
              <RangeValue fontWeight={500} title={rangeToShow.maxPrice?.toString()}>
                {rangeToShow.maxPrice}
              </RangeValue>
            </RangeValueBox>
          </RangeBox>
        </HStack>
      )}
    </Card>
  )
}

export default PriceInfo
