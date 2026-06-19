import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'

import TokenLogo from 'components/TokenLogo'
import { Badge, ImageContainer } from 'pages/Earns/UserPositions/styles'
import {
  getFeeYieldCondition,
  getPriceCondition,
  getTimeCondition,
} from 'pages/Earns/components/SmartExit/utils/typeGuards'
import { ConditionType, Metric, ParsedPosition, PriceCondition, SelectedMetric } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

export default function Condition({
  position,
  selectedMetrics,
  conditionType,
  revertPrice = false,
}: {
  position: ParsedPosition
  selectedMetrics: SelectedMetric[]
  conditionType: ConditionType
  revertPrice?: boolean
}) {
  const [metric1, metric2] = selectedMetrics

  const feeYieldCondition1 = getFeeYieldCondition(metric1)
  const priceCondition1 = getPriceCondition(metric1)
  const timeCondition1 = getTimeCondition(metric1)
  const feeYieldCondition2 = metric2 ? getFeeYieldCondition(metric2) : null
  const priceCondition2 = metric2 ? getPriceCondition(metric2) : null
  const timeCondition2 = metric2 ? getTimeCondition(metric2) : null

  const baseSymbol = revertPrice ? position.token1.symbol : position.token0.symbol
  const quoteSymbol = revertPrice ? position.token0.symbol : position.token1.symbol

  // Stored `priceCondition` is always in forward (token0/token1) domain.
  // In revert mode we flip the comparator and invert the price value for display only.
  const renderPricePhrase = (priceCondition: PriceCondition) => {
    const storedIsLte = !!priceCondition.lte
    const storedValue = priceCondition.lte || priceCondition.gte || ''
    const displayIsLte = revertPrice ? !storedIsLte : storedIsLte
    const forwardNum = parseFloat(storedValue)
    const displayValue = revertPrice && isFinite(forwardNum) && forwardNum > 0 ? 1 / forwardNum : forwardNum
    return (
      <>
        <Trans>Pool price is</Trans> {displayIsLte ? '≤' : '≥'}{' '}
        {formatDisplayNumber(displayValue, { significantDigits: 6 })} {baseSymbol}/{quoteSymbol}
      </>
    )
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center">
        <Trans>Remove</Trans>
        <div className="mx-2 flex items-center gap-1 rounded-2xl bg-white-04 px-3 py-2">
          <ImageContainer>
            <TokenLogo src={position?.token0.logo} />
            <TokenLogo src={position?.token1.logo} translateLeft />
            <TokenLogo src={position.chain.logo} size={12} translateLeft translateTop />
          </ImageContainer>
          <span>
            {position.token0.symbol}/{position.token1.symbol}
          </span>
          <Badge>Fee {formatDisplayNumber(position?.pool.fee, { significantDigits: 4 })}%</Badge>
        </div>
        <Trans>When</Trans>
      </div>

      <div className="mt-4 rounded-xl bg-primary/15 px-4 py-3">
        {metric1.metric === Metric.FeeYield && feeYieldCondition1 && (
          <Trans>The fee yield ≥ {feeYieldCondition1}%</Trans>
        )}
        {metric1.metric === Metric.Time && timeCondition1 && timeCondition1.time && (
          <>
            <p>{timeCondition1.condition.charAt(0).toUpperCase() + timeCondition1.condition.slice(1)}</p>
            <p>{dayjs(timeCondition1.time).format('DD/MM/YYYY HH:mm:ss')}</p>
          </>
        )}
        {metric1.metric === Metric.PoolPrice && priceCondition1 && <p>{renderPricePhrase(priceCondition1)}</p>}
        {metric2 && (
          <>
            <div className="my-2 flex items-center gap-4">
              <div className="h-px flex-1 border-b border-dashed border-border" />
              {conditionType === ConditionType.And ? <Trans>And</Trans> : <Trans>Or</Trans>}
              <div className="h-px flex-1 border-b border-dashed border-border" />
            </div>

            {metric2.metric === Metric.FeeYield && feeYieldCondition2 && (
              <Trans>The fee yield ≥ {feeYieldCondition2}%</Trans>
            )}
            {metric2.metric === Metric.Time && timeCondition2 && timeCondition2.time && (
              <>
                <p>{timeCondition2.condition.charAt(0).toUpperCase() + timeCondition2.condition.slice(1)}</p>
                <p className="mt-1.5">{dayjs(timeCondition2.time).format('DD/MM/YYYY HH:mm:ss')}</p>
              </>
            )}
            {metric2.metric === Metric.PoolPrice && priceCondition2 && (
              <p className="mt-1.5">{renderPricePhrase(priceCondition2)}</p>
            )}
          </>
        )}
      </div>
    </>
  )
}
