import { t } from '@lingui/macro'
import { format } from 'date-fns'
import { rgba } from 'polished'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'
import { formatUnits } from 'viem'

import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import Pagination from 'components/Pagination'
import { NETWORKS_INFO } from 'constants/networks'
import { CROSS_CHAIN_MIXPANEL_TYPE, useCrossChainMixpanel } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { NonEvmChain, NonEvmChainInfo } from 'pages/CrossChainSwap/adapters'
import { TokenLogoWithChain } from 'pages/CrossChainSwap/components/TokenLogoWithChain'
import { registry } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { useCrossChainTransactions } from 'state/crossChainSwap'
import { ExternalLinkIcon, MEDIA_WIDTHS } from 'theme'
import { getEtherscanLink, shortenHash } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import { getChainName } from '../utils'

const PAGE_SIZE = 5

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 2fr;
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
  background: ${({ theme }) => theme.background};
  margin-top: 10px;
  gap: 0.75rem;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  font-weight: 500;
  padding: 0.75rem 1rem;
`

const TableRow = styled(TableHeader)`
  margin-top: 0;
  background: transparent;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 14px;
  align-items: center;
  color: ${({ theme }) => theme.text};
`

export const TransactionHistory = () => {
  const { crossChainMixpanelHandler } = useCrossChainMixpanel()
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
              const { txHash, status } = result || {
                txHash: '',
                status: 'Processing',
              }

              // Only update if we have meaningful changes
              if ((txHash && txHash !== tx.targetTxHash) || status !== tx.status) {
                const txIndex = updatedTransactions.findIndex(t => t.id === tx.id)

                if (txIndex !== -1) {
                  const oldStatus = updatedTransactions[txIndex].status
                  updatedTransactions[txIndex] = {
                    ...updatedTransactions[txIndex],
                    targetTxHash: txHash || updatedTransactions[txIndex].targetTxHash,
                    status: status || updatedTransactions[txIndex].status,
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
                    } else if (status === 'Failed') {
                      crossChainMixpanelHandler(CROSS_CHAIN_MIXPANEL_TYPE.CROSS_CHAIN_SWAP_FAILED, {
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
  }, [pendingTxs, transactions, setTransactions, crossChainMixpanelHandler])

  const theme = useTheme()

  const [currentPage, setCurrentPage] = useState(1)

  return (
    <>
      {upToSmall ? (
        <Text fontWeight={500} fontSize={14} color={theme.subText}>
          {t`HISTORY`}
        </Text>
      ) : (
        <TableHeader>
          <Text>{t`CREATED`}</Text>
          <Text>{t`STATUS`}</Text>
          <Text>{t`ROUTE`}</Text>
          <Text>{t`AMOUNT`}</Text>
          <Text textAlign="right">{t`ACTIONS`}</Text>
        </TableHeader>
      )}
      {transactions.length === 0 && (
        <Text color={theme.subText} padding="36px" textAlign="center">
          {t`No transaction found`}
        </Text>
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
            <Flex sx={{ gap: '4px' }} alignItems="center">
              <img
                src={registry.getAdapter(tx.adapter)?.getIcon()}
                style={{ borderRadius: '50%' }}
                width={16}
                height={16}
                alt=""
              />
              <Text>{format(new Date(tx.timestamp), 'dd/MM/yyyy')}</Text>
              <Text color={theme.subText}>{format(new Date(tx.timestamp), 'HH:mm:ss')}</Text>
            </Flex>
            {tx.sender && (
              <Flex mt="8px" color={theme.blue} fontSize="14px" sx={{ gap: '4px' }} alignItems="center">
                <Text color={theme.subText}>{t`Sender:`}</Text>{' '}
                {tx.sender.includes('.near') ? tx.sender : shortenHash(tx.sender)}
                <CopyHelper toCopy={tx.sender} />
              </Flex>
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
        const status = (
          <Flex
            sx={{
              borderRadius: '999px',
              padding: '2px 8px',
              width: 'fit-content',
              height: 'fit-content',
              background: rgba(
                tx.status === 'Success' ? theme.primary : tx.status === 'Failed' ? theme.red : theme.warning,
                0.2,
              ),
              color: tx.status === 'Success' ? theme.primary : tx.status === 'Failed' ? theme.red : theme.warning,
              fontSize: '12px',
            }}
          >
            {tx.status ? statusLabel : t`Processing`}
          </Flex>
        )
        const fromto = (
          <Flex alignItems="center" color={theme.subText} sx={{ gap: '4px' }}>
            <img src={sourceChainLogo} alt="" width={16} height={16} />
            <ChevronRight size={14} />
            <img src={targetChainLogo} alt="" width={16} height={16} />
          </Flex>
        )

        const amount = (
          <div style={{ zIndex: -1 }}>
            <Flex sx={{ gap: '4px' }} alignItems="center" color={theme.subText} fontSize="12px">
              <TokenLogoWithChain chainId={tx.sourceChain as any} currency={tx.sourceToken} />-
              {formatDisplayNumber(formatUnits(BigInt(tx.inputAmount), tx.sourceToken.decimals), {
                significantDigits: 6,
              })}{' '}
              {tx.sourceToken.symbol}
            </Flex>
            <Flex sx={{ gap: '4px' }} alignItems="center" color={theme.subText} mt="8px" fontSize="12px">
              <TokenLogoWithChain chainId={tx.targetChain as any} currency={tx.targetToken} />+
              {formatDisplayNumber(formatUnits(BigInt(tx.outputAmount), tx.targetToken.decimals), {
                significantDigits: 6,
              })}{' '}
              {tx.targetToken.symbol}
            </Flex>
          </div>
        )

        const sourceTx = (
          <Flex alignItems="center" sx={{ gap: '8px' }}>
            {shortenHash(tx.sourceTxHash)}
            <ExternalLinkIcon
              color={theme.subText}
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
          </Flex>
        )
        const fill = tx.targetTxHash ? (
          <Flex alignItems="center" sx={{ gap: '8px' }}>
            {shortenHash(tx.targetTxHash)}
            <ExternalLinkIcon
              color={theme.subText}
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
          </Flex>
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
            <Flex key={tx.id} flexDirection="column" sx={{ gap: '12px' }} mt="24px">
              <Flex justifyContent="space-between" alignItems="center" paddingX="12px">
                {time} {status}
              </Flex>

              <Flex justifyContent="space-between" alignItems="center" paddingX="12px">
                {fromto} {amount}
              </Flex>

              <Flex
                fontSize={14}
                justifyContent="space-between"
                alignItems="center"
                paddingX="12px"
                color={theme.subText}
              >
                <Text color={theme.text}>{t`Deposit:`}</Text>
                {sourceTx}
              </Flex>
              <Flex
                fontSize={14}
                justifyContent="space-between"
                alignItems="center"
                paddingX="12px"
                color={theme.subText}
              >
                <Text color={theme.text}>{t`Fill:`}</Text>
                {fill}
              </Flex>
              <Divider></Divider>
            </Flex>
          )
        }

        return (
          <TableRow key={tx.id}>
            {time}

            {status}

            {fromto}

            {amount}

            <div>
              <Flex justifyContent="flex-end" sx={{ gap: '4px' }} color={theme.subText}>
                <Text color={theme.text}>{t`Deposit:`}</Text>
                {sourceTx}
              </Flex>

              <Flex justifyContent="flex-end" sx={{ gap: '4px' }} color={theme.subText} mt="8px">
                <Text color={theme.text}>{t`Fill:`}</Text> {fill}
              </Flex>
            </div>
          </TableRow>
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
