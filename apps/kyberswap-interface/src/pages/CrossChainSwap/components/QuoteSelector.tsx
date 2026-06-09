import { t } from '@lingui/macro'
import React, { useState } from 'react'
import { Clock } from 'react-feather'
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
import { QuoteProviderName } from 'pages/CrossChainSwap/components/QuoteProviderName'
import { formatTime } from 'pages/CrossChainSwap/components/Summary'
import { TokenLogoWithChain } from 'pages/CrossChainSwap/components/TokenLogoWithChain'
import { useCrossChainSwap } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { Quote } from 'pages/CrossChainSwap/registry'
import { CloseIcon, MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

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

  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const { weeks, year } = campaignConfig[CampaignType.NearIntents]
  const now = Date.now() / 1000
  const currentYear = new Date().getFullYear()
  const nearIntentCampaignOnGoing = year === currentYear && weeks.some(week => week.start <= now && week.end > now)

  const content = (
    <Stack className="size-full gap-3 text-text">
      <HStack className="justify-between">
        <span className="font-medium">{t`Choose your Route`}</span>
        {upToLarge && <CloseIcon onClick={() => setShow(false)} />}
      </HStack>
      <Stack className="flex-1 overflow-y-scroll">
        <ScrollableWithSignal data-open="true" showArrow className="flex max-h-full flex-col gap-3 overflow-y-auto">
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
                <Stack className="gap-2">
                  <HStack className="items-center justify-between gap-2">
                    <HStack className="min-w-0 items-center gap-1">
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
                      <span className="text-sm text-subText">
                        ~
                        {formatDisplayNumber(quote.quote.outputUsd, {
                          style: 'currency',
                          significantDigits: 3,
                          fractionDigits: 2,
                        })}
                      </span>
                    </HStack>

                    {ongoingTag && (
                      <div className="shrink-0 rounded-full bg-darkBlue px-2 py-1 text-xs font-medium text-white">
                        {t`On-Going Campaign`}
                      </div>
                    )}

                    {index === 0 && !ongoingTag && (
                      <div className="shrink-0 rounded-full bg-darkGreen px-2 py-1 text-xs font-medium text-white">
                        {t`Best Return`}
                      </div>
                    )}
                  </HStack>
                  <HStack className="items-center gap-2 text-sm text-subText">
                    <QuoteProviderName quote={quote} />
                    <span>|</span>
                    <HStack className="items-center gap-1">
                      <Clock size={14} />
                      <span>{formatTime(quote.quote.timeEstimate)}</span>
                    </HStack>
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
      trigger={
        <MouseoverTooltip text={t`More options`} width="fit-content">
          {trigger}
        </MouseoverTooltip>
      }
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
