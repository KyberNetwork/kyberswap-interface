import { ZapRouteDetail } from '@kyber/schema'
import { MouseoverTooltip } from '@kyber/ui'
import { formatAprNumber } from '@kyber/utils/number'
import { Trans } from '@lingui/macro'
import { skipToken } from '@reduxjs/toolkit/query'
import { useEstimatePositionAprQuery } from 'services/zapEarn'

import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import useDebounce from 'hooks/useDebounce'

const TooltipContent = ({ children }: { children: React.ReactNode }) => (
  <Stack
    gap={4}
    className="text-xs [&_a:hover]:text-primary [&_a]:border-b [&_a]:border-dotted [&_a]:border-subText [&_a]:no-underline"
  >
    {children}
  </Stack>
)

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
      <div>
        <Trans>LP Fees: {formatAprNumber(aprValues.feeApr || 0)}%</Trans>
      </div>
      <div>
        <Trans>EG Sharing Reward: {formatAprNumber(aprValues.egApr || 0)}%</Trans>
      </div>
      <div>
        <Trans>LM Reward: {formatAprNumber(aprValues.lmApr || 0)}%</Trans>
      </div>
      <div>
        <i>
          <Trans>The APR estimation is not guaranteed and may differ from actual returns.</Trans>
        </i>
      </div>
      <div>
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
      </div>
    </TooltipContent>
  )

  return (
    <div className="border-primary/[0.24] flex w-full items-center justify-between gap-3 rounded-xl border border-solid bg-primary-12 px-3 py-2">
      <span className="text-sm text-text">Est. Position APR</span>
      <MouseoverTooltip placement="top" width={aprValues ? '320px' : 'fit-content'} text={tooltipContent}>
        <HStack minWidth={64} justify="flex-end">
          {isLoading ? (
            <div className="h-[17px]">
              <Skeleton width={48} height={17} />
            </div>
          ) : (
            <span className="text-sm font-medium text-primary">
              {!aprValues ? '--' : aprValues.totalApr === 0 ? '~0%' : `${formatAprNumber(aprValues.totalApr)}%`}
            </span>
          )}
        </HStack>
      </MouseoverTooltip>
    </div>
  )
}

export default EstimatedPositionApr
