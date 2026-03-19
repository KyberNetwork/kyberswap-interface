import { Pool } from '@kyber/schema'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import type { ZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { formatDisplayNumber } from 'utils/numbers'

const Card = styled(Stack)`
  padding: 20px;
  border-radius: 20px;
  background: ${({ theme }) => theme.buttonGray};
`

const SectionLabel = styled(Text)`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
`

const LabelText = styled(Text)`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
`

const RangeBox = styled(HStack)`
  flex: 1 1 0;
  min-width: 0;
  align-items: stretch;
  gap: 0;
  overflow: hidden;
  border-radius: 16px;
  background: ${({ theme }) => theme.tabActive};
`

const RangeLabelBox = styled(Stack)`
  justify-content: center;
  min-width: 72px;
  padding: 8px 12px;
  background: ${({ theme }) => theme.background};
`

const RangeValue = styled(Text)`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 0;
  min-width: 0;
  padding: 8px 12px;
  font-weight: 500;
`

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: ${({ theme }) => theme.tabActive};
  color: ${({ theme }) => theme.subText};
  cursor: pointer;

  :hover {
    filter: brightness(1.12);
  }
`

type PriceInfoProps = {
  pool: Pool
  priceRange: ZapState['priceRange']
}

const PriceInfo = ({ pool, priceRange }: PriceInfoProps) => {
  const theme = useTheme()
  const baseToken = priceRange.revertPrice ? pool.token1 : pool.token0
  const quoteToken = priceRange.revertPrice ? pool.token0 : pool.token1
  const isUniV3 = priceRange.minPrice !== null || priceRange.maxPrice !== null

  return (
    <Card gap={16}>
      <HStack align="center" justify="space-between" gap={12}>
        <HStack align="center" gap={6} wrap="wrap">
          <SectionLabel>Current Price</SectionLabel>
          <Text color={theme.text}>
            1 {baseToken.symbol} = {formatDisplayNumber(priceRange.poolPrice, { significantDigits: 8 })}{' '}
            {quoteToken.symbol}
          </Text>
        </HStack>

        <IconButton type="button" onClick={priceRange.toggleRevertPrice}>
          <RevertPriceIcon width={14} height={14} />
        </IconButton>
      </HStack>

      {isUniV3 ? (
        <HStack gap={12}>
          <RangeBox>
            <RangeLabelBox>
              <LabelText>MIN</LabelText>
            </RangeLabelBox>
            <RangeValue color={theme.text}>{priceRange.minPrice || '--'}</RangeValue>
          </RangeBox>

          <RangeBox>
            <RangeLabelBox>
              <LabelText>MAX</LabelText>
            </RangeLabelBox>
            <RangeValue color={theme.text}>{priceRange.maxPrice || '--'}</RangeValue>
          </RangeBox>
        </HStack>
      ) : null}
    </Card>
  )
}

export default PriceInfo
