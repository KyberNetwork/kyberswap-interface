import { ChainId, Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { ArrowDown } from 'react-feather'
import { formatUnits } from 'viem'

import { ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { NETWORKS_INFO } from 'constants/networks'
import { Chain, Currency, NonEvmChain, NonEvmChainInfo, isEvmChain } from 'pages/CrossChainSwap/adapters/types'
import { PiWarning } from 'pages/Swap/components/crossChain/PiWarning'
import { QuoteProviderName } from 'pages/Swap/components/crossChain/QuoteProviderName'
import { Summary } from 'pages/Swap/components/crossChain/Summary'
import { getQuoteWarning } from 'pages/Swap/hooks/crossChain/getQuoteWarning'
import { useCrossChainExecution } from 'pages/Swap/hooks/crossChain/useCrossChainExecution'
import type { ReviewedQuote } from 'pages/Swap/hooks/crossChain/useCrossChainQuote'
import { CloseIcon, ExternalLink } from 'theme'
import { shortenHash } from 'utils/address'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'

type TokenBoxInfoProps = {
  chainId: Chain
  currency: Currency
  amount: string
  usdValue: number
  title: string
}

const TokenBoxInfo = ({ chainId, currency, usdValue, amount, title }: TokenBoxInfoProps) => {
  const { name, icon } = isEvmChain(chainId)
    ? NETWORKS_INFO[chainId as ChainId]
    : NonEvmChainInfo[chainId as NonEvmChain]
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border p-3">
      <div className="flex justify-between text-xs font-medium text-subText">
        <span>{title}</span>
        <div className="flex items-center gap-1">
          <img src={icon} alt={chainId.toString()} width={16} height={16} style={{ borderRadius: '50%' }} />
          <span>{name}</span>
        </div>
      </div>
      <div className="flex justify-between text-xl font-medium">
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
  quote: ReviewedQuote | null
  isOpen: boolean
  onDismiss?: () => void
}

export const ConfirmationPopup = ({ quote: selectedQuote, isOpen, onDismiss }: ConfirmationPopupProps) => {
  const { submittingTx, txHash, txError, handleSwap, resetExecution } = useCrossChainExecution(selectedQuote)
  if (!selectedQuote) return null
  const {
    fromChain: fromChainId,
    toChain: toChainId,
    fromToken: currencyIn,
    toToken: currencyOut,
    amount: amountInWei,
    recipient,
    slippage,
  } = selectedQuote.quote.quoteParams
  const amount = formatUnits(BigInt(amountInWei), currencyIn.decimals)

  const warning = getQuoteWarning({
    selectedQuote,
    category: selectedQuote.category,
    isEvmPair: isEvmChain(fromChainId) && isEvmChain(toChainId),
    slippage,
  })

  const dismiss = () => {
    resetExecution()
    onDismiss?.()
  }

  return (
    <TransactionConfirmationModal
      isOpen={submittingTx || isOpen}
      onDismiss={dismiss}
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
      attemptingTxn={submittingTx}
      pendingText={
        <Trans>
          Swapping {currencyIn?.symbol ?? ''} for {currencyOut?.symbol ?? ''}
        </Trans>
      }
      content={() => {
        if (txError) {
          return <TransactionErrorContent message={txError} onDismiss={dismiss} />
        }
        return (
          <div className="flex w-full flex-col gap-4 p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xl font-medium">{t`Confirm Swap Details`}</span>
                <CloseIcon onClick={dismiss} />
              </div>
              <span className="text-xs text-subText">{t`Please review the details of your swap`}</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <TokenBoxInfo
                  title={t`Input Amount`}
                  chainId={fromChainId}
                  currency={currencyIn}
                  amount={amount}
                  usdValue={selectedQuote.quote.inputUsd}
                />
                <div aria-hidden className="absolute inset-x-0 -bottom-4 z-[1] flex justify-center">
                  <div className="flex size-5 items-center justify-center rounded-full border border-border bg-tabActive p-0.5 text-subText">
                    <ArrowDown />
                  </div>
                </div>
              </div>
              <TokenBoxInfo
                title={t`Output Amount`}
                chainId={toChainId}
                currency={currencyOut}
                amount={selectedQuote.quote.formattedOutputAmount}
                usdValue={selectedQuote.quote.outputUsd}
              />
            </div>
            <div className="flex justify-between rounded-2xl border border-border p-3">
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
            <Summary quote={selectedQuote} tokenOut={currencyOut} slippage={slippage} warning={warning} full />

            <PiWarning warning={warning} />

            <span className="flex items-center gap-1 text-xs italic text-gray">
              <span>
                <Trans>Routed via</Trans>
              </span>
              <QuoteProviderName quote={selectedQuote} />
            </span>

            <ButtonPrimary disabled={submittingTx} onClick={handleSwap}>{t`Confirm Swap`}</ButtonPrimary>
          </div>
        )
      }}
    />
  )
}
