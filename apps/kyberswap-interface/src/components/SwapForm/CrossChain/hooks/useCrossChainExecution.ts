import { t } from '@lingui/macro'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, VersionedTransaction } from '@solana/web3.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLazyCheckBlackjackQuery } from 'services/blackjack'
import { formatUnits } from 'viem'

import { getTipLinkAttribution } from 'components/TipLinkGeneratorModal/shared'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useGatedWalletClient } from 'hooks/useGatedWalletClient'
import useTracking, { CROSS_CHAIN_MIXPANEL_TYPE, TRACKING_EVENT_TYPE, useCrossChainMixpanel } from 'hooks/useTracking'
import { adaptRelaySolanaWallet } from 'pages/CrossChainSwap/adapters/RelayAdapter/relaySolanaWallet'
import { NonEvmChain, isEvmChain } from 'pages/CrossChainSwap/adapters/types'
import { type Quote } from 'pages/CrossChainSwap/registry'
import { getSwapTrackingData } from 'pages/CrossChainSwap/tracking'
import { getChainName, isQuoteExecutable } from 'pages/CrossChainSwap/utils'
import { addTransaction } from 'state/crossChainSwap'
import { useAppDispatch } from 'state/hooks'

/** Owns execution, wallet interaction, transaction persistence and execution analytics. */
export const useCrossChainExecution = (selectedQuote: Quote | null) => {
  const { crossChainMixpanelHandler } = useCrossChainMixpanel()
  const { trackingHandler } = useTracking()
  const { data: walletClient } = useGatedWalletClient()

  const [searchParams] = useSearchParams()
  const [submittingTx, setSubmittingTx] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [txError, setTxError] = useState('')
  const activeSubmission = useRef<symbol | null>(null)
  const resetExecution = useCallback(() => {
    // Closing a review detaches its UI; an in-flight transaction still records its result in history.
    activeSubmission.current = null
    setTxHash('')
    setTxError('')
    setSubmittingTx(false)
  }, [])

  useEffect(() => {
    resetExecution()
    return () => {
      activeSubmission.current = null
    }
  }, [selectedQuote, resetExecution])
  const dispatch = useAppDispatch()

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

  const handleSwap = async () => {
    if (!selectedQuote || activeSubmission.current) return
    const {
      fromChain: fromChainId,
      toChain: toChainId,
      fromToken: currencyIn,
      toToken: currencyOut,
      amount: amountInWei,
      sender,
      recipient: receiver,
    } = selectedQuote.quote.quoteParams
    const amount = formatUnits(BigInt(amountInWei), currencyIn.decimals)
    if (isEvmChain(fromChainId) && !walletClient) {
      setTxError(t`The route is outdated. Please refresh and try again.`)
      return
    }

    const executionSender = isEvmChain(fromChainId)
      ? walletClient?.account.address
      : fromChainId === NonEvmChain.Near
      ? nearWallet.signedAccountId || undefined
      : fromChainId === NonEvmChain.Solana
      ? solanaAddress?.toString()
      : walletInfo.address || undefined
    if (!isQuoteExecutable(selectedQuote, executionSender, receiver)) {
      setTxError(t`The route is outdated. Please refresh and try again.`)
      return
    }

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

    const submission = Symbol('cross-chain submission')
    activeSubmission.current = submission
    const isCurrentSubmission = () => activeSubmission.current === submission
    setSubmittingTx(true)
    setTxError('')

    try {
      if (isEvmChain(fromChainId)) {
        const blackjackRes = await checkBlackjack(sender)
        if (blackjackRes?.data?.blacklisted) {
          if (isCurrentSubmission()) setTxError('There was an error with your transaction.')
          return
        }
      }

      const res = await selectedQuote.adapter.executeSwap(
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

      if (
        res?.sourceTxHash === 'GasRefuel cancelled' ||
        res?.sourceTxHash === 'Rejected' ||
        res?.sourceTxHash?.includes('Not enough ETH for gas')
      ) {
        throw new Error(res.sourceTxHash)
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

        dispatch(addTransaction(enriched))

        const swapDetails = {
          ...getSwapTrackingData({
            ...enriched,
            inputAmount: amount,
            outputAmount: selectedQuote.quote.outputAmount.toString(),
            sourceChain: fromChainId,
            targetChain: toChainId,
            sourceToken: currencyIn,
            targetToken: currencyOut,
            adapter: selectedQuote.adapter.getName(),
            sender,
          }),
          target_tx_hash: undefined,
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
      if (isCurrentSubmission()) setTxHash(res?.sourceTxHash || '')
    } catch (error) {
      const errorMessage =
        (typeof error === 'string' ? error : error?.message) || t`An error occurred. Refresh the page and try again.`
      if (isCurrentSubmission()) setTxError(errorMessage)
      trackingHandler(TRACKING_EVENT_TYPE.CC_SWAP_FAILED, {
        from_token: currencyIn.symbol,
        to_token: currencyOut.symbol,
        from_chain: fromChainId,
        from_chain_name: getChainName(fromChainId),
        to_chain: toChainId,
        to_chain_name: getChainName(toChainId),
        error_message: errorMessage,
        routing_source: selectedQuote.adapter.getName(),
      })
    } finally {
      if (isCurrentSubmission()) {
        activeSubmission.current = null
        setSubmittingTx(false)
      }
    }
  }

  return { submittingTx, txHash, txError, handleSwap, resetExecution }
}
