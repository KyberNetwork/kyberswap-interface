import { ChainId, CurrencyAmount, Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { ArrowDown } from 'react-feather'
import { formatUnits } from 'viem'

import { ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { NETWORKS_INFO } from 'constants/networks'
import { Chain, Currency, NonEvmChain, NonEvmChainInfo } from 'pages/CrossChainSwap/adapters'
import { isEvmChain } from 'pages/CrossChainSwap/adapters/types'
import { GasDropTransactionLine } from 'pages/CrossChainSwap/components/GasDrop'
import { PiWarning } from 'pages/CrossChainSwap/components/PiWarning'
import { QuoteProviderName } from 'pages/CrossChainSwap/components/QuoteProviderName'
import { Summary } from 'pages/CrossChainSwap/components/Summary'
import { useCrossChainExecution } from 'pages/CrossChainSwap/hooks/useCrossChainExecution'
import { useCrossChainSwap } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { useGasDropReview } from 'pages/CrossChainSwap/hooks/useGasDropReview'
import type { Quote } from 'pages/CrossChainSwap/registry'
import { isQuoteExecutable } from 'pages/CrossChainSwap/utils'
import { useCrossChainTransactions } from 'state/crossChainSwap'
import { CloseIcon, ExternalLink } from 'theme'
import { shortenHash } from 'utils/address'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'

const TokenBoxInfo = ({
  chainId,
  currency,
  usdValue,
  amount,
  title,
}: {
  chainId: Chain
  currency?: Currency
  amount: string
  usdValue: number
  title: string
}) => {
  const { name, icon } = isEvmChain(chainId)
    ? NETWORKS_INFO[chainId as ChainId]
    : NonEvmChainInfo[chainId as NonEvmChain]
  return (
    <div className="rounded-2xl border border-border p-3">
      <div className="mb-2 flex justify-between text-xs font-medium text-subText">
        <span>{title}</span>
        <div className="flex items-center gap-1">
          <img src={icon} alt={chainId.toString()} width={16} height={16} style={{ borderRadius: '50%' }} />
          <span>{name}</span>
        </div>
      </div>
      <div className="mb-2 flex justify-between text-xl font-medium">
        <span className="text-2xl">{formatDisplayNumber(amount, { significantDigits: 8 })}</span>
        <div className="flex items-center gap-1 text-subText">
          <span className="text-sm">~{formatDisplayNumber(usdValue, { style: 'currency', significantDigits: 4 })}</span>
          {isEvmChain(chainId) ? (
            <CurrencyLogo currency={currency as EvmCurrency} size="24px" />
          ) : (
            <img src={(currency as any).logo} width={24} height={24} alt="" />
          )}
          <span>{currency?.symbol}</span>
        </div>
      </div>
    </div>
  )
}

type ConfirmationPopupProps = {
  quote: Quote | null
  isOpen: boolean
  onDismiss?: () => void
}

export const ConfirmationPopup = ({ quote: initialQuote, isOpen, onDismiss }: ConfirmationPopupProps) => {
  const {
    currencyIn,
    currencyOut,
    amountInWei,
    fromChainId,
    toChainId,
    getQuotePriceImpactInfo,
    recipient,
    sender,
    receiver,
  } = useCrossChainSwap()

  const {
    submittingTx,
    txHash,
    txError,
    handleSwap: executeSwap,
    resetExecution,
  } = useCrossChainExecution(initialQuote, { syncWithBackend: false })
  const review = useGasDropReview(initialQuote, isOpen && !submittingTx && !txHash)
  const selectedQuote = review.quote
  const priceImpactInfo = getQuotePriceImpactInfo(selectedQuote)
  const transactions = useCrossChainTransactions()
  const [reviewError, setReviewError] = useState('')

  const inputAmount =
    isEvmChain(fromChainId) && currencyIn
      ? CurrencyAmount.fromRawAmount(currencyIn as EvmCurrency, amountInWei || '0')
      : undefined

  if (
    !selectedQuote ||
    !currencyIn ||
    !currencyOut ||
    !fromChainId ||
    !toChainId ||
    !amountInWei ||
    amountInWei === '0'
  )
    return null

  if (isEvmChain(fromChainId) && !inputAmount) return null

  const amount = inputAmount?.toExact() || formatUnits(BigInt(amountInWei), currencyIn.decimals)

  const handleSwap = async () => {
    if (review.refreshing || review.pending || review.error) return
    if (review.expired()) {
      await review.refresh()
      return
    }
    const params = selectedQuote.quote.quoteParams
    if (
      params.amount !== amountInWei ||
      params.fromChain !== fromChainId ||
      params.toChain !== toChainId ||
      params.fromToken !== currencyIn ||
      params.toToken !== currencyOut ||
      !isQuoteExecutable(selectedQuote, sender, receiver)
    ) {
      setReviewError(t`The route is outdated. Please refresh and try again.`)
      return
    }
    setReviewError('')
    await executeSwap(selectedQuote)
  }

  const submittedTransaction = transactions.find(tx => tx.sourceTxHash === txHash)

  const dismiss = () => {
    resetExecution()
    setReviewError('')
    onDismiss?.()
  }

  return (
    <TransactionConfirmationModal
      isOpen={submittingTx || isOpen}
      onDismiss={dismiss}
      hash={txHash}
      submittedDetails={
        submittedTransaction?.gasDrop ? (
          <div className="flex flex-col gap-2">
            <span className="text-sm">{submittedTransaction.status || t`Processing`}</span>
            <GasDropTransactionLine tx={submittedTransaction} />
          </div>
        ) : undefined
      }
      scanLink={
        fromChainId === NonEvmChain.Solana
          ? `https://solscan.io/tx/${txHash}`
          : fromChainId === NonEvmChain.Near
          ? `https://nearblocks.io/address/${txHash}`
          : fromChainId === NonEvmChain.Bitcoin
          ? `https://mempool.space/tx/${txHash}`
          : getEtherscanLink(fromChainId, txHash, 'transaction')
      }
      attemptingTxn={submittingTx}
      pendingText={
        <Trans>
          Swapping {currencyIn?.symbol ?? ''} for {currencyOut?.symbol ?? ''}
        </Trans>
      }
      content={() => {
        if (txError || reviewError) {
          return <TransactionErrorContent message={txError || reviewError} onDismiss={dismiss} />
        }
        return (
          <div className="flex w-full flex-col p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xl font-medium">{t`Confirm Swap Details`}</span>
              <CloseIcon onClick={dismiss} />
            </div>
            <span className="mb-4 text-xs text-subText">{t`Please review the details of your swap`}</span>
            <TokenBoxInfo
              title={t`Input Amount`}
              chainId={fromChainId}
              currency={currencyIn}
              amount={amount || ''}
              usdValue={selectedQuote?.quote.inputUsd || 0}
            />
            <div className="z-[1] -my-1 mx-auto flex size-5 items-center justify-center rounded-full border border-border bg-tabActive p-0.5 text-subText">
              <ArrowDown />
            </div>
            <TokenBoxInfo
              title={t`Output Amount`}
              chainId={toChainId}
              currency={currencyOut}
              amount={selectedQuote?.quote.formattedOutputAmount || ''}
              usdValue={selectedQuote?.quote.outputUsd || 0}
            />
            <div className="mt-4 flex justify-between rounded-2xl border border-border p-3">
              <span className="text-xs font-medium text-subText">{t`Recipient`}</span>
              <div className="flex items-center text-sm text-subText">
                <ExternalLink
                  className="text-text"
                  style={{ textDecoration: 'none' }}
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
              </div>
            </div>
            <div className="mt-4" />
            <Summary quote={selectedQuote} tokenOut={currencyOut} full refreshing={review.refreshing} />

            {priceImpactInfo?.message && <div className="mt-4" />}
            <PiWarning quote={selectedQuote} />

            <span className="my-4 flex items-center gap-1.5 text-xs italic text-gray">
              <span>
                <Trans>Routed via</Trans>
              </span>
              <QuoteProviderName quote={selectedQuote} />
            </span>

            {review.pending && (
              <div
                className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-warning-20 p-3 text-xs text-warning"
                role="alert"
              >
                <span>
                  {initialQuote?.quote.gasDrop && !selectedQuote.quote.gasDrop
                    ? t`Gas Drop is no longer available for this route`
                    : t`Quote updated. Please accept the new amounts.`}
                </span>
                <button type="button" className="font-medium underline" onClick={review.accept}>{t`Accept`}</button>
              </div>
            )}
            {review.error && (
              <div className="mb-3 text-xs text-warning" role="alert">
                {review.error} <button type="button" className="underline" onClick={review.refresh}>{t`Retry`}</button>
              </div>
            )}
            <ButtonPrimary disabled={review.refreshing || !!review.pending || !!review.error} onClick={handleSwap}>
              {review.refreshing ? t`Refreshing route` : t`Confirm Swap`}
            </ButtonPrimary>
          </div>
        )
      }}
    />
  )
}
