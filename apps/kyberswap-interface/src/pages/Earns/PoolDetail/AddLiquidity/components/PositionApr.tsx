import { ZapRouteDetail } from '@kyber/schema'
import { MouseoverTooltip, Skeleton } from '@kyber/ui'
import { formatAprNumber } from '@kyber/utils/number'
import { Trans } from '@lingui/macro'
import { skipToken } from '@reduxjs/toolkit/query'
import { Box, Text } from 'rebass'
import { useEstimatePositionAprQuery } from 'services/zapInService'
import styled from 'styled-components'

import { HStack } from 'components/Stack'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'

const TooltipContent = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  line-height: 1.4;

  a {
    text-decoration: underline;
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
  background: linear-gradient(90deg, rgba(24, 71, 56, 0.9) 0%, rgba(23, 48, 44, 0.92) 100%);
`

const AprLabel = styled(Text)`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
`

const ValueTrigger = styled(Box)`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 64px;
`

const AprValue = styled(Text)`
  margin: 0;
  color: #37d1b6;
  font-size: 14px;
  font-weight: 600;
`

interface PositionAprProps {
  chainId?: number
  poolAddress?: string
  isFarming?: boolean
  tickLower: number | null
  tickUpper: number | null
  route?: ZapRouteDetail | null
}

type AprData = {
  totalApr: number
  feeApr: number
  egApr: number
  lmApr: number
}

export default function PositionApr({
  chainId,
  poolAddress,
  isFarming,
  tickLower,
  tickUpper,
  route,
}: PositionAprProps) {
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
  const { data, isFetching } = useEstimatePositionAprQuery(
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
  const aprData = (data as AprData | undefined) || null
  const loading = isFetching

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
    <AprBanner color={theme.text}>
      <AprLabel>Est. Position APR</AprLabel>
      <MouseoverTooltip placement="top" width={!aprData ? 'fit-content' : '320px'} text={tooltipContent}>
        <ValueTrigger>
          {loading && !aprData ? (
            <Skeleton style={{ width: '64px', height: '20px' }} />
          ) : (
            <AprValue>
              {!aprData ? '--' : aprData.totalApr === 0 ? '~0%' : `${formatAprNumber(aprData.totalApr)}%`}
            </AprValue>
          )}
        </ValueTrigger>
      </MouseoverTooltip>
    </AprBanner>
  )
}
