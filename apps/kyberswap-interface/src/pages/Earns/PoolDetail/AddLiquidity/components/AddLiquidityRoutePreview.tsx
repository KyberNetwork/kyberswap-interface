import { API_URLS, Pool, Token, ZapRouteDetail } from '@kyber/schema'
import { Fragment } from 'react'

import { ReactComponent as KyberLogo } from 'assets/svg/kyber/kyber_logo.svg'
import Skeleton from 'components/Skeleton'
import TokenLogo from 'components/TokenLogo'
import TooltipText from 'pages/Earns/PoolDetail/AddLiquidity/components/TooltipText'
import {
  formatBpsLabel,
  formatPercent,
  getInputTokenItems,
  getOutputTokenItems,
  getZapFeePercent,
} from 'pages/Earns/PoolDetail/AddLiquidity/utils'
import { formatDisplayNumber } from 'utils/numbers'

type RouteTokenItem = {
  token: Token
  amount?: number
}

type AddLiquidityRoutePreviewProps = {
  inputTokens?: Token[]
  inputAmounts?: string
  pool?: Pool | null
  zapRoute?: ZapRouteDetail | null
  slippage?: number
}

const PreviewAssetItems = ({ items }: { items: RouteTokenItem[] }) => {
  if (!items.length) {
    return (
      <div className="h-[17px]">
        <Skeleton width={160} height={17} />
      </div>
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-2">
      {items.slice(0, 2).map((item, index) => (
        <Fragment key={`${item.token.address}-${index}`}>
          {index > 0 ? <span className="text-sm text-subText">|</span> : null}
          <div className="flex min-w-0 items-center gap-1">
            <TokenLogo src={item.token.logo} size={16} />
            <span className="text-sm font-medium text-text">
              {formatDisplayNumber(item.amount, { significantDigits: 6 })} {item.token.symbol}
            </span>
          </div>
        </Fragment>
      ))}
      {items.length > 2 ? (
        <div className="flex items-center rounded-full bg-tabActive px-2 py-1">
          <span className="text-xs text-subText">+{items.length - 2} more</span>
        </div>
      ) : null}
    </div>
  )
}

const PreviewAssetCard = ({ items, usdAmount }: { items: RouteTokenItem[]; usdAmount?: string }) => (
  <div className="relative z-[1] flex min-w-0 flex-col overflow-hidden rounded-xl bg-buttonGray">
    <div className="flex items-center px-4 py-2">
      <PreviewAssetItems items={items} />
    </div>
    <div className="flex flex-col justify-center bg-background px-4 py-2">
      <span className="text-center text-sm text-subText">
        {usdAmount === undefined
          ? '...'
          : `~${formatDisplayNumber(Number(usdAmount), { style: 'currency', significantDigits: 6 })}`}
      </span>
    </div>
  </div>
)

const AddLiquidityRoutePreview = ({
  inputTokens,
  inputAmounts,
  pool,
  zapRoute,
  slippage,
}: AddLiquidityRoutePreviewProps) => {
  const inputItems = getInputTokenItems(inputTokens ?? [], inputAmounts ?? '')
  const outputItems = getOutputTokenItems(pool, zapRoute)
  const zapFeePercent = getZapFeePercent(zapRoute)

  return (
    <div className="flex w-full items-center max-sm:flex-col max-sm:items-stretch">
      <PreviewAssetCard items={inputItems} usdAmount={zapRoute?.zapDetails.initialAmountUsd} />

      <div className="relative flex flex-1 flex-col items-center justify-center max-sm:min-h-[140px] max-sm:min-w-full">
        <div className="absolute inset-x-0 top-1/2 h-px bg-border opacity-60 after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:border-y-4 after:border-l-[6px] after:border-y-transparent after:border-l-border max-sm:inset-y-[-8px] max-sm:left-1/2 max-sm:right-auto max-sm:h-auto max-sm:w-px max-sm:-translate-x-1/2 max-sm:after:bottom-2 max-sm:after:left-1/2 max-sm:after:right-auto max-sm:after:top-auto max-sm:after:-translate-x-1/2 max-sm:after:border-x-4 max-sm:after:border-b-0 max-sm:after:border-t-[6px] max-sm:after:border-x-transparent max-sm:after:border-t-border" />
        <div className="absolute left-[-4px] top-1/2 z-[1] size-2 -translate-y-1/2 rounded-full bg-border opacity-80 max-sm:left-1/2 max-sm:top-[-4px] max-sm:-translate-x-1/2" />
        <div className="relative z-[1] flex min-w-[160px] flex-col overflow-hidden rounded-xl bg-background">
          <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
            <KyberLogo width={18} height={18} />
            <span className="text-sm font-medium text-subText">Kyber Zap</span>
          </div>

          <div className="flex flex-col gap-2 px-3 py-2">
            <div className="flex items-center justify-between gap-4">
              <TooltipText
                tooltip={
                  <div className="flex flex-col items-start gap-1 [&_a]:text-primary [&_a]:no-underline">
                    Fees charged for automatically zapping into a liquidity pool. You still have to pay the standard gas
                    fees.
                    <a href={API_URLS.DOCUMENT.ZAP_FEE_MODEL} target="_blank" rel="noopener norefferer noreferrer">
                      {'>'} More details
                    </a>
                  </div>
                }
                placement="left"
                color="var(--ks-subText)"
                fontSize={14}
              >
                Fee
              </TooltipText>
              <span className="text-sm font-medium text-text2">{formatPercent(zapFeePercent)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <TooltipText
                tooltip={
                  'Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Please use with caution!'
                }
                placement="left"
                color="var(--ks-subText)"
                fontSize={14}
              >
                Max Slippage
              </TooltipText>
              <span className="text-sm font-medium text-text2">{formatBpsLabel(slippage)}</span>
            </div>
          </div>
        </div>
      </div>

      <PreviewAssetCard items={outputItems} usdAmount={zapRoute?.positionDetails.addedAmountUsd} />
    </div>
  )
}

export default AddLiquidityRoutePreview
