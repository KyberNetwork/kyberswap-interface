import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import LiquidityChartRangeInput from 'components/LiquidityChartRangeInput'
import Zoom from 'components/LiquidityChartRangeInput/Zoom'
import { RotateSwapIcon } from 'components/ProAmm/styles'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import useTheme from 'hooks/useTheme'
import { Bound } from 'state/mint/proamm/type'
import { formatTickPrice } from 'utils/formatTickPrice'
import { unwrappedToken } from 'utils/wrappedCurrency'

const Chart = styled(LiquidityChartRangeInput)`
  ${Zoom} {
    top: -21px;
    right: 0;

    grid-template-columns: repeat(2, auto);
    width: fit-content;
    justify-content: space-between;
  }
`

// TODO: merge with EarningView props
type Props = {
  position: Position
}
const PriceRangeChart: React.FC<Props> = ({ position }) => {
  const theme = useTheme()

  const token0 = unwrappedToken(position.pool.token0)
  const token1 = unwrappedToken(position.pool.token1)

  const [baseCurrency, setBaseCurrency] = useState(token0)
  const quoteCurrency = baseCurrency === token0 ? token1 : token0

  const isRateReversed = quoteCurrency === token0

  const tickAtLimit = useIsTickAtLimit(position.pool.fee, position.tickLower, position.tickUpper)

  const priceLower = !isRateReversed ? position.token0PriceLower : position.token0PriceUpper.invert()
  const priceUpper = !isRateReversed ? position.token0PriceUpper : position.token0PriceLower.invert()

  const price = isRateReversed
    ? position.pool.priceOf(position.pool.token1)
    : position.pool.priceOf(position.pool.token0)

  const handleReverseRate = useCallback(() => {
    setBaseCurrency(quoteCurrency)
  }, [quoteCurrency])

  return (
    <Flex
      sx={{
        width: '100%',
        flexBasis: 'fit-content',
        flexDirection: 'column',
      }}
    >
      <Flex
        alignItems="center"
        padding="0 64px 0 0"
        flex="0 0 fit-content"
        sx={{ gap: '2px 8px', flexWrap: 'nowrap', overflow: 'hidden' }}
      >
        <Text
          fontSize={12}
          fontWeight={500}
          color={theme.subText}
          as="span"
          sx={{
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          <Trans>Current Price</Trans>:
        </Text>

        <Flex
          alignItems={'center'}
          sx={{
            flex: '0 0 fit-content',
            gap: '2px',
            flexWrap: 'nowrap',
          }}
        >
          <Text fontSize="12px" fontWeight="500" sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
            1 {baseCurrency.symbol} ≈ {price.toSignificant(6)} {quoteCurrency.symbol}
          </Text>
          <Box sx={{ flex: '0 0 14px', cursor: 'pointer' }} onClick={handleReverseRate}>
            <RotateSwapIcon rotated={baseCurrency !== token0} size={14} />
          </Box>
        </Flex>
      </Flex>

      <Chart
        style={{
          minHeight: '180px',
          height: '180px',
        }}
        currencyA={baseCurrency}
        currencyB={quoteCurrency}
        feeAmount={position.pool.fee}
        ticksAtLimit={tickAtLimit}
        price={price ? parseFloat(price.toSignificant(8)) : undefined}
        leftPrice={priceLower}
        rightPrice={priceUpper}
        onLeftRangeInput={() => {
          //
        }}
        onRightRangeInput={() => {
          //
        }}
        interactive={false}
      />

      <Box
        sx={{
          flex: '0 0 fit-content',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, auto)',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '4x',
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '20px',
          color: theme.text,
        }}
      >
        <span>
          <Text as="span" color={theme.subText}>
            <Trans>Min Price</Trans>:{' '}
          </Text>
          <span>{formatTickPrice(priceLower, tickAtLimit, Bound.LOWER)}</span>
        </span>

        <span>
          <Text as="span" color={theme.subText}>
            <Trans>Max Price</Trans>:{' '}
          </Text>
          <span>{formatTickPrice(priceUpper, tickAtLimit, Bound.UPPER)}</span>
        </span>

        <Text as="span" justifySelf="flex-start">
          {quoteCurrency.symbol}/{baseCurrency.symbol}
        </Text>
        <Text as="span" justifySelf="flex-end">
          {quoteCurrency.symbol}/{baseCurrency.symbol}
        </Text>
      </Box>
    </Flex>
  )
}

export default PriceRangeChart
