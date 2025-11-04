import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Flex, Text } from 'rebass'

import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import useTheme from 'hooks/useTheme'
import { RevertIconWrapper } from 'pages/Earns/PositionDetail/styles'
import PriceRange from 'pages/Earns/UserPositions/PriceRange'
import { PositionValueWrapper } from 'pages/Earns/UserPositions/styles'
import { CustomBox } from 'pages/Earns/components/SmartExit/styles'
import { ParsedPosition } from 'pages/Earns/types'
import { ExternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export default function PoolPrice({ position }: { position: ParsedPosition }) {
  const theme = useTheme()
  const [revertPrice, setRevertPrice] = useState(false)

  return (
    <CustomBox>
      <Flex alignItems="center" sx={{ gap: '4px' }} mb="1rem">
        <Text color={theme.subText} fontSize={14}>
          Current Price
        </Text>
        <Text>
          1 {revertPrice ? position.token1.symbol : position.token0.symbol} ={' '}
          {formatDisplayNumber(revertPrice ? 1 / position.priceRange.current : position.priceRange.current, {
            significantDigits: 6,
          })}{' '}
          {revertPrice ? position.token0.symbol : position.token1.symbol}
        </Text>
        <RevertIconWrapper onClick={() => setRevertPrice(!revertPrice)}>
          <RevertPriceIcon width={12} height={12} />
        </RevertIconWrapper>
      </Flex>

      <PositionValueWrapper align="center">
        <PriceRange
          minPrice={position.priceRange.min}
          maxPrice={position.priceRange.max}
          currentPrice={position.priceRange.current}
          tickSpacing={position.pool.tickSpacing}
          token0Decimals={position.token0.decimals}
          token1Decimals={position.token1.decimals}
          dex={position.dex.id}
        />
      </PositionValueWrapper>

      <Divider mt="1rem" />

      <Flex alignItems="center" mt="10px" justifyContent="space-between">
        <Text color={theme.subText} fontSize={14}>
          <Trans>Earning Fee Yield</Trans>{' '}
          <InfoHelper
            text={
              <Text>
                <Trans>
                  Based on the amount of fee tokens your position has earned compared with your initial deposit.
                </Trans>
                <ExternalLink href="/TODO">
                  <Text as="span" ml="4px">
                    <Trans>Details</Trans>
                  </Text>
                </ExternalLink>
              </Text>
            }
          />{' '}
        </Text>
        <Text>{position.earningFeeYield.toFixed(2)}%</Text>
      </Flex>
    </CustomBox>
  )
}
