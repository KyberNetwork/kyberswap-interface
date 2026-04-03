import { ZapRouteDetail } from '@kyber/schema'
import { MouseoverTooltip } from '@kyber/ui'
import { formatAprNumber } from '@kyber/utils/number'
import { Trans } from '@lingui/macro'
import { skipToken } from '@reduxjs/toolkit/query'
import { rgba } from 'polished'
import { Box, Text } from 'rebass'
import { useEstimatePositionAprQuery } from 'services/zapEarn'
import styled from 'styled-components'

import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'

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

type EstimatedPositionAprProps = {
  chainId?: number
  poolAddress?: string
  isFarming?: boolean
  tickLower: number | null
  tickUpper: number | null
  route?: ZapRouteDetail | null
}

const EstimatedPositionApr = ({
  chainId,
  poolAddress,
  isFarming,
  tickLower,
  tickUpper,
  route,
}: EstimatedPositionAprProps) => {
  const theme = useTheme()
  const hasInput = Boolean(route)
  const debouncedLower = useDebounce(tickLower, 150)
  const debouncedUpper = useDebounce(tickUpper, 150)

  const positionLiquidity = route?.positionDetails?.addedLiquidity || null
  const positionTvl = route?.positionDetails?.addedAmountUsd || null

  const shouldSkip =
    !isFarming ||
    !chainId ||
    !poolAddress ||
    debouncedLower === null ||
    debouncedUpper === null ||
    debouncedLower === debouncedUpper ||
    !positionLiquidity

  const { data: aprData, isLoading } = useEstimatePositionAprQuery(
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
  const aprValues = aprData?.data
    ? {
        feeApr: aprData.data.feeApr * 100,
        egApr: aprData.data.egApr * 100,
        lmApr: aprData.data.lmApr * 100,
        totalApr: (aprData.data.feeApr + aprData.data.egApr + aprData.data.lmApr) * 100,
      }
    : undefined

  if (!isFarming) return null

  const tooltipContent = !hasInput ? (
    <TooltipContent>Input an amount to calculate.</TooltipContent>
  ) : !aprValues?.totalApr ? (
    <TooltipContent>
      <Trans>Fees and rewards accrue only when the market price is inside your chosen range.</Trans>
    </TooltipContent>
  ) : (
    <TooltipContent>
      <Text>
        <Trans>LP Fees: {formatAprNumber(aprValues.feeApr || 0)}%</Trans>
      </Text>
      <Text>
        <Trans>EG Sharing Reward: {formatAprNumber(aprValues.egApr || 0)}%</Trans>
      </Text>
      <Text>
        <Trans>LM Reward: {formatAprNumber(aprValues.lmApr || 0)}%</Trans>
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
      <MouseoverTooltip placement="top" width={aprValues ? '320px' : 'fit-content'} text={tooltipContent}>
        <HStack minWidth={64} justify="flex-end">
          {isLoading ? (
            <Box height={17}>
              <Skeleton width={48} height={17} />
            </Box>
          ) : (
            <Text color={theme.primary} fontSize={14} fontWeight={500}>
              {!aprValues ? '--' : aprValues.totalApr === 0 ? '~0%' : `${formatAprNumber(aprValues.totalApr)}%`}
            </Text>
          )}
        </HStack>
      </MouseoverTooltip>
    </AprBanner>
  )
}

export default EstimatedPositionApr
