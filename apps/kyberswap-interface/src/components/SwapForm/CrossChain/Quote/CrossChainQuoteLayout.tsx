import { Trans } from '@lingui/macro'
import type { ReactNode } from 'react'
import { ChevronDown } from 'react-feather'

import { ReactComponent as RecipientWalletIcon } from 'assets/svg/recipient_wallet.svg'
import { CrossChainQuoteSummaryRows } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteSummary'
import { CrossChainRoutesButton } from 'components/SwapForm/CrossChain/Quote/CrossChainRoutesButton'
import { QuoteDetails } from 'components/SwapForm/Quote/QuoteDetails'
import { SwapRate } from 'components/SwapForm/Quote/SwapRate'
import { useSlippageSettingByPage } from 'state/user/hooks'
import { formatSlippage } from 'utils/slippage'

/** Both the lazy fallback and live quote use the same flat control/rate/summary layout. */
export const CrossChainQuoteLayout = ({
  controls,
  rate,
  children,
}: {
  controls?: ReactNode
  rate: ReactNode
  children: ReactNode
}) => (
  <QuoteDetails>
    {controls}
    {rate}
    {children}
  </QuoteDetails>
)

/** Read preferences only; do not mount slippage effects or recipient/wallet logic before the engine is ready. */
export const PendingCrossChainQuoteDetails = ({ showRecipient = false }: { showRecipient?: boolean }) => {
  const { rawSlippage, isSlippageControlPinned } = useSlippageSettingByPage()
  const recipientToggle = showRecipient ? (
    <button
      type="button"
      disabled
      className="flex size-6 shrink-0 items-center justify-center rounded-full border-0 bg-subText/[0.08] p-0 text-subText"
    >
      <RecipientWalletIcon aria-hidden="true" />
    </button>
  ) : undefined

  return (
    <CrossChainQuoteLayout
      controls={
        isSlippageControlPinned ? (
          <div className="flex min-h-6 items-center justify-between gap-1 text-subText">
            <div className="flex items-center gap-1">
              <span className="border-b border-dotted border-border text-xs font-medium text-subText">
                <Trans>Max Slippage</Trans>:
              </span>
              <span className="text-sm font-medium leading-none text-text">{formatSlippage(rawSlippage)}</span>
              <ChevronDown size={14} />
            </div>
            {recipientToggle}
          </div>
        ) : (
          recipientToggle && <div className="flex justify-end">{recipientToggle}</div>
        )
      }
      rate={<SwapRate loading routes={<CrossChainRoutesButton disabled />} />}
    >
      <CrossChainQuoteSummaryRows loading slippage={rawSlippage} showSlippage={!isSlippageControlPinned} />
    </CrossChainQuoteLayout>
  )
}
