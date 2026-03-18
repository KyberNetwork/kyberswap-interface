import { ZapRouteDetail } from '@kyber/schema'
import { MouseoverTooltip } from '@kyber/ui'
import { formatAprNumber } from '@kyber/utils/number'
import { Trans } from '@lingui/macro'
import { skipToken } from '@reduxjs/toolkit/query'
import { rgba } from 'polished'
import { Box, Text } from 'rebass'
import { useEstimatePositionAprQuery } from 'services/zapInService'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'

const TooltipContent = styled(Stack)`
  gap: 4px;
  font-size: 12px;

  a {
    border-bottom: 1px dotted ${({ theme }) => theme.subText};
    text-decoration: none;
  }

  a:hover {
    color: ${({ theme }) => theme.primary};
  }
`

const AprBanner = styled(HStack)`
  align-items: center;
  gap: 12px;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => rgba(theme.primary, 0.24)};
  background: ${({ theme }) => rgba(theme.primary, 0.12)};
`

interface EstimatedPositionAprProps {
  chainId?: number
  poolAddress?: string
  isFarming?: boolean
  tickLower: number | null
  tickUpper: number | null
  route?: ZapRouteDetail | null
}

export default function EstimatedPositionApr({
  chainId,
  poolAddress,
  isFarming,
  tickLower,
  tickUpper,
  route,
}: EstimatedPositionAprProps) {
  const theme = useTheme()
  const hasInput = Boolean(route)
  const positionLiquidity = route?.positionDetails?.addedLiquidity || null
  const positionTvl = route?.positionDetails?.addedAmountUsd || null

  const debouncedLower = useDebounce(tickLower, 150)
  const debouncedUpper = useDebounce(tickUpper, 150)

  const shouldSkip =
    !isFarming ||
    !chainId ||
    !poolAddress ||
    debouncedLower === null ||
    debouncedUpper === null ||
    debouncedLower === debouncedUpper ||
    !positionLiquidity

  const { data: aprData } = useEstimatePositionAprQuery(
    shouldSkip
      ? skipToken
      : {
          chainId,
          poolAddress,
          tickLower: debouncedLower,
          tickUpper: debouncedUpper,
          positionLiquidity: String(positionLiquidity),
          positionTvl: String(positionTvl ?? 0),
        },
  )

  if (!isFarming) return null

  const tooltipContent = !hasInput ? (
    <TooltipContent>Input an amount to calculate.</TooltipContent>
  ) : !aprData?.totalApr ? (
    <TooltipContent>
      <Trans>Fees and rewards accrue only when the market price is inside your chosen range.</Trans>
    </TooltipContent>
  ) : (
    <TooltipContent>
      <Text>
        <Trans>LP Fees: {formatAprNumber(aprData?.feeApr || 0)}%</Trans>
      </Text>
      <Text>
        <Trans>EG Sharing Reward: {formatAprNumber(aprData?.egApr || 0)}%</Trans>
      </Text>
      <Text>
        <Trans>LM Reward: {formatAprNumber(aprData?.lmApr || 0)}%</Trans>
      </Text>
      <Text>
        <i>
          <Trans>The APR estimation is not guaranteed and may differ from actual returns.</Trans>
        </i>
      </Text>
      <Text>
        <i>
          <Trans>
            <a
              href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-fairflow/position-apr-estimation"
              target="_blank"
              rel="noopener noreferrer"
            >
              See more details
            </a>{' '}
            on how this estimate is calculated.
          </Trans>
        </i>
      </Text>
    </TooltipContent>
  )

  return (
    <AprBanner>
      <Text color={theme.text} fontSize={14}>
        Est. Position APR
      </Text>
      <MouseoverTooltip placement="top" width={!aprData ? 'fit-content' : '320px'} text={tooltipContent}>
        <HStack minWidth={64} justify="flex-end">
          {!aprData ? (
            <Box height={17}>
              <PositionSkeleton width={48} height={16} />
            </Box>
          ) : (
            <Text color={theme.primary} fontSize={14} fontWeight={500}>
              {aprData.totalApr === 0 ? '~0%' : `${formatAprNumber(aprData.totalApr)}%`}
            </Text>
          )}
        </HStack>
      </MouseoverTooltip>
    </AprBanner>
  )
}
