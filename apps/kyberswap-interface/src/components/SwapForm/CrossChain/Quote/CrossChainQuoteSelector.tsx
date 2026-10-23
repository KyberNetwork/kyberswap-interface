import { t } from '@lingui/macro'
import React, { useState } from 'react'
import { Clock } from 'react-feather'
import { useMedia } from 'react-use'

import MenuFlyout from 'components/MenuFlyout'
import Modal from 'components/Modal'
import ScrollableWithSignal from 'components/ScrollableWithSignal'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { formatTime } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteSummary'
import { CrossChainRoutesButton } from 'components/SwapForm/CrossChain/Quote/CrossChainRoutesButton'
import { useCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { Currency } from 'pages/CrossChainSwap/adapters/types'
import { QuoteProviderName } from 'pages/CrossChainSwap/components/QuoteProviderName'
import { TokenLogoWithChain } from 'pages/CrossChainSwap/components/TokenLogoWithChain'
import { Quote, getQuoteId } from 'pages/CrossChainSwap/registry'
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

type RouteOptionsContentProps = {
  quotes: Quote[]
  selectedQuote: Quote | null
  tokenOut?: Currency
  isLoading: boolean
  upToLarge: boolean
  onSelect: (quote: Quote) => void
  onDismiss: () => void
}

const RouteOptionsContent = ({
  quotes,
  selectedQuote,
  tokenOut,
  isLoading,
  upToLarge,
  onSelect,
  onDismiss,
}: RouteOptionsContentProps) => {
  return (
    <Stack className="size-full gap-3 text-text">
      <HStack className="justify-between">
        <span className="font-medium">{t`Choose your Route`}</span>
        {upToLarge && <CloseIcon onClick={onDismiss} />}
      </HStack>
      <Stack className="flex-1 overflow-y-scroll">
        <ScrollableWithSignal data-open="true" showArrow className="flex max-h-full flex-col gap-3 overflow-y-auto">
          {quotes.map((quote, index) => {
            return (
              <QuoteRow
                key={getQuoteId(quote)}
                selected={(selectedQuote ? getQuoteId(selectedQuote) : null) === getQuoteId(quote)}
                role="button"
                onClick={() => onSelect(quote)}
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

                    {index === 0 && (
                      <div className="shrink-0 rounded-full bg-darkGreen px-2 py-1 text-xs font-medium text-white">
                        {t`Best Return`}
                      </div>
                    )}
                  </HStack>
                  <HStack className="items-center justify-between gap-2 text-sm text-subText">
                    <HStack className="min-w-0 flex-wrap items-center gap-2">
                      <QuoteProviderName quote={quote} />
                      {(quote.quote.additionalFeeUsd ?? 0) > 0 ? (
                        <span>
                          {t`Additional fee:`}{' '}
                          {formatDisplayNumber(quote.quote.additionalFeeUsd, {
                            style: 'currency',
                            significantDigits: 3,
                          })}
                        </span>
                      ) : quote.quote.additionalFeeAmount ? (
                        <span>
                          {t`Additional fee:`} {quote.quote.additionalFeeAmount}
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
          {isLoading &&
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
          {!quotes.length && !isLoading && (
            <div className="py-6 text-center text-sm font-medium text-subText">{t`No route found`}</div>
          )}
        </ScrollableWithSignal>
      </Stack>
    </Stack>
  )
}

type CrossChainQuoteSelectorProps = {
  quotes: Quote[]
  selectedQuote: Quote | null
  tokenOut?: Currency
  onChange: (quote: Quote) => void
}

/** Owns route visibility and commits selection before closing the panel. */
export const CrossChainQuoteSelector = ({
  quotes,
  selectedQuote,
  tokenOut,
  onChange,
}: CrossChainQuoteSelectorProps) => {
  const { loading, allLoading, disable, fromChainId, toChainId } = useCrossChainSwap()
  const { trackingHandler } = useTracking()
  const [show, setShow] = useState(false)

  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const isLoading = !disable && (loading || allLoading)

  const handleSelect = (quote: Quote) => {
    onChange(quote)
    setShow(false)
    if (getQuoteId(quote) !== (selectedQuote ? getQuoteId(selectedQuote) : null)) {
      trackingHandler(TRACKING_EVENT_TYPE.CC_ROUTE_VIEWED, {
        routing_source: quote.adapter.getName(),
        amount_out: quote.quote.formattedOutputAmount,
        amount_out_usd: quote.quote.outputUsd,
        time_estimate: quote.quote.timeEstimate,
        from_chain: fromChainId,
        to_chain: toChainId,
      })
    }
  }

  const contentProps = {
    quotes,
    selectedQuote,
    tokenOut,
    isLoading,
    upToLarge,
    onSelect: handleSelect,
    onDismiss: () => setShow(false),
  }

  if (upToLarge) {
    return (
      <>
        <CrossChainRoutesButton expanded={show} onClick={() => setShow(prev => !prev)} />
        <Modal
          isOpen={show}
          onDismiss={() => {
            setShow(false)
          }}
          className="outline-none"
        >
          <HStack className="relative w-full p-5">
            <RouteOptionsContent {...contentProps} />
          </HStack>
        </Modal>
      </>
    )
  }

  return (
    <MenuFlyout
      variant="sidePanel"
      isOpen={show}
      trigger={<CrossChainRoutesButton expanded={show} />}
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
      <RouteOptionsContent {...contentProps} />
    </MenuFlyout>
  )
}
