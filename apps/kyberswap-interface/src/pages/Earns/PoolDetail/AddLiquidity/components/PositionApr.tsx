import { ZapRouteDetail } from '@kyber/schema'
import { MouseoverTooltip, Skeleton } from '@kyber/ui'
import { formatAprNumber } from '@kyber/utils/dist/number'
import { Trans } from '@lingui/macro'
import { Box, Text } from 'rebass'
import styled from 'styled-components'

import { HStack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import useAddLiquidityPositionApr from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useAddLiquidityPositionApr'

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
  amounts: string
  route?: ZapRouteDetail | null
  routeLoading?: boolean
}

export default function PositionApr({
  chainId,
  poolAddress,
  isFarming,
  tickLower,
  tickUpper,
  amounts,
  route,
  routeLoading = false,
}: PositionAprProps) {
  const theme = useTheme()

  const { data, hasInput, loading } = useAddLiquidityPositionApr({
    chainId,
    poolAddress,
    tickLower,
    tickUpper,
    amounts,
    route,
    routeLoading,
    enabled: isFarming,
  })

  if (!isFarming) return null

  const tooltipContent = !hasInput ? (
    <TooltipContent>Input an amount to calculate.</TooltipContent>
  ) : !data?.totalApr ? (
    <TooltipContent>
      <Trans>Fees and rewards accrue only when the market price is inside your chosen range.</Trans>
    </TooltipContent>
  ) : (
    <TooltipContent>
      <Text>
        <Trans>LP Fees: {formatAprNumber(data?.feeApr || 0)}%</Trans>
      </Text>
      <Text>
        <Trans>EG Sharing Reward: {formatAprNumber(data?.egApr || 0)}%</Trans>
      </Text>
      <Text>
        <Trans>LM Reward: {formatAprNumber(data?.lmApr || 0)}%</Trans>
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
      <MouseoverTooltip placement="top" width={!data ? 'fit-content' : '320px'} text={tooltipContent}>
        <ValueTrigger>
          {loading && !data ? (
            <Skeleton style={{ width: '64px', height: '20px' }} />
          ) : (
            <AprValue>{!data ? '--' : data.totalApr === 0 ? '~0%' : `${formatAprNumber(data.totalApr)}%`}</AprValue>
          )}
        </ValueTrigger>
      </MouseoverTooltip>
    </AprBanner>
  )
}
