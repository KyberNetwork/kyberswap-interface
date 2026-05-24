import { t } from '@lingui/macro'
import React, { useState } from 'react'
import { Clock, X } from 'react-feather'
import { useMedia } from 'react-use'

import { ReactComponent as RouteIcon } from 'assets/svg/route_icon.svg'
import MenuFlyout from 'components/MenuFlyout'
import Modal from 'components/Modal'
import ScrollableWithSignal from 'components/ScrollableWithSignal'
import Skeleton from 'components/Skeleton'
import { Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { Currency } from 'pages/CrossChainSwap/adapters'
import { QuoteProviderName } from 'pages/CrossChainSwap/components/QuoteProviderName'
import { formatTime } from 'pages/CrossChainSwap/components/Summary'
import { TokenLogoWithChain } from 'pages/CrossChainSwap/components/TokenLogoWithChain'
import { registry, useCrossChainSwap } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { Quote } from 'pages/CrossChainSwap/registry'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

import './QuoteSelector.css'

const QuoteRow = ({ selected, children, ...rest }: React.HTMLAttributes<HTMLDivElement> & { selected?: boolean }) => (
  <div
    {...rest}
    className={cn(
      'cursor-pointer rounded-2xl border border-border p-3 hover:bg-primary-10',
      selected ? 'border-darkGreen bg-primary-10' : 'bg-transparent',
    )}
  >
    {children}
  </div>
)

export const QuoteSelector = ({
  quotes,
  selectedQuote,
  onChange,
  tokenOut,
}: {
  quotes: Quote[]
  selectedQuote: Quote
  onChange: (quote: Quote) => void
  tokenOut?: Currency
}) => {
  const { allLoading, fromChainId, toChainId } = useCrossChainSwap()
  const { trackingHandler } = useTracking()
  const [show, setShow] = useState(false)
  const theme = useTheme()

  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const { weeks, year } = campaignConfig[CampaignType.NearIntents]
  const now = Date.now() / 1000
  const currentYear = new Date().getFullYear()
  const nearIntentCampaignOnGoing = year === currentYear && weeks.some(week => week.start <= now && week.end > now)

  const content = (
    <div className="flex size-full flex-col gap-4 text-text">
      <div className="flex justify-between">
        <span className="text-base font-medium">{t`Choose your Route`}</span>
        {upToLarge && <X onClick={() => setShow(false)} />}
      </div>
      <div className="flex-1 overflow-y-scroll">
        <ScrollableWithSignal
          data-open="true"
          showArrow
          className="ks-quote-selector-list flex max-h-full flex-col gap-3 overflow-y-auto pb-2 pr-2"
        >
          {quotes.map((quote, index) => {
            const ongoingTag = nearIntentCampaignOnGoing && quote.adapter.getName() === 'Near Intents'
            return (
              <QuoteRow
                key={quote.adapter.getName()}
                selected={selectedQuote.adapter.getName() === quote.adapter.getName()}
                role="button"
                onClick={() => {
                  onChange(quote)
                  setShow(false)
                  if (quote.adapter.getName() !== selectedQuote.adapter.getName()) {
                    trackingHandler(TRACKING_EVENT_TYPE.CC_ROUTE_VIEWED, {
                      routing_source: quote.adapter.getName(),
                      amount_out: quote.quote.formattedOutputAmount,
                      amount_out_usd: quote.quote.outputUsd,
                      time_estimate: quote.quote.timeEstimate,
                      from_chain: fromChainId,
                      to_chain: toChainId,
                    })
                  }
                }}
              >
                <div className="flex items-center">
                  <TokenLogoWithChain
                    currency={tokenOut}
                    chainId={quote.quote.quoteParams.toChain}
                    size={20}
                    chainLogoStyle={{
                      bottom: 0,
                      top: 'auto',
                    }}
                  />
                  <span className="ml-1 text-xl font-medium">
                    {formatDisplayNumber(quote.quote.formattedOutputAmount, { significantDigits: 5 })}
                  </span>
                  <span className="ml-1 text-lg font-medium text-subText">{tokenOut?.symbol}</span>
                  <span className="ml-1 text-sm text-subText">
                    ~
                    {formatDisplayNumber(quote.quote.outputUsd, {
                      style: 'currency',
                      significantDigits: 3,
                      fractionDigits: 2,
                    })}
                  </span>

                  {ongoingTag && (
                    <div className="ml-auto rounded-full bg-primary-20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {t`On-Going Campaign`}
                    </div>
                  )}

                  {index === 0 && !ongoingTag && (
                    <div className="ml-auto rounded-full bg-darkGreen px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {t`Best Return`}
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center text-sm text-subText">
                  <QuoteProviderName quote={quote} />
                  <span className="mx-2">|</span>
                  <Clock size={14} className="text-primary" />
                  <span className="ml-1 mr-2">{formatTime(quote.quote.timeEstimate)}</span>
                  {quote.quote.protocolFee > 0 ? (
                    <span className="ml-1 mr-2">
                      {t`Protocol fee:`}{' '}
                      {formatDisplayNumber(quote.quote.protocolFee, {
                        style: 'currency',
                        significantDigits: 3,
                      })}
                    </span>
                  ) : quote.quote.protocolFeeString ? (
                    <span className="ml-1 mr-2">
                      {t`Protocol fee:`} {quote.quote.protocolFeeString}
                    </span>
                  ) : null}
                </div>
              </QuoteRow>
            )
          })}
          {allLoading &&
            Array(registry.getAllAdapters().length - quotes.length)
              .fill(0)
              .map((_, index) => {
                return (
                  <QuoteRow key={index}>
                    <Stack gap={12}>
                      <Skeleton height="20px" width="200px" />
                      <Skeleton height="17px" width="160px" />
                    </Stack>
                  </QuoteRow>
                )
              })}
        </ScrollableWithSignal>
      </div>
    </div>
  )

  const trigger = (
    <div
      onClick={() => {
        if (upToLarge) setShow(prev => !prev)
      }}
      role="button"
      className="flex cursor-pointer items-center justify-center gap-1 rounded-full bg-subText-20 px-2 py-1 text-sm font-medium text-subText hover:bg-subText-40"
    >
      <RouteIcon />
      {t`Route Options`}
    </div>
  )

  if (upToLarge) {
    return (
      <>
        {trigger}
        <Modal
          isOpen={show}
          onDismiss={() => {
            setShow(false)
          }}
        >
          <div className="flex w-full p-5 pr-3">{content}</div>
        </Modal>
      </>
    )
  }
  return (
    <MenuFlyout
      isOpen={show}
      trigger={
        <MouseoverTooltip text={t`More options`} width="fit-content">
          {trigger}
        </MouseoverTooltip>
      }
      hasArrow={false}
      toggle={() => setShow(prev => !prev)}
      style={{
        width: '100%',
        left: `calc(100% + 16px)`,
        top: 0,
        zIndex: 9999,
        height: '100%',
        backgroundColor: theme.background,
        paddingRight: '12px',
      }}
    >
      {content}
    </MenuFlyout>
  )
}
