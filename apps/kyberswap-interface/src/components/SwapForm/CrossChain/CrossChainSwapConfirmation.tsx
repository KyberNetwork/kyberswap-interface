import { Trans, t } from '@lingui/macro'
import { formatUnits } from 'viem'

import { ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import { HStack, Stack } from 'components/Stack'
import {
  CrossChainPriceImpactWarning,
  CrossChainQuoteSummaryRows,
} from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteSummary'
import { getQuoteWarning } from 'components/SwapForm/CrossChain/hooks/getQuoteWarning'
import type { ReviewedQuote } from 'components/SwapForm/CrossChain/hooks/useQuoteSession'
import { SwapReviewAmountCard, SwapReviewHeader } from 'components/SwapForm/SwapModal/SwapReviewLayout'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { QuoteProviderName } from 'pages/Swap/crossChain/components/QuoteProviderName'
import { isEvmCurrency } from 'pages/Swap/crossChain/quote/utils'
import { getNetworkInfo } from 'pages/Swap/crossChain/utils'
import { ExternalLink } from 'theme'
import { Chain, Currency, NonEvmChain, isEvmChain } from 'types/crossChain'
import { shortenHash } from 'utils/address'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'

type CrossChainReviewAmountProps = {
  chainId: Chain
  currency: Currency
  amount: string
  amountUsd: number
  label: string
  isOutput?: boolean
}

const CrossChainReviewAmount = ({
  chainId,
  currency,
  amountUsd,
  amount,
  label,
  isOutput,
}: CrossChainReviewAmountProps) => {
  const { name, icon } = getNetworkInfo(chainId)

  return (
    <SwapReviewAmountCard
      label={label}
      isOutput={isOutput}
      headerAside={
        <HStack className="items-center gap-1">
          <img src={icon} alt={chainId.toString()} width={16} height={16} className="shrink-0 rounded-full" />
          <span>{name}</span>
        </HStack>
      }
    >
      <span className="min-w-0 flex-1 truncate text-2xl font-medium">
        {formatDisplayNumber(amount, { significantDigits: 8 })}
      </span>
      <HStack className="shrink-0 items-center gap-2 text-subText">
        <span className="text-sm font-medium">
          ~{formatDisplayNumber(amountUsd, { style: 'currency', significantDigits: 4 })}
        </span>
        {isEvmChain(chainId) && isEvmCurrency(currency) ? (
          <CurrencyLogo currency={currency} size="24px" />
        ) : (
          <img src={'logo' in currency ? currency.logo : undefined} width={24} height={24} alt="" />
        )}
        <span className="text-xl font-medium">{currency?.symbol}</span>
      </HStack>
    </SwapReviewAmountCard>
  )
}

type CrossChainSwapConfirmationProps = {
  quote: ReviewedQuote | null
  isOpen: boolean
  isSubmitting: boolean
  txHash: string
  txError: string
  onConfirm?: () => void
  onDismiss?: () => void
}

export const CrossChainSwapConfirmation = ({
  quote: reviewedQuote,
  isOpen,
  isSubmitting,
  txHash,
  txError,
  onConfirm,
  onDismiss,
}: CrossChainSwapConfirmationProps) => {
  if (!reviewedQuote) return null

  const {
    fromChain: fromChainId,
    toChain: toChainId,
    fromToken: currencyIn,
    toToken: currencyOut,
    amount: amountInWei,
    recipient,
    slippage,
  } = reviewedQuote.quote.quoteParams
  const amount = formatUnits(BigInt(amountInWei), currencyIn.decimals)

  const warning = getQuoteWarning({
    selectedQuote: reviewedQuote,
    category: reviewedQuote.category,
    isEvmPair: isEvmChain(fromChainId) && isEvmChain(toChainId),
    slippage,
  })

  return (
    <TransactionConfirmationModal
      isOpen={isSubmitting || isOpen}
      onDismiss={() => onDismiss?.()}
      hash={txHash}
      scanLink={
        fromChainId === NonEvmChain.Solana
          ? `https://solscan.io/tx/${txHash}`
          : fromChainId === NonEvmChain.Near
          ? `https://nearblocks.io/address/${txHash}`
          : fromChainId === NonEvmChain.Bitcoin
          ? `https://mempool.space/tx/${txHash}`
          : getEtherscanLink(fromChainId, txHash, 'transaction')
      }
      attemptingTxn={isSubmitting}
      pendingText={
        <Trans>
          Swapping {currencyIn?.symbol ?? ''} for {currencyOut?.symbol ?? ''}
        </Trans>
      }
      content={() => {
        if (txError) {
          return <TransactionErrorContent message={txError} onDismiss={() => onDismiss?.()} />
        }

        return (
          <Stack className="w-full gap-4 p-4 sm:p-5">
            <SwapReviewHeader
              title={t`Confirm Swap Details`}
              subtitle={t`Please review the details of your swap`}
              onDismiss={() => onDismiss?.()}
            />
            <Stack className="min-w-0 gap-2">
              <CrossChainReviewAmount
                label={t`Input Amount`}
                chainId={fromChainId}
                currency={currencyIn}
                amount={amount}
                amountUsd={reviewedQuote.quote.inputUsd}
              />
              <CrossChainReviewAmount
                label={t`Output Amount`}
                isOutput
                chainId={toChainId}
                currency={currencyOut}
                amount={reviewedQuote.quote.formattedOutputAmount}
                amountUsd={reviewedQuote.quote.outputUsd}
              />
            </Stack>
            <HStack className="min-h-5 flex-wrap items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3">
              <span className="text-xs text-subText">{t`Recipient`}</span>
              <HStack className="min-w-0 items-center gap-1 text-xs font-medium text-subText">
                <ExternalLink
                  className="min-w-0 break-all text-text no-underline"
                  href={
                    toChainId === NonEvmChain.Solana
                      ? `https://solscan.io/account/${recipient}`
                      : toChainId === NonEvmChain.Near
                      ? `https://nearblocks.io/address/${recipient}`
                      : toChainId === NonEvmChain.Bitcoin
                      ? `https://mempool.space/address/${recipient}`
                      : getEtherscanLink(toChainId, recipient, 'address')
                  }
                >
                  {recipient.includes('.near') ? recipient : shortenHash(recipient)} ↗
                </ExternalLink>
                <CopyHelper toCopy={recipient} />
              </HStack>
            </HStack>
            <Stack className="gap-2 rounded-2xl border border-border px-4 py-3 text-xs">
              <CrossChainQuoteSummaryRows
                quote={reviewedQuote}
                tokenOut={currencyOut}
                slippage={slippage}
                warning={warning}
                full
              />
            </Stack>

            <CrossChainPriceImpactWarning warning={warning} />

            <span className="flex items-center gap-1 text-xs italic text-gray">
              <span>
                <Trans>Routed via</Trans>
              </span>
              <QuoteProviderName quote={reviewedQuote} />
            </span>

            <ButtonPrimary disabled={isSubmitting} onClick={onConfirm}>{t`Confirm Swap`}</ButtonPrimary>
          </Stack>
        )
      }}
    />
  )
}
