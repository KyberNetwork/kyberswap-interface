import { API_URLS, Pool, RefundAction, ZapAction, ZapRouteDetail } from '@kyber/schema'
import { getZapImpact } from '@kyber/utils'
import { useMemo } from 'react'

import InfoHelper from 'components/InfoHelper'
import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import TooltipText from 'pages/Earns/PoolDetail/AddLiquidity/components/TooltipText'
import {
  formatBpsLabel,
  formatPercent,
  getOutputTokenItems,
  getSlippageNotice,
  getZapFeePercent,
} from 'pages/Earns/PoolDetail/AddLiquidity/utils'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

type EstimateInfoProps = {
  pool: Pool
  route: ZapRouteDetail
  slippage?: number
}

type Estimate = {
  totalUsd: number
  slippage?: number
  items: ReturnType<typeof getOutputTokenItems>
  remainingUsd: number
  zapFeePercent?: number
  zapImpact: {
    display: string
  } | null
}

const getRouteAction = <T,>(route: ZapRouteDetail, type: ZapAction) =>
  route.zapDetails.actions.find(action => action.type === type) as T | undefined

const getRemainingUsd = (refundAction?: RefundAction) =>
  refundAction?.refund.tokens.reduce((total, token) => total + Number(token.amountUsd || 0), 0) || 0

const buildEstimate = ({
  pool,
  route,
  slippage,
}: {
  pool: Pool
  route: ZapRouteDetail
  slippage?: number
}): Estimate => {
  const refundAction = getRouteAction<RefundAction>(route, ZapAction.REFUND)
  const items = getOutputTokenItems(pool, route)
  const estimatedItemsUsd = items.reduce((total, item) => total + item.usdValue, 0)
  const zapImpact = getZapImpact(route.zapDetails.priceImpact, route.zapDetails.suggestedSlippage || 100)

  return {
    totalUsd: Number(route.positionDetails.addedAmountUsd || estimatedItemsUsd || 0),
    slippage,
    items,
    remainingUsd: getRemainingUsd(refundAction),
    zapFeePercent: getZapFeePercent(route),
    zapImpact: zapImpact
      ? {
          display: zapImpact.display,
        }
      : null,
  }
}

const MetricCard = ({ children }: { children: React.ReactNode }) => (
  <Stack className="min-w-0 flex-1 items-start gap-1 rounded-xl bg-tabActive px-3 py-2">{children}</Stack>
)

const EstimateInfo = ({ pool, route, slippage }: EstimateInfoProps) => {
  const theme = useTheme()
  const estimate = useMemo(() => buildEstimate({ pool, route, slippage }), [pool, route, slippage])
  const slippageNotice = useMemo(
    () => getSlippageNotice(slippage, route.zapDetails.suggestedSlippage),
    [route.zapDetails.suggestedSlippage, slippage],
  )

  return (
    <Stack className="gap-3 rounded-xl bg-buttonGray px-4 py-3">
      <Stack className="gap-3">
        <HStack className="items-center justify-between">
          <span className="text-subText">Est. Liquidity Value</span>
          <span className="font-medium text-text">
            {formatDisplayNumber(estimate.totalUsd, { style: 'currency', significantDigits: 6 })}
          </span>
        </HStack>

        <HStack className="flex-wrap items-start gap-3">
          {estimate.items.map((item, index) => (
            <Stack
              key={item.token.address}
              className={cn('min-w-0 flex-[1_1_0] gap-1', index ? 'items-end' : 'items-start')}
            >
              <HStack className="min-w-0 flex-wrap items-center gap-1">
                <TokenLogo src={item.token.logo} size={16} />
                <span className="text-text">
                  {formatDisplayNumber(item.amount, { significantDigits: 6 })} {item.token.symbol}
                </span>
              </HStack>

              <span className="text-subText">
                ~{formatDisplayNumber(item.usdValue, { style: 'currency', significantDigits: 6 })}
              </span>
            </Stack>
          ))}
        </HStack>
      </Stack>

      <div className="h-px w-full bg-tabActive" />

      <Stack className="gap-3">
        <HStack className="items-center justify-between">
          <TooltipText
            tooltip="Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Please use with caution!"
            className="text-subText"
            fontSize={14}
          >
            Max Slippage
          </TooltipText>
          <HStack className="items-center gap-1">
            <span className="font-medium" style={{ color: slippageNotice ? theme.warning : theme.text }}>
              {formatBpsLabel(estimate.slippage)}
            </span>
            {slippageNotice ? (
              <InfoHelper
                margin={false}
                placement="top"
                size={12}
                text={slippageNotice.message}
                className="text-warning"
              />
            ) : null}
          </HStack>
        </HStack>

        <HStack className="flex-wrap items-stretch gap-2">
          <MetricCard>
            <TooltipText
              tooltip="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
              className="text-subText"
              fontSize={14}
            >
              Est. Remaining
            </TooltipText>
            <span className="font-medium text-text">
              {formatDisplayNumber(estimate.remainingUsd, { style: 'currency', significantDigits: 6 })}
            </span>
          </MetricCard>
          <MetricCard>
            <TooltipText
              tooltip="The difference between input and estimated liquidity received (including remaining amount). Be careful with high value!"
              className="text-subText"
              fontSize={14}
            >
              Zap Impact
            </TooltipText>
            <span className="font-medium text-text">{estimate.zapImpact?.display}</span>
          </MetricCard>
          <MetricCard>
            <TooltipText
              tooltip={
                <Stack className="items-start gap-1 [&_a:hover]:opacity-80 [&_a]:text-primary [&_a]:no-underline">
                  Fees charged for automatically zapping into a liquidity pool. You still have to pay the standard gas
                  fees.{' '}
                  <a href={API_URLS.DOCUMENT.ZAP_FEE_MODEL} target="_blank" rel="noopener norefferer noreferrer">
                    {'>'} More details
                  </a>
                </Stack>
              }
              className="text-subText"
              fontSize={14}
            >
              Zap Fee
            </TooltipText>
            <span className="font-medium text-text">{formatPercent(estimate.zapFeePercent)}</span>
          </MetricCard>
        </HStack>
      </Stack>
    </Stack>
  )
}

export default EstimateInfo
