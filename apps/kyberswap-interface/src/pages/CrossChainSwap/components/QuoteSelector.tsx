import { t } from '@lingui/macro'
import React, { useState } from 'react'
import { Clock, DollarSign, Star, Zap } from 'react-feather'
import { useMedia } from 'react-use'

import { ReactComponent as RouteIcon } from 'assets/svg/route_icon.svg'
import MenuFlyout from 'components/MenuFlyout'
import Modal from 'components/Modal'
import ScrollableWithSignal from 'components/ScrollableWithSignal'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { Currency } from 'pages/CrossChainSwap/adapters'
import type { KyberCrossRawQuote } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/types'
import { getKyberCrossRoutePlan } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/utils'
import { QuoteProviderName } from 'pages/CrossChainSwap/components/QuoteProviderName'
import { formatTime } from 'pages/CrossChainSwap/components/Summary'
import { TokenLogoWithChain } from 'pages/CrossChainSwap/components/TokenLogoWithChain'
import { useCrossChainSwap } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { Quote, getQuoteId } from 'pages/CrossChainSwap/registry'
import { CloseIcon, MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const ROUTE_TAG_ICONS: Record<string, typeof Star> = {
  RECOMMENDED: Star,
  FASTEST: Zap,
  BEST_OUTPUT: DollarSign,
}

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
  const { allLoading, fromChainId, toChainId, quoteMode } = useCrossChainSwap()
  const { trackingHandler } = useTracking()
  const [show, setShow] = useState(false)

  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const { weeks, year } = campaignConfig[CampaignType.NearIntents]
  const now = Date.now() / 1000
  const currentYear = new Date().getFullYear()
  const nearIntentCampaignOnGoing = year === currentYear && weeks.some(week => week.start <= now && week.end > now)

  const routeTagLabels: Record<string, string> = {
    RECOMMENDED: t`Recommended`,
    FASTEST: t`Fastest`,
    BEST_OUTPUT: t`Best Output`,
  }

  const content = (
    <Stack className="size-full gap-3 text-text">
      <HStack className="justify-between">
        <span className="font-medium">{t`Choose your Route`}</span>
        {upToLarge && <CloseIcon onClick={() => setShow(false)} />}
      </HStack>
      <Stack className="flex-1 overflow-y-scroll">
        <ScrollableWithSignal data-open="true" showArrow className="flex max-h-full flex-col gap-3 overflow-y-auto">
          {quotes.map((quote, index) => {
            const isKyberCross = quote.adapter.getName() === 'KyberCross'
            const routeTags =
              isKyberCross && quoteMode === 'direct'
                ? getKyberCrossRoutePlan(quote.quote.rawQuote as KyberCrossRawQuote)?.tags || []
                : []
            const ongoingTag =
              quoteMode === 'direct' && nearIntentCampaignOnGoing && quote.adapter.getName() === 'Near Intents'
            return (
              <QuoteRow
                key={getQuoteId(quote)}
                selected={getQuoteId(selectedQuote) === getQuoteId(quote)}
                role="button"
                onClick={() => {
                  onChange(quote)
                  setShow(false)
                  if (getQuoteId(quote) !== getQuoteId(selectedQuote)) {
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
                <Stack className="gap-2">
                  <HStack className="items-center justify-between gap-2">
                    <HStack className="min-w-0 items-center gap-2">
                      <HStack className="items-center gap-1">
                        <TokenLogoWithChain
                          currency={tokenOut}
                          chainId={quote.quote.quoteParams.toChain}
                          size={20}
                          chainLogoStyle={{
                            bottom: 0,
                            top: 'auto',
                          }}
                        />
                        <span className="text-xl font-medium">
                          {formatDisplayNumber(quote.quote.formattedOutputAmount, { significantDigits: 5 })}
                        </span>
                        <span className="text-lg font-medium text-subText">{tokenOut?.symbol}</span>
                      </HStack>
                      <span className="text-sm font-medium text-subText">
                        ~
                        {formatDisplayNumber(quote.quote.outputUsd, {
                          style: 'currency',
                          significantDigits: 3,
                          fractionDigits: 2,
                        })}
                      </span>
                    </HStack>

                    {routeTags.length > 0 && (
                      <HStack className="shrink-0 items-center gap-1">
                        {routeTags.map(tag => {
                          if (!Object.prototype.hasOwnProperty.call(ROUTE_TAG_ICONS, tag)) return null
                          const Icon = ROUTE_TAG_ICONS[tag]
                          return (
                            <MouseoverTooltip
                              key={tag}
                              text={<span className="whitespace-nowrap">{routeTagLabels[tag]}</span>}
                              width="max-content"
                              placement="top"
                              noArrow
                            >
                              <span
                                aria-label={routeTagLabels[tag]}
                                className="flex size-6 shrink-0 items-center justify-center rounded bg-primary-20 text-primary"
                              >
                                <Icon size={16} aria-hidden="true" />
                              </span>
                            </MouseoverTooltip>
                          )
                        })}
                      </HStack>
                    )}

                    {quoteMode === 'stream' && isKyberCross && (
                      <span className="shrink-0 rounded-full bg-primary-20 px-2 py-1 text-xs font-medium text-primary">
                        KyberCross
                      </span>
                    )}

                    {ongoingTag && (
                      <div className="shrink-0 rounded-full bg-darkBlue px-2 py-1 text-xs font-medium text-white">
                        {t`On-Going Campaign`}
                      </div>
                    )}

                    {quoteMode === 'direct' && index === 0 && !ongoingTag && !isKyberCross && (
                      <div className="shrink-0 rounded-full bg-darkGreen px-2 py-1 text-xs font-medium text-white">
                        {t`Best Return`}
                      </div>
                    )}
                  </HStack>
                  <HStack className="items-center justify-between gap-2 text-sm text-subText">
                    <HStack className="min-w-0 flex-wrap items-center gap-2">
                      <QuoteProviderName quote={quote} />
                      {quote.quote.protocolFee > 0 ? (
                        <span>
                          {t`Protocol fee:`}{' '}
                          {formatDisplayNumber(quote.quote.protocolFee, {
                            style: 'currency',
                            significantDigits: 3,
                          })}
                        </span>
                      ) : quote.quote.protocolFeeString ? (
                        <span>
                          {t`Protocol fee:`} {quote.quote.protocolFeeString}
                        </span>
                      ) : null}
                    </HStack>
                    <HStack className="shrink-0 items-center gap-1">
                      <Clock size={14} />
                      <span>{formatTime(quote.quote.timeEstimate)}</span>
                    </HStack>
                  </HStack>
                </Stack>
              </QuoteRow>
            )
          })}
          {allLoading &&
            Array.from({ length: Math.max(1, 6 - quotes.length) }).map((_, index) => {
              return (
                <QuoteRow key={index}>
                  <Stack className="gap-3">
                    <Skeleton height="24px" width="200px" />
                    <Skeleton height="20px" width="160px" />
                  </Stack>
                </QuoteRow>
              )
            })}
        </ScrollableWithSignal>
      </Stack>
    </Stack>
  )

  const trigger = (
    <HStack
      onClick={() => {
        if (upToLarge) setShow(prev => !prev)
      }}
      role="button"
      className="cursor-pointer items-center justify-center gap-1 rounded-full bg-subText/[0.08] px-2 py-1 text-sm font-medium text-subText hover:bg-subText/[0.12]"
    >
      <RouteIcon />
      {t`Route Options`}
    </HStack>
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
          className="outline-none"
        >
          <HStack className="relative w-full p-5">{content}</HStack>
        </Modal>
      </>
    )
  }

  return (
    <MenuFlyout
      isOpen={show}
      trigger={trigger}
      hasArrow={false}
      toggle={() => setShow(prev => !prev)}
      className="bg-background"
      style={{
        width: '100%',
        left: `calc(100% + 16px)`,
        top: 0,
        zIndex: 9999,
        height: '100%',
      }}
    >
      {content}
    </MenuFlyout>
  )
}
