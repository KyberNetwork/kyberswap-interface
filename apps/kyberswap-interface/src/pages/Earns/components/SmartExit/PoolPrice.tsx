import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Box, Flex, Text } from 'rebass'

import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import InfoHelper from 'components/InfoHelper'
import useTheme from 'hooks/useTheme'
import { RevertIconWrapper } from 'pages/Earns/PositionDetail/styles'
import PriceRange from 'pages/Earns/UserPositions/PriceRange'
import { PositionValueWrapper } from 'pages/Earns/UserPositions/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { CustomBox, Divider } from 'pages/Earns/components/SmartExit/styles'
import { ParsedPosition } from 'pages/Earns/types'
import { ExternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

interface PoolPriceProps {
  position: ParsedPosition | null
  isLoading?: boolean
}

export default function PoolPrice({ position, isLoading = false }: PoolPriceProps) {
  const theme = useTheme()
  const [revertPrice, setRevertPrice] = useState(false)

  if (isLoading || !position) {
    return (
      <CustomBox>
        <Flex alignItems="center" flexWrap="wrap" sx={{ gap: '4px' }} mb="1rem">
          <Text color={theme.subText} fontSize={14}>
            <Trans>Current Price</Trans>
          </Text>
          <PositionSkeleton width={150} height={20} />
          <PositionSkeleton width={20} height={20} style={{ borderRadius: '50%' }} />
        </Flex>

        <Box mb="1.5rem" mt="0.5rem">
          <PositionValueWrapper align="center">
            <PositionSkeleton width="100%" height={60} />
          </PositionValueWrapper>
        </Box>

        <Divider />

        <Flex alignItems="center" mt="10px" justifyContent="space-between">
          <Text color={theme.subText} fontSize={14}>
            <Trans>Earning Fee Yield</Trans>
          </Text>
          <PositionSkeleton width={50} height={20} />
        </Flex>
      </CustomBox>
    )
  }

  return (
    <CustomBox>
      <Flex alignItems="center" flexWrap="wrap" sx={{ gap: '4px' }} mb="1rem">
        <Text color={theme.subText} fontSize={14}>
          <Trans>Current Price</Trans>
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

      <Box mb="1.5rem" mt="0.5rem">
        <PositionValueWrapper align="center">
          <PriceRange
            minPrice={position.priceRange.min}
            maxPrice={position.priceRange.max}
            currentPrice={position.priceRange.current}
            tickSpacing={position.pool.tickSpacing}
            token0Decimals={position.token0.decimals}
            token1Decimals={position.token1.decimals}
            dex={position.dex.id}
            invertPrice={revertPrice}
          />
        </PositionValueWrapper>
      </Box>

      <Divider />

      <Flex alignItems="center" mt="10px" justifyContent="space-between">
        <Text color={theme.subText} fontSize={14}>
          <Trans>Earning Fee Yield</Trans>{' '}
          <InfoHelper
            text={
              <Text>
                <Trans>
                  Based on the amount of fee tokens your position has earned compared with your initial deposit.
                </Trans>
                <ExternalLink href="https://docs.kyberswap.com/kyberswap-solutions/smart-exit/feature-capabilities#id-1.-fee-yield-condition">
                  <Text as="span" ml="4px">
                    <Trans>Details</Trans>
                  </Text>
                </ExternalLink>
              </Text>
            }
          />{' '}
        </Text>
        <Text>{formatDisplayNumber(position.earningFeeYield, { significantDigits: 4 })}%</Text>
      </Flex>
    </CustomBox>
  )
}
