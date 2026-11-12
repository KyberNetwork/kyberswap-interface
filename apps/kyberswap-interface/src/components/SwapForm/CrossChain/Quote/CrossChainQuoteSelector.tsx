import { Trans, t } from '@lingui/macro'
import { AnimatePresence, type HTMLMotionProps, motion, useReducedMotion } from 'framer-motion'
import { type ReactNode, useState } from 'react'
import { Clock } from 'react-feather'
import { useMedia } from 'react-use'
import { sortQuotesByNetOutput } from 'services/crossChain/quote/utils'
import { Quote, getQuoteId } from 'services/crossChain/registry'

import { ReactComponent as FeeIcon } from 'assets/svg/fee.svg'
import GasStation from 'components/Icons/GasStation'
import MenuFlyout from 'components/MenuFlyout'
import Modal from 'components/Modal'
import ScrollableWithSignal from 'components/ScrollableWithSignal'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { formatTime } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteSummary'
import { CrossChainRoutesButton } from 'components/SwapForm/CrossChain/Quote/CrossChainRoutesButton'
import { QuoteProviderName } from 'components/SwapForm/CrossChain/Quote/QuoteProviderName'
import { useCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { TokenLogoWithChain } from 'components/TokenLogo/TokenLogoWithChain'
import { ClickTooltip, MouseoverTooltip } from 'components/Tooltip'
import { Z_INDEXS } from 'constants/styles'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { CloseIcon, MEDIA_WIDTHS } from 'theme'
import { Currency } from 'types/crossChain'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const MotionScrollableWithSignal = motion.create(ScrollableWithSignal)
const routeKey = (quote: Quote) => `${getQuoteId(quote)}:${!!quote.quote.quoteParams.gasDrop}`

const QuoteRow = ({
  selected,
  children,
  initial = false,
  ...rest
}: HTMLMotionProps<'div'> & { selected?: boolean }) => (
  <motion.div
    {...rest}
    initial={initial}
    transition={{
      layout: { type: 'spring', stiffness: 400, damping: 40 },
      opacity: { duration: 0.16, delay: 0.1 },
    }}
    className={cn(
      'cursor-pointer rounded-2xl border border-border p-3 hover:bg-primary-10',
      selected ? 'border-darkGreen bg-primary-10' : 'bg-transparent',
    )}
  >
    {children}
  </motion.div>
)

type RouteOptionsContentProps = {
  quotes: Quote[]
  selectedQuote: Quote | null
  tokenOut?: Currency
  isLoading: boolean
  upToLarge: boolean
  onSelect: (quote: Quote) => void
  onDismiss: () => void
  routeBadge?: (quote: Quote, index: number) => ReactNode
}

const RouteOptionsContent = ({
  quotes,
  selectedQuote,
  tokenOut,
  isLoading,
  upToLarge,
  onSelect,
  onDismiss,
  routeBadge,
}: RouteOptionsContentProps) => {
  const prefersReducedMotion = useReducedMotion()
  const FeeTooltip = upToLarge ? ClickTooltip : MouseoverTooltip
  const bestReturnQuote = sortQuotesByNetOutput(quotes)[0]
  const fastestQuoteIndex = quotes.reduce((fastestIndex, { quote }, index) => {
    if (!Number.isFinite(quote.timeEstimate) || quote.timeEstimate < 0) return fastestIndex
    if (fastestIndex === -1) return index

    const fastestQuote = quotes[fastestIndex].quote
    return quote.timeEstimate < fastestQuote.timeEstimate ||
      (quote.timeEstimate === fastestQuote.timeEstimate && quote.outputAmount > fastestQuote.outputAmount)
      ? index
      : fastestIndex
  }, -1)

  return (
    <Stack className="size-full gap-3 text-text">
      <Stack className="shrink-0 gap-3">
        <HStack className="justify-between">
          <span className="font-medium">{t`Choose your Route`}</span>
          {upToLarge && <CloseIcon onClick={onDismiss} />}
        </HStack>
      </Stack>
      <Stack className="min-h-0 flex-1 overflow-y-scroll">
        <MotionScrollableWithSignal
          layoutScroll
          data-open="true"
          showArrow
          className="flex max-h-full flex-col gap-3 overflow-y-auto"
        >
          <AnimatePresence initial={false}>
            {quotes.map((quote, index) => {
              const additionalFee =
                (quote.quote.additionalFeeUsd ?? 0) > 0
                  ? formatDisplayNumber(quote.quote.additionalFeeUsd, { style: 'currency', significantDigits: 3 })
                  : quote.quote.additionalFeeAmount

              return (
                <QuoteRow
                  key={routeKey(quote)}
                  layout={prefersReducedMotion ? false : 'position'}
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  selected={(selectedQuote ? routeKey(selectedQuote) : null) === routeKey(quote)}
                  role="button"
                  onClick={() => onSelect(quote)}
                >
                  <Stack className="gap-2">
                    <HStack className="flex-wrap items-center justify-between gap-2">
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

                      {routeBadge ? (
                        routeBadge(quote, index)
                      ) : (
                        <HStack className="shrink-0 items-center gap-1">
                          {quote === bestReturnQuote && (
                            <div className="shrink-0 rounded-full bg-darkGreen px-2 py-1 text-xs font-medium text-white">
                              {t`Best Return`}
                            </div>
                          )}
                          {!quote.quote.quoteParams.gasDrop && index === fastestQuoteIndex && (
                            <div className="shrink-0 rounded-full bg-blue px-2 py-1 text-xs font-medium text-white">
                              {t`Fastest`}
                            </div>
                          )}
                        </HStack>
                      )}
                    </HStack>
                    <HStack className="items-center justify-between gap-2 text-sm text-subText">
                      <HStack className="min-w-0 items-center gap-3">
                        <QuoteProviderName
                          quote={quote}
                          iconBefore={
                            quote.quote.gasDrop && (
                              <span className="flex shrink-0 text-primary" aria-label={t`Gas Drop`}>
                                <GasStation size={16} />
                              </span>
                            )
                          }
                        />
                        {!!additionalFee && (
                          <HStack
                            className="items-center gap-1 whitespace-nowrap"
                            onClick={event => event.stopPropagation()}
                          >
                            <FeeTooltip
                              text={
                                <Trans>
                                  Additional fee charged by <br />
                                  {quote.adapter.getName()}
                                </Trans>
                              }
                              placement="bottom-start"
                              width="max-content"
                              maxWidth="calc(100vw - 32px)"
                              style={{ zIndex: Z_INDEXS.MODAL + 1 }}
                            >
                              <span aria-label={t`Additional Fee`} className="flex items-center">
                                <FeeIcon width={16} height={16} className="shrink-0" aria-hidden="true" />
                              </span>
                            </FeeTooltip>
                            <span>{additionalFee}</span>
                          </HStack>
                        )}
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
          </AnimatePresence>
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
        </MotionScrollableWithSignal>
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

export const CrossChainQuoteSelector = (props: CrossChainQuoteSelectorProps) => {
  const { loading, allLoading, disable } = useCrossChainSwap()
  return <CrossChainQuoteSelectorView {...props} isLoading={!disable && (loading || allLoading)} />
}

type ViewProps = CrossChainQuoteSelectorProps & {
  isLoading: boolean
  routeBadge?: (quote: Quote, index: number) => ReactNode
}

/** Owns route visibility and commits selection before closing the panel. */
export const CrossChainQuoteSelectorView = ({
  quotes,
  selectedQuote,
  tokenOut,
  onChange,
  isLoading,
  routeBadge,
}: ViewProps) => {
  const { trackingHandler } = useTracking()
  const [show, setShow] = useState(false)

  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const handleSelect = (quote: Quote) => {
    onChange(quote)
    setShow(false)
    if (routeKey(quote) !== (selectedQuote ? routeKey(selectedQuote) : null)) {
      trackingHandler(TRACKING_EVENT_TYPE.CC_ROUTE_VIEWED, {
        routing_source: quote.adapter.getName(),
        amount_out: quote.quote.formattedOutputAmount,
        amount_out_usd: quote.quote.outputUsd,
        time_estimate: quote.quote.timeEstimate,
        from_chain: quote.quote.quoteParams.fromChain,
        to_chain: quote.quote.quoteParams.toChain,
      })
    }
  }

  const contentProps = {
    quotes,
    selectedQuote,
    tokenOut,
    isLoading,
    routeBadge,
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
        width: '425px',
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
