import { ChainId, CurrencyAmount, Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, VersionedTransaction } from '@solana/web3.js'
import { useState } from 'react'
import { ArrowDown } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useLazyCheckBlackjackQuery } from 'services/blackjack'
import { formatUnits } from 'viem'

import { ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import { getTipLinkAttribution } from 'components/TipLinkGeneratorModal/shared'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { ETHER_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useGatedWalletClient } from 'hooks/useGatedWalletClient'
import useTracking, { CROSS_CHAIN_MIXPANEL_TYPE, TRACKING_EVENT_TYPE, useCrossChainMixpanel } from 'hooks/useTracking'
import { Chain, Currency, NonEvmChain, NonEvmChainInfo } from 'pages/CrossChainSwap/adapters'
import { adaptRelaySolanaWallet } from 'pages/CrossChainSwap/adapters/RelayAdapter/relaySolanaWallet'
import { PiWarning } from 'pages/CrossChainSwap/components/PiWarning'
import { QuoteProviderName } from 'pages/CrossChainSwap/components/QuoteProviderName'
import { Summary } from 'pages/CrossChainSwap/components/Summary'
import { useCrossChainSwap } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { useRestoreMyNearWalletPendingTransaction } from 'pages/CrossChainSwap/hooks/useRestoreMyNearWalletPendingTransaction'
import { getChainName } from 'pages/CrossChainSwap/utils'
import { useCrossChainTransactions } from 'state/crossChainSwap'
import { CloseIcon, ExternalLink } from 'theme'
import { getEtherscanLink, isEvmChain, shortenHash } from 'utils'
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

export const ConfirmationPopup = ({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) => {
  const { crossChainMixpanelHandler } = useCrossChainMixpanel()
  const { trackingHandler } = useTracking()
  const { data: walletClient } = useGatedWalletClient()
  const {
    selectedQuote,
    currencyIn,
    currencyOut,
    amountInWei,
    fromChainId,
    toChainId,
    warning,
    recipient,
    sender,
    receiver,
  } = useCrossChainSwap()

  const [searchParams] = useSearchParams()
  const [submittingTx, setSubmittingTx] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [txError, setTxError] = useState('')
  const [transactions, setTransactions] = useCrossChainTransactions()

  useRestoreMyNearWalletPendingTransaction()

  const nearWallet = useWalletSelector()
  const solanaWallet = useWallet()
  const { walletInfo, availableWallets } = useBitcoinWallet()

  const [checkBlackjack] = useLazyCheckBlackjackQuery()

  const { publicKey: solanaAddress, sendTransaction } = solanaWallet
  const { connection } = useConnection()

  const sendBtcFn = async (params: { recipient: string; amount: string | number }) => {
    const feeRate = await fetch('https://mempool.space/api/v1/fees/recommended').then(res => res.json())

    const selectedWallet = availableWallets.find(item => item.type === walletInfo.walletType)
    if (!selectedWallet) throw new Error('Not connected wallet')
    return selectedWallet.sendBitcoin({
      ...params,
      sender: walletInfo?.address || undefined,
      ...(feeRate?.fastestFee
        ? {
            options: { feeRate: feeRate.fastestFee * 1.2 },
          }
        : {}),
    })
  }

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
    if (isEvmChain(fromChainId) && !walletClient) return
    const adaptedWallet = adaptRelaySolanaWallet(
      solanaAddress?.toString() || '1nc1nerator11111111111111111111111111111111',
      792703809, //chain id that Relay uses to identify solana
      connection,
      async (transaction, options) => {
        try {
          // Ensure transaction is properly formatted
          if (transaction instanceof VersionedTransaction || transaction instanceof Transaction) {
            const signature = await sendTransaction(transaction, connection, options)
            return { signature }
          } else {
            throw new Error('Invalid transaction type')
          }
        } catch (error) {
          console.error('Transaction sending failed:', error)
          throw error
        }
      },
    )

    setSubmittingTx(true)

    if (isEvmChain(fromChainId)) {
      const blackjackRes = await checkBlackjack(sender)
      if (blackjackRes?.data?.blacklisted) {
        setSubmittingTx(false)
        setTxError('There was an error with your transaction.')
        return
      }
    }

    const res = await selectedQuote.adapter
      .executeSwap(
        selectedQuote,
        fromChainId === 'solana'
          ? selectedQuote.adapter.getName() === 'Relay' // for backward compatibility
            ? adaptedWallet
            : (solanaWallet as any)
          : (walletClient as any),
        nearWallet,
        sendBtcFn,
        sendTransaction,
        connection,
      )
      .catch(e => {
        console.log(e)
        setTxError(e?.message)
        setSubmittingTx(false)
        trackingHandler(TRACKING_EVENT_TYPE.CC_SWAP_FAILED, {
          from_token: currencyIn?.symbol,
          to_token: currencyOut?.symbol,
          from_chain: fromChainId,
          from_chain_name: getChainName(fromChainId),
          to_chain: toChainId,
          to_chain_name: getChainName(toChainId),
          error_message: e?.message,
          routing_source: selectedQuote.adapter.getName(),
        })
      })

    if (
      res?.sourceTxHash === 'GasRefuel cancelled' ||
      res?.sourceTxHash === 'Rejected' ||
      res?.sourceTxHash?.includes('Not enough ETH for gas')
    ) {
      trackingHandler(TRACKING_EVENT_TYPE.CC_SWAP_FAILED, {
        from_token: currencyIn?.symbol,
        to_token: currencyOut?.symbol,
        from_chain: fromChainId,
        from_chain_name: getChainName(fromChainId),
        to_chain: toChainId,
        to_chain_name: getChainName(toChainId),
        error_message: res?.sourceTxHash,
        routing_source: selectedQuote.adapter.getName(),
      })
      setTxError(res?.sourceTxHash || '')
      setSubmittingTx(false)
      return
    }

    if (res) {
      // enrich tx with usd/fee/recipient for later use
      const enriched = {
        ...res,
        amountInUsd: selectedQuote.quote.inputUsd,
        amountOutUsd: selectedQuote.quote.outputUsd,
        platformFeePercent: selectedQuote.quote.platformFeePercent,
        recipient: receiver,
      }

      setTransactions([enriched, ...transactions])

      const swapDetails = {
        amount_in: amount,
        amount_in_usd: selectedQuote.quote.inputUsd,
        amount_out: selectedQuote.quote.outputAmount.toString(),
        amount_out_usd: selectedQuote.quote.outputUsd,
        currency: 'USD',
        fee_percent: selectedQuote.quote.platformFeePercent,
        from_chain: fromChainId,
        from_chain_name: getChainName(fromChainId),
        from_token:
          fromChainId === NonEvmChain.Bitcoin
            ? currencyIn.symbol
            : fromChainId === NonEvmChain.Solana
            ? (currencyIn as any).id
            : fromChainId === NonEvmChain.Near
            ? (currencyIn as any).assetId
            : (currencyIn as any)?.isNative
            ? ETHER_ADDRESS
            : (currencyIn as any)?.address || (currencyIn as any)?.wrapped?.address || currencyIn?.symbol,
        from_token_symbol: currencyIn?.symbol,
        from_token_decimals: currencyIn?.decimals,
        to_chain: toChainId,
        to_chain_name: getChainName(toChainId),
        to_token:
          toChainId === NonEvmChain.Bitcoin
            ? currencyOut.symbol
            : toChainId === NonEvmChain.Solana
            ? (currencyOut as any).id
            : toChainId === NonEvmChain.Near
            ? (currencyOut as any).assetId
            : (currencyOut as any)?.isNative
            ? ETHER_ADDRESS
            : (currencyOut as any)?.address || (currencyOut as any)?.wrapped?.address || currencyOut?.symbol,
        to_token_symbol: currencyOut?.symbol,
        to_token_decimals: currencyOut?.decimals,
        partner: selectedQuote.adapter.getName(),
        platform: 'KyberSwap Cross-Chain',
        source_tx_hash: res.sourceTxHash,
        target_tx_hash: undefined,
        recipient: receiver,
        sender,
        status: 'init',
        time: Date.now(),
        timestamp: Date.now(),
      }
      crossChainMixpanelHandler(CROSS_CHAIN_MIXPANEL_TYPE.CROSS_CHAIN_SWAP_INIT, swapDetails)
      trackingHandler(TRACKING_EVENT_TYPE.CC_SWAP_INITIATED, swapDetails)

      // Tip is not charged on cross-chain swaps — attribute referral volume at initiation
      // (completion fires from an off-page poller that has lost the tip-link URL context).
      const tipLink = getTipLinkAttribution(searchParams)
      if (tipLink) {
        trackingHandler(TRACKING_EVENT_TYPE.TIP_LINK_TRADE, {
          trade_type: 'cross_chain',
          trade_status: 'initiated',
          tip_charged: false,
          ...tipLink,
          input_token: currencyIn?.symbol,
          output_token: currencyOut?.symbol,
          pair: currencyIn?.symbol && currencyOut?.symbol ? `${currencyIn.symbol}/${currencyOut.symbol}` : undefined,
          chain: getChainName(fromChainId),
          from_chain: getChainName(fromChainId),
          to_chain: getChainName(toChainId),
          volume: selectedQuote.quote.inputUsd,
          tx_hash: res.sourceTxHash,
        })
      }
    }
    setTxHash(res?.sourceTxHash || '')
    setSubmittingTx(false)
  }

  const dismiss = () => {
    setSubmittingTx(false)
    onDismiss()
    setTxHash('')
    setSubmittingTx(false)
    setTxError('')
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
          <div className="flex w-full flex-col p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xl font-medium">{t`Confirm Swap Details`}</span>
              <CloseIcon onClick={onDismiss} />
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
            <Summary quote={selectedQuote} tokenOut={currencyOut} full />

            {warning?.priceImpaceInfo?.message && <div className="mt-4" />}
            <PiWarning />

            <span className="my-4 flex items-center text-xs italic text-gray">
              <span className="mr-1">
                <Trans>Routed via</Trans>
              </span>
              <QuoteProviderName quote={selectedQuote} />
            </span>

            <ButtonPrimary onClick={handleSwap}>{t`Confirm Swap`}</ButtonPrimary>
          </div>
        )
      }}
    />
  )
}
