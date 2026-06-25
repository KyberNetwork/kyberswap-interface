import { t } from '@lingui/macro'
import { format } from 'date-fns'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useMedia } from 'react-use'
import { formatUnits } from 'viem'

import { ReactComponent as NoTransactionIcon } from 'assets/svg/no_transaction.svg'
import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import Pagination from 'components/Pagination'
import { ETHER_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import useTracking, { CROSS_CHAIN_MIXPANEL_TYPE, TRACKING_EVENT_TYPE, useCrossChainMixpanel } from 'hooks/useTracking'
import { NonEvmChain, NonEvmChainInfo } from 'pages/CrossChainSwap/adapters'
import { TokenLogoWithChain } from 'pages/CrossChainSwap/components/TokenLogoWithChain'
import { registry } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { getChainName } from 'pages/CrossChainSwap/utils'
import { useCrossChainTransactions } from 'state/crossChainSwap'
import { ExternalLinkIcon, MEDIA_WIDTHS } from 'theme'
import { getEtherscanLink, shortenHash } from 'utils'
import { cn } from 'utils/cn'
import { hexAlpha } from 'utils/colorAlpha'
import { formatDisplayNumber } from 'utils/numbers'

const PAGE_SIZE = 5

const TABLE_GRID = 'grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-3 px-4 py-3 text-xs font-medium'

export const TransactionHistory = () => {
  const { crossChainMixpanelHandler } = useCrossChainMixpanel()
  const { trackingHandler } = useTracking()
  const [transactions, setTransactions] = useCrossChainTransactions()

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  // Track ongoing API calls to prevent duplicates
  const ongoingCallsRef = useRef(new Set())
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pendingTxs = useMemo(() => {
    return transactions.filter(
      tx =>
        (!tx.targetTxHash || !tx.status || tx.status === 'Processing') &&
        tx.status !== 'Refunded' &&
        // hardcode to update status for a failed tx, if user checked again, we can remove this in next release
        (tx.sourceTxHash.toLowerCase() !== '0xb321c90b203b9641cc6b7039eade7a6d212a9e133b6817b593f4b9408ca55d87'
          ? tx.status !== 'Failed'
          : true),
    )
  }, [transactions])

  useEffect(() => {
    const checkTransactions = async () => {
      // Filter out transactions that are already being checked
      const txsToCheck = pendingTxs.filter(tx => !ongoingCallsRef.current.has(tx.id))

      if (txsToCheck.length === 0) return

      // Mark these transactions as being checked
      txsToCheck.forEach(tx => ongoingCallsRef.current.add(tx.id))

      try {
        const updatedTransactions = [...transactions]
        let hasUpdates = false

        // Use Promise.allSettled to handle individual failures gracefully
        const results = await Promise.allSettled(
          txsToCheck.map(async tx => {
            const adapter = registry.getAdapter(tx.adapter)
            if (!adapter) return null

            try {
              const result = await adapter.getTransactionStatus(tx)
              const { txHash, status, amountOut } = result || {
                txHash: '',
                status: 'Processing',
                amountOut: undefined,
              }

              // Only update if we have meaningful changes
              // Check if actual amountOut is available and different from estimated
              const hasActualAmountOut = amountOut && amountOut !== '0' && amountOut !== tx.outputAmount
              if ((txHash && txHash !== tx.targetTxHash) || status !== tx.status || hasActualAmountOut) {
                const txIndex = updatedTransactions.findIndex(t => t.id === tx.id)

                if (txIndex !== -1) {
                  const oldStatus = updatedTransactions[txIndex].status
                  updatedTransactions[txIndex] = {
                    ...updatedTransactions[txIndex],
                    targetTxHash: txHash || updatedTransactions[txIndex].targetTxHash,
                    status: status || updatedTransactions[txIndex].status,
                    // Update outputAmount with actual amount if available
                    // Store original outputAmount as estimatedAmountOut for debugging (in local storage)
                    ...(hasActualAmountOut && {
                      outputAmount: amountOut,
                      estimatedAmountOut:
                        updatedTransactions[txIndex].estimatedAmountOut || updatedTransactions[txIndex].outputAmount,
                    }),
                  }

                  // Fire specific GA events for success/failure
                  if (status && status !== oldStatus) {
                    const swapDetails = {
                      amount_in: tx.inputAmount,
                      amount_in_usd: tx.amountInUsd,
                      amount_out: tx.outputAmount,
                      amount_out_usd: tx.amountOutUsd,
                      currency: 'USD',
                      fee_percent: tx.platformFeePercent,
                      from_chain: tx.sourceChain,
                      from_chain_name: getChainName(tx.sourceChain),
                      from_token:
                        tx.sourceChain === NonEvmChain.Bitcoin
                          ? tx.sourceToken.symbol
                          : tx.sourceChain === NonEvmChain.Solana
                          ? (tx.sourceToken as any).id
                          : tx.sourceChain === NonEvmChain.Near
                          ? (tx.sourceToken as any).assetId
                          : (tx.sourceToken as any)?.isNative
                          ? ETHER_ADDRESS
                          : (tx.sourceToken as any)?.address ||
                            (tx.sourceToken as any)?.wrapped?.address ||
                            tx.sourceToken?.symbol,
                      from_token_symbol: tx.sourceToken?.symbol,
                      from_token_decimals: tx.sourceToken?.decimals,
                      to_chain: tx.targetChain,
                      to_chain_name: getChainName(tx.targetChain),
                      to_token:
                        tx.targetChain === NonEvmChain.Bitcoin
                          ? tx.targetToken.symbol
                          : tx.targetChain === NonEvmChain.Solana
                          ? (tx.targetToken as any).id
                          : tx.targetChain === NonEvmChain.Near
                          ? (tx.targetToken as any).assetId
                          : (tx.targetToken as any)?.isNative
                          ? ETHER_ADDRESS
                          : (tx.targetToken as any)?.address ||
                            (tx.targetToken as any)?.wrapped?.address ||
                            tx.targetToken?.symbol,
                      to_token_symbol: tx.targetToken?.symbol,
                      to_token_decimals: tx.targetToken?.decimals,
                      partner: tx.adapter,
                      platform: 'KyberSwap Cross-Chain',
                      source_tx_hash: tx.sourceTxHash,
                      target_tx_hash: txHash || tx.targetTxHash,
                      recipient: tx.recipient,
                      sender: tx.sender,
                      status: status,
                      time: Date.now(),
                      timestamp: tx.timestamp,
                    }

                    if (status === 'Success') {
                      crossChainMixpanelHandler(CROSS_CHAIN_MIXPANEL_TYPE.CROSS_CHAIN_SWAP_SUCCESS, {
                        ...swapDetails,
                        status: 'succeed',
                      })
                      trackingHandler(TRACKING_EVENT_TYPE.CC_SWAP_COMPLETED, {
                        ...swapDetails,
                        status: 'succeed',
                      })
                    } else if (status === 'Failed') {
                      crossChainMixpanelHandler(CROSS_CHAIN_MIXPANEL_TYPE.CROSS_CHAIN_SWAP_FAILED, {
                        ...swapDetails,
                        status: 'failed',
                      })
                      trackingHandler(TRACKING_EVENT_TYPE.CC_SWAP_FAILED, {
                        ...swapDetails,
                        status: 'failed',
                      })
                    }
                  }

                  hasUpdates = true
                }
              }
              return { success: true, txId: tx.id }
            } catch (error) {
              console.error(`Failed to check status for transaction ${tx.id}:`, error)
              return { success: false, txId: tx.id, error }
            }
          }),
        )

        // Remove transaction IDs from ongoing calls set
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value?.txId) {
            ongoingCallsRef.current.delete(result.value.txId)
          } else if (result.status === 'rejected') {
            // Handle rejected promises - you might want to extract txId differently
            console.error('Promise rejected:', result.reason)
          }
        })

        // Update transactions if we have changes
        if (hasUpdates) {
          setTransactions(updatedTransactions)
        }
      } catch (error) {
        console.error('Error in checkTransactions:', error)
        // Clear ongoing calls in case of unexpected error
        txsToCheck.forEach(tx => ongoingCallsRef.current.delete(tx.id))
      }
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Only run if we have pending transactions
    if (pendingTxs.length > 0) {
      // Initial check
      checkTransactions()

      // Set up interval for periodic checks
      intervalRef.current = setInterval(checkTransactions, 10_000) // Check every 10 seconds
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [pendingTxs, transactions, setTransactions, crossChainMixpanelHandler, trackingHandler])

  const theme = useTheme()

  const [currentPage, setCurrentPage] = useState(1)

  return (
    <>
      {upToSmall ? (
        <span className="text-sm font-medium text-subText">{t`HISTORY`}</span>
      ) : (
        <div className={cn(TABLE_GRID, 'rounded-t-2xl bg-background text-subText')}>
          <span>{t`CREATED`}</span>
          <span>{t`STATUS`}</span>
          <span>{t`ROUTE`}</span>
          <span>{t`AMOUNT`}</span>
          <span className="text-right">{t`ACTIONS`}</span>
        </div>
      )}
      {transactions.length === 0 && (
        <div className="flex flex-col items-center">
          <NoTransactionIcon width="120px" />
          <span className="p-9 text-center italic text-subText">{t`No historical data available.`}</span>
        </div>
      )}
      {transactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(tx => {
        const sourceChainLogo = [NonEvmChain.Near, NonEvmChain.Bitcoin, NonEvmChain.Solana].includes(tx.sourceChain)
          ? NonEvmChainInfo[tx.sourceChain].icon
          : (NETWORKS_INFO as any)[tx.sourceChain]?.icon
        const targetChainLogo = [NonEvmChain.Near, NonEvmChain.Bitcoin, NonEvmChain.Solana].includes(tx.targetChain)
          ? NonEvmChainInfo[tx.targetChain].icon
          : (NETWORKS_INFO as any)[tx.targetChain]?.icon

        const time = (
          <div>
            <div className="flex items-center gap-1">
              <img
                src={registry.getAdapter(tx.adapter)?.getIcon()}
                style={{ borderRadius: '50%' }}
                width={16}
                height={16}
                alt=""
              />
              <span>{format(new Date(tx.timestamp), 'dd/MM/yyyy')}</span>
              <span className="text-subText">{format(new Date(tx.timestamp), 'HH:mm:ss')}</span>
            </div>
            {tx.sender && (
              <div className="mt-2 flex items-center gap-1 text-sm text-blue">
                <span className="text-subText">{t`Sender:`}</span>{' '}
                {tx.sender.includes('.near') ? tx.sender : shortenHash(tx.sender)}
                <CopyHelper toCopy={tx.sender} />
              </div>
            )}
          </div>
        )
        const statusLabel =
          tx.status === 'Success'
            ? t`Success`
            : tx.status === 'Failed'
            ? t`Failed`
            : tx.status === 'Refunded'
            ? t`Refunded`
            : t`Processing`
        const statusColor = tx.status === 'Success' ? theme.primary : tx.status === 'Failed' ? theme.red : theme.warning
        const status = (
          <div
            className="flex size-fit items-center rounded-full px-2 py-0.5 text-xs"
            style={{
              backgroundColor: hexAlpha(statusColor, 0.2),
              color: statusColor,
            }}
          >
            {tx.status ? statusLabel : t`Processing`}
          </div>
        )
        const fromto = (
          <div className="flex items-center gap-1 text-subText">
            <img src={sourceChainLogo} alt="" width={16} height={16} />
            <ChevronRight size={14} />
            <img src={targetChainLogo} alt="" width={16} height={16} />
          </div>
        )

        const amount = (
          <div style={{ zIndex: -1 }}>
            <div className="flex items-center gap-1 text-xs text-subText">
              <TokenLogoWithChain chainId={tx.sourceChain as any} currency={tx.sourceToken} />-
              {formatDisplayNumber(formatUnits(BigInt(tx.inputAmount), tx.sourceToken.decimals), {
                significantDigits: 6,
              })}{' '}
              {tx.sourceToken.symbol}
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-subText">
              <TokenLogoWithChain chainId={tx.targetChain as any} currency={tx.targetToken} />+
              {formatDisplayNumber(formatUnits(BigInt(tx.outputAmount), tx.targetToken.decimals), {
                significantDigits: 6,
              })}{' '}
              {tx.targetToken.symbol}
            </div>
          </div>
        )

        const sourceTx = (
          <div className="flex items-center gap-2">
            {shortenHash(tx.sourceTxHash)}
            <ExternalLinkIcon
              className="text-subText"
              size={14}
              href={
                tx.sourceChain === NonEvmChain.Near
                  ? `https://nearblocks.io/address/${tx.id}`
                  : tx.sourceChain === NonEvmChain.Bitcoin
                  ? `https://mempool.space/tx/${tx.sourceTxHash}`
                  : tx.sourceChain === NonEvmChain.Solana
                  ? `https://solscan.io/tx/${tx.sourceTxHash}`
                  : getEtherscanLink(tx.sourceChain as any, tx.sourceTxHash, 'transaction')
              }
            />
          </div>
        )
        const fill = tx.targetTxHash ? (
          <div className="flex items-center gap-2">
            {shortenHash(tx.targetTxHash)}
            <ExternalLinkIcon
              className="text-subText"
              size={14}
              href={
                tx.adapter.toLowerCase() === 'debridge'
                  ? `https://app.debridge.finance/order?orderId=${tx.targetTxHash}`
                  : tx.targetChain === NonEvmChain.Near
                  ? `https://nearblocks.io/txns/${tx.targetTxHash}`
                  : tx.targetChain === NonEvmChain.Bitcoin
                  ? `https://mempool.space/tx/${tx.targetTxHash}`
                  : tx.targetChain === NonEvmChain.Solana
                  ? `https://solscan.io/tx/${tx.targetTxHash}`
                  : getEtherscanLink(tx.targetChain as any, tx.targetTxHash, 'transaction')
              }
            />
          </div>
        ) : tx.status === 'Processing' ? (
          <Skeleton
            height="18px"
            width="98px"
            baseColor={theme.background}
            highlightColor={theme.buttonGray}
            borderRadius="1rem"
          />
        ) : (
          '--'
        )

        if (upToSmall) {
          return (
            <div key={tx.id} className="mt-6 flex flex-col gap-3">
              <div className="flex items-center justify-between px-3">
                {time} {status}
              </div>

              <div className="flex items-center justify-between px-3">
                {fromto} {amount}
              </div>

              <div className="flex items-center justify-between px-3 text-sm text-subText">
                <span className="text-text">{t`Deposit:`}</span>
                {sourceTx}
              </div>
              <div className="flex items-center justify-between px-3 text-sm text-subText">
                <span className="text-text">{t`Fill:`}</span>
                {fill}
              </div>
              <Divider></Divider>
            </div>
          )
        }

        return (
          <div key={tx.id} className={cn(TABLE_GRID, 'items-center border-b border-border text-sm text-text')}>
            {time}

            {status}

            {fromto}

            {amount}

            <div>
              <div className="flex justify-end gap-1 text-subText">
                <span className="text-text">{t`Deposit:`}</span>
                {sourceTx}
              </div>

              <div className="mt-2 flex justify-end gap-1 text-subText">
                <span className="text-text">{t`Fill:`}</span> {fill}
              </div>
            </div>
          </div>
        )
      })}
      <Pagination
        onPageChange={setCurrentPage}
        totalCount={transactions.length}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        haveBg={false}
        style={{ padding: '0', marginTop: '16px' }}
      />
    </>
  )
}
